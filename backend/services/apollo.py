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


async def discover_companies(icp: ICPConfig, per_page: int = 25, page: int = 1) -> List[Company]:
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
        "page": page,
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


def _expand_title_terms(target_roles: List[str], icp_keywords: List[str]) -> List[str]:
    """
    Build a broader set of title search terms from ICP target_roles + keywords.
    Apollo person_titles does partial substring match — so we extract individual
    meaningful words to catch title variations Apollo would otherwise miss.
    e.g. "Talent Development" → also includes "Talent", "Acquisition", "Training", etc.
    """
    terms = set(target_roles)  # start with exact role strings

    # Core HR/L&D domain keywords that broaden the net
    domain_terms = {
        "Learning", "Development", "Training", "Talent", "HR",
        "Human Resources", "People", "L&D", "Organizational",
        "Capability", "Performance", "Culture", "Workforce",
    }
    terms.update(domain_terms)

    # Also extract individual words from target_roles (len > 3 to skip "of", "and")
    for role in target_roles:
        for word in role.split():
            if len(word) > 3:
                terms.add(word)

    # And from ICP keywords
    for kw in icp_keywords:
        terms.add(kw)
        for word in kw.split():
            if len(word) > 3:
                terms.add(word)

    return list(terms)


def _score_person_title(title: str, target_roles: List[str], icp_keywords: List[str]) -> int:
    """
    Score how relevant a person's title is to ICP.
    Higher = more relevant. Used to sort contacts before returning.
    """
    if not title:
        return 0
    title_lower = title.lower()
    score = 0

    # Exact target role match → highest value
    for role in target_roles:
        if role.lower() in title_lower:
            score += 20

    # ICP keyword in title
    for kw in icp_keywords:
        if kw.lower() in title_lower:
            score += 10

    # Seniority bonus (we want decision makers)
    seniority_map = {
        "chief": 15, "c-suite": 15, "president": 15,
        "director": 12, "head": 10, "vp": 12, "vice president": 12,
        "manager": 6, "lead": 5, "senior": 4, "specialist": 2,
    }
    for term, bonus in seniority_map.items():
        if term in title_lower:
            score += bonus
            break  # only count highest seniority match

    return score


async def resolve_contact(
    company_id: str,
    target_roles: List[str],
    icp_keywords: List[str] = [],
) -> List[Contact]:
    """
    Find all relevant contacts at a company based on target roles + ICP keywords.

    Two improvements over naive search:
    1. Broadened title terms — catches variations like "Talent Acquisition"
       even when ICP only lists "Talent Development"
    2. Relevance sorting — fetches 10 candidates, scores each by title match
       to target_roles/keywords + seniority, returns top 5 sorted by score.

    Step 1: mixed_people/api_search (PEOPLE key) → broad candidate pool (10)
    Step 2: people/match (ENRICH key) → enrich only top-scored person (credit-efficient)
    """
    expanded_titles = _expand_title_terms(target_roles, icp_keywords)

    search_payload = {
        "organization_ids": [company_id],
        "person_titles": expanded_titles,
        "per_page": 10,
        "page": 1,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: fetch up to 10 candidates with broader title match
        resp = await client.post(
            f"{APOLLO_BASE}/mixed_people/api_search",
            headers=_headers(APOLLO_API_KEY_PEOPLE),
            json=search_payload,
        )
        if resp.status_code in (403, 402):
            return []
        resp.raise_for_status()
        people = resp.json().get("people", [])
        if not people:
            return []

        # Score and sort by ICP relevance, take top 5
        people_scored = sorted(
            people,
            key=lambda p: _score_person_title(p.get("title", ""), target_roles, icp_keywords),
            reverse=True,
        )
        top5 = people_scored[:5]

        contacts: List[Contact] = []

        # Step 2: enrich only the top-scored person (preserve API credits)
        top = top5[0]
        top_id = top.get("id")
        enrich_payload: dict = {"id": top_id} if top_id else {
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
            contacts.append(Contact(
                name=enriched.get("name") or top.get("first_name") or None,
                role=enriched.get("title") or top.get("title"),
                linkedin_url=enriched.get("linkedin_url"),
                email=enriched.get("email"),
                phone=(
                    enriched.get("phone_numbers", [{}])[0].get("raw_number")
                    if enriched.get("phone_numbers") else None
                ),
            ))
        else:
            contacts.append(Contact(
                name=top.get("first_name") or None,
                role=top.get("title"),
                linkedin_url=None,
                email=None,
                phone=None,
            ))

        # Remaining top4 — partial data only (no extra enrich calls)
        for person in top5[1:]:
            full_name = " ".join(filter(None, [
                person.get("first_name", ""),
                person.get("last_name", ""),
            ])) or None
            contacts.append(Contact(
                name=full_name,
                role=person.get("title"),
                linkedin_url=person.get("linkedin_url"),
                email=person.get("email"),
                phone=None,
            ))

        return contacts


def _extract_location(org: dict) -> Optional[str]:
    city = org.get("city", "")
    country = org.get("country", "")
    parts = [p for p in [city, country] if p]
    return ", ".join(parts) if parts else None
