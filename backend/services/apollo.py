import httpx
from typing import List, Optional
from models.schemas import Company, Contact, ICPConfig
from config import APOLLO_API_KEY_ORG, APOLLO_API_KEY_MIXED, APOLLO_API_KEY_PEOPLE, APOLLO_API_KEY_ENRICH

APOLLO_BASE = "https://api.apollo.io/v1"

def _headers(key: str) -> dict:
    return {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": key or "",
    }

HEADERS = _headers(APOLLO_API_KEY_ORG or "")


async def discover_companies(icp: ICPConfig, per_page: int = 25) -> List[Company]:
    """
    Search Apollo for companies matching ICP.
    Returns raw list before scoring.
    """
    payload = {
        "organization_locations": icp.locations,
        "organization_num_employees_ranges": icp.employee_ranges,
        "organization_industry_tag_ids": [],  # Apollo uses tags, mapped below
        "q_organization_keyword_tags": icp.keywords,
        "per_page": per_page,
        "page": 1,
    }

    # Apollo uses industry names directly in some endpoints
    if icp.industries:
        payload["organization_industry_tag_names"] = icp.industries

    async with httpx.AsyncClient(timeout=30) as client:
        # organizations/search → richer data (industry, employee count, keywords)
        resp = await client.post(
            f"{APOLLO_BASE}/organizations/search",
            headers=_headers(APOLLO_API_KEY_ORG),
            json=payload,
        )
        if resp.status_code == 403:
            # Fallback: mixed_companies/search
            resp = await client.post(
                f"{APOLLO_BASE}/mixed_companies/search",
                headers=_headers(APOLLO_API_KEY_MIXED),
                json=payload,
            )
        resp.raise_for_status()
        data = resp.json()

    companies = []
    for org in data.get("organizations", []):
        companies.append(
            Company(
                id=org.get("id", ""),
                name=org.get("name", ""),
                industry=org.get("industry", None),
                employee_count=org.get("estimated_num_employees", None),
                description=org.get("short_description", None),
                website=org.get("website_url", None),
                linkedin_url=org.get("linkedin_url", None),
                location=_extract_location(org),
                keywords=org.get("keywords", []),
                founded_year=org.get("founded_year", None),
                revenue=org.get("organization_revenue", None) or None,
            )
        )

    return companies


async def get_company_detail(company_id: str) -> Optional[Company]:
    """Fetch single company detail by Apollo org ID."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{APOLLO_BASE}/organizations/{company_id}",
            headers=HEADERS,
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        org = resp.json().get("organization", {})

    return Company(
        id=org.get("id", ""),
        name=org.get("name", ""),
        industry=org.get("industry", None),
        employee_count=org.get("estimated_num_employees", None),
        description=org.get("short_description", None),
        website=org.get("website_url", None),
        linkedin_url=org.get("linkedin_url", None),
        location=_extract_location(org),
    )


async def resolve_contact(company_id: str, target_roles: List[str]) -> Optional[Contact]:
    """
    Find the best contact at a company based on target roles.
    Step 1: mixed_people/api_search (PEOPLE key) → get person id + partial info
    Step 2: people/match (ENRICH key) → unlock full name, email, linkedin
    """
    search_payload = {
        "organization_ids": [company_id],
        "person_titles": target_roles,
        "per_page": 5,
        "page": 1,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: find person via people search
        resp = await client.post(
            f"{APOLLO_BASE}/mixed_people/api_search",
            headers=_headers(APOLLO_API_KEY_PEOPLE),
            json=search_payload,
        )
        if resp.status_code in (403, 402):
            return None
        resp.raise_for_status()
        people = resp.json().get("people", [])
        if not people:
            return None

        person = people[0]
        person_id = person.get("id")
        first_name = person.get("first_name", "")
        title = person.get("title")

        # Step 2: enrich to get full name + email + linkedin
        enrich_payload: dict = {"id": person_id} if person_id else {
            "organization_id": company_id,
            "title": target_roles[0] if target_roles else None,
        }
        enrich_resp = await client.post(
            f"{APOLLO_BASE}/people/match",
            headers=_headers(APOLLO_API_KEY_ENRICH),
            json=enrich_payload,
        )

        if enrich_resp.status_code == 200:
            enriched = enrich_resp.json().get("person") or {}
            name = enriched.get("name") or first_name or None
            return Contact(
                name=name,
                role=enriched.get("title") or title,
                linkedin_url=enriched.get("linkedin_url"),
                email=enriched.get("email"),
                phone=(
                    enriched.get("phone_numbers", [{}])[0].get("raw_number")
                    if enriched.get("phone_numbers") else None
                ),
            )

        # Enrich failed — return partial data from step 1
        return Contact(
            name=first_name or None,
            role=title,
            linkedin_url=None,
            email=None,
            phone=None,
        )


def _extract_location(org: dict) -> Optional[str]:
    city = org.get("city", "")
    country = org.get("country", "")
    parts = [p for p in [city, country] if p]
    return ", ".join(parts) if parts else None
