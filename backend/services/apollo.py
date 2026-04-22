import httpx
from typing import List, Optional
from models.schemas import Company, Contact, ICPConfig
from config import APOLLO_API_KEY

APOLLO_BASE = "https://api.apollo.io/v1"

HEADERS = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "X-Api-Key": APOLLO_API_KEY or "",
}


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
        resp = await client.post(
            f"{APOLLO_BASE}/organizations/search",
            headers=HEADERS,
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
    Uses Apollo People Search.
    """
    payload = {
        "organization_ids": [company_id],
        "person_titles": target_roles,
        "per_page": 5,
        "page": 1,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{APOLLO_BASE}/people/search",
            headers=HEADERS,
            json=payload,
        )
        if resp.status_code in (403, 402):
            return None
        resp.raise_for_status()
        data = resp.json()

    people = data.get("people", [])
    if not people:
        return None

    # Take first (most relevant) person
    person = people[0]
    return Contact(
        name=person.get("name"),
        role=person.get("title"),
        linkedin_url=person.get("linkedin_url"),
        email=person.get("email"),
        phone=person.get("phone_numbers", [{}])[0].get("raw_number") if person.get("phone_numbers") else None,
    )


def _extract_location(org: dict) -> Optional[str]:
    city = org.get("city", "")
    country = org.get("country", "")
    parts = [p for p in [city, country] if p]
    return ", ".join(parts) if parts else None
