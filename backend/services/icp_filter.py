from typing import List
from models.schemas import Company, ICPConfig

EXCLUDED_INDUSTRIES = [
    "higher education",
    "education",
    "university",
    "government administration",
    "non-profit",
    "religious institutions",
    "primary/secondary education",
]


def apply_icp_filter(companies: List[Company], icp: ICPConfig) -> List[Company]:
    filtered = []
    for company in companies:
        if _is_excluded(company):
            continue
        score = _icp_match_score(company, icp)
        if score >= 1:
            filtered.append(company)
    return filtered


def _is_excluded(company: Company) -> bool:
    if not company.industry:
        return False
    ind_lower = company.industry.lower()
    return any(excl in ind_lower for excl in EXCLUDED_INDUSTRIES)


def _icp_match_score(company: Company, icp: ICPConfig) -> int:
    score = 0
    if company.industry:
        for ind in icp.industries:
            if ind.lower() in company.industry.lower():
                score += 2
                break
    if company.employee_count:
        for range_str in icp.employee_ranges:
            parts = range_str.split(",")
            if len(parts) == 2:
                try:
                    low, high = int(parts[0]), int(parts[1])
                    if low <= company.employee_count <= high:
                        score += 1
                        break
                except ValueError:
                    pass
    if company.location:
        for loc in icp.locations:
            if loc.lower() in company.location.lower():
                score += 1
                break
    if company.keywords:
        company_kws = [k.lower() for k in company.keywords]
        for kw in icp.keywords:
            if any(kw.lower() in ck for ck in company_kws):
                score += 1
                break
    return score