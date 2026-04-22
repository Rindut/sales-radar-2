from typing import List, Tuple
from models.schemas import Company, LeadScore, ICPConfig


# PRIORITY = Pain, Relevance, Industry, Opportunity, Reach, ICP fit, Timing, YOY signal
# Each dimension: 0-10, total normalized to 0-100

WEIGHTS = {
    "pain":        0.20,  # Does the company likely feel the learning pain?
    "relevance":   0.20,  # How relevant is Bawana's offering to them?
    "industry":    0.20,  # Is the industry a priority target?
    "opportunity": 0.15,  # Company size = deal size potential
    "reach":       0.10,  # Can we actually reach them (has contact)?
    "icp_fit":     0.10,  # How closely do they match ICP?
    "timing":      0.05,  # Any signals of current need? (growth, hiring)
}


PRIORITY_INDUSTRIES = [
    "banking", "financial services", "insurance",
    "retail", "hospitality", "telecommunications",
]

LARGE_SCALE_KEYWORDS = [
    "learning", "training", "development", "hr", "talent",
    "academy", "university", "onboarding", "upskilling",
]


def score_companies(
    companies: List[Company],
    icp: ICPConfig,
    top_n: int = 5,
) -> List[Tuple[Company, LeadScore]]:
    """
    Score and rank companies. Return top N with scores.
    """
    scored = []
    for company in companies:
        lead_score = _score_company(company, icp)
        scored.append((company, lead_score))

    scored.sort(key=lambda x: x[1].total, reverse=True)
    return scored[:top_n]


def _score_company(company: Company, icp: ICPConfig) -> LeadScore:
    breakdown = {}
    reasoning = []

    # --- Pain (0-10) ---
    pain = 5  # baseline — all B2B companies have some learning need
    if company.employee_count and company.employee_count > 500:
        pain += 2
        reasoning.append(f"Ukuran perusahaan ({company.employee_count} karyawan) menunjukkan kebutuhan learning di skala besar")
    if company.description:
        desc_lower = company.description.lower()
        if any(kw in desc_lower for kw in LARGE_SCALE_KEYWORDS):
            pain += 2
            reasoning.append("Deskripsi perusahaan mengindikasikan fokus pada pengembangan SDM")
    breakdown["pain"] = min(pain, 10)

    # --- Relevance (0-10) ---
    relevance = 4
    if company.industry:
        ind_lower = company.industry.lower()
        if any(pi in ind_lower for pi in PRIORITY_INDUSTRIES):
            relevance += 4
            reasoning.append(f"Industri '{company.industry}' adalah target prioritas Bawana")
    breakdown["relevance"] = min(relevance, 10)

    # --- Industry (0-10) ---
    industry_score = 3
    if company.industry:
        ind_lower = company.industry.lower()
        if "bank" in ind_lower or "financial" in ind_lower:
            industry_score = 10
            reasoning.append("Sektor perbankan = highest priority untuk Bawana (OJK compliance training)")
        elif "insurance" in ind_lower:
            industry_score = 8
        elif "retail" in ind_lower or "hospitality" in ind_lower:
            industry_score = 7
            reasoning.append(f"Sektor {company.industry} memiliki kebutuhan frontliner training yang tinggi")
        elif "telco" in ind_lower or "telecom" in ind_lower:
            industry_score = 7
    breakdown["industry"] = industry_score

    # --- Opportunity / Deal Size (0-10) ---
    opp = 3
    if company.employee_count:
        if company.employee_count > 5000:
            opp = 10
            reasoning.append(f"Karyawan {company.employee_count}+ = potential enterprise deal besar")
        elif company.employee_count > 1000:
            opp = 8
        elif company.employee_count > 500:
            opp = 6
        elif company.employee_count > 200:
            opp = 4
    breakdown["opportunity"] = opp

    # --- Reach (0-10) — proxy: has website or linkedin ---
    reach = 5
    if company.website:
        reach += 2
    if company.linkedin_url:
        reach += 3
    breakdown["reach"] = min(reach, 10)

    # --- ICP Fit (0-10) ---
    icp_score = 0
    if company.industry:
        for ind in icp.industries:
            if ind.lower() in company.industry.lower():
                icp_score += 4
                break
    if company.location:
        for loc in icp.locations:
            if loc.lower() in company.location.lower():
                icp_score += 3
                break
    if company.employee_count:
        for rng in icp.employee_ranges:
            parts = rng.split(",")
            if len(parts) == 2:
                low, high = int(parts[0]), int(parts[1])
                if low <= company.employee_count <= high:
                    icp_score += 3
                    break
    breakdown["icp_fit"] = min(icp_score, 10)

    # --- Timing (0-10) --- simplified, based on available signals
    timing = 5  # neutral
    breakdown["timing"] = timing

    # --- Weighted Total ---
    total = sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS) * 10
    total = round(min(total, 100), 1)

    if not reasoning:
        reasoning.append(f"Perusahaan ini cocok dengan kriteria ICP Bawana berdasarkan industri dan ukuran")

    return LeadScore(total=total, breakdown=breakdown, reasoning=reasoning)
