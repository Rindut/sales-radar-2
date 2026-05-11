"""
Unit tests for services/scoring.py
Tests the PRIORITY scoring engine — pure functions, no external dependencies.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from models.schemas import Company, ICPConfig
from services.scoring import _score_company, score_companies, WEIGHTS


# ─── Fixtures ────────────────────────────────────────────────────────────────

def make_icp(**kwargs) -> ICPConfig:
    defaults = dict(
        industries=["banking", "financial services"],
        employee_ranges=["500,50000"],
        keywords=["learning", "training", "talent"],
        locations=["Indonesia"],
        target_roles=["Head of Learning", "L&D Manager"],
    )
    defaults.update(kwargs)
    return ICPConfig(**defaults)

def make_company(**kwargs) -> Company:
    defaults = dict(
        id="c1", name="PT Test Bank",
        industry="Banking",
        employee_count=2000,
        location="Jakarta, Indonesia",
        website="https://testbank.co.id",
        linkedin_url="https://linkedin.com/company/testbank",
    )
    defaults.update(kwargs)
    return Company(**defaults)


# ─── Score range ─────────────────────────────────────────────────────────────

class TestScoreRange:
    def test_score_between_0_and_100(self):
        icp = make_icp()
        company = make_company()
        result = _score_company(company, icp)
        assert 0 <= result.total <= 100

    def test_score_is_float(self):
        result = _score_company(make_company(), make_icp())
        assert isinstance(result.total, float)

    def test_breakdown_has_all_weight_keys(self):
        result = _score_company(make_company(), make_icp())
        for key in WEIGHTS:
            assert key in result.breakdown, f"Missing breakdown key: {key}"

    def test_breakdown_values_between_0_and_10(self):
        result = _score_company(make_company(), make_icp())
        for key, val in result.breakdown.items():
            assert 0 <= val <= 10, f"{key} = {val} is out of range"

    def test_reasoning_is_non_empty_list(self):
        result = _score_company(make_company(), make_icp())
        assert isinstance(result.reasoning, list)
        assert len(result.reasoning) >= 1


# ─── Industry scoring ─────────────────────────────────────────────────────────

class TestIndustryScoring:
    def test_banking_gets_highest_industry_score(self):
        result = _score_company(make_company(industry="Banking"), make_icp())
        assert result.breakdown["industry"] == 10

    def test_financial_services_gets_highest_industry_score(self):
        result = _score_company(make_company(industry="Financial Services"), make_icp())
        assert result.breakdown["industry"] == 10

    def test_insurance_gets_high_industry_score(self):
        result = _score_company(make_company(industry="Insurance"), make_icp())
        assert result.breakdown["industry"] == 8

    def test_retail_gets_good_industry_score(self):
        result = _score_company(make_company(industry="Retail"), make_icp())
        assert result.breakdown["industry"] == 7

    def test_unknown_industry_gets_low_score(self):
        result = _score_company(make_company(industry="Agriculture"), make_icp())
        assert result.breakdown["industry"] == 3

    def test_no_industry_gets_low_score(self):
        result = _score_company(make_company(industry=None), make_icp())
        assert result.breakdown["industry"] == 3


# ─── Opportunity (deal size) scoring ─────────────────────────────────────────

class TestOpportunityScoring:
    def test_large_company_gets_high_opportunity(self):
        result = _score_company(make_company(employee_count=10000), make_icp())
        assert result.breakdown["opportunity"] == 10

    def test_mid_large_company_score(self):
        result = _score_company(make_company(employee_count=2000), make_icp())
        assert result.breakdown["opportunity"] == 8

    def test_mid_company_score(self):
        result = _score_company(make_company(employee_count=700), make_icp())
        assert result.breakdown["opportunity"] == 6

    def test_small_mid_company_score(self):
        result = _score_company(make_company(employee_count=300), make_icp())
        assert result.breakdown["opportunity"] == 4

    def test_small_company_gets_low_opportunity(self):
        result = _score_company(make_company(employee_count=50), make_icp())
        assert result.breakdown["opportunity"] == 3

    def test_no_employee_count_gets_base_score(self):
        result = _score_company(make_company(employee_count=None), make_icp())
        assert result.breakdown["opportunity"] == 3


# ─── Reach scoring ────────────────────────────────────────────────────────────

class TestReachScoring:
    def test_website_and_linkedin_gives_max_reach(self):
        result = _score_company(make_company(website="https://a.com", linkedin_url="https://linkedin.com/a"), make_icp())
        assert result.breakdown["reach"] == 10

    def test_only_linkedin_gives_partial_reach(self):
        result = _score_company(make_company(website=None, linkedin_url="https://linkedin.com/a"), make_icp())
        assert result.breakdown["reach"] == 8

    def test_only_website_gives_partial_reach(self):
        result = _score_company(make_company(website="https://a.com", linkedin_url=None), make_icp())
        assert result.breakdown["reach"] == 7

    def test_no_contact_info_gives_base_reach(self):
        result = _score_company(make_company(website=None, linkedin_url=None), make_icp())
        assert result.breakdown["reach"] == 5


# ─── ICP Fit scoring ──────────────────────────────────────────────────────────

class TestICPFitScoring:
    def test_full_icp_match_gives_high_score(self):
        icp = make_icp(industries=["banking"], locations=["Indonesia"], employee_ranges=["500,50000"])
        company = make_company(industry="Banking", location="Jakarta, Indonesia", employee_count=2000)
        result = _score_company(company, icp)
        assert result.breakdown["icp_fit"] >= 7

    def test_no_icp_match_gives_zero(self):
        icp = make_icp(industries=["banking"], locations=["Singapore"], employee_ranges=["10000,999999"])
        company = make_company(industry="Agriculture", location="Jakarta", employee_count=100)
        result = _score_company(company, icp)
        assert result.breakdown["icp_fit"] == 0

    def test_industry_match_adds_to_icp_score(self):
        icp = make_icp(industries=["banking"])
        company_match = make_company(industry="Banking", location="Singapore", employee_count=50)
        company_no_match = make_company(industry="Agriculture", location="Singapore", employee_count=50)
        r1 = _score_company(company_match, icp)
        r2 = _score_company(company_no_match, icp)
        assert r1.breakdown["icp_fit"] > r2.breakdown["icp_fit"]


# ─── Pain scoring ─────────────────────────────────────────────────────────────

class TestPainScoring:
    def test_large_company_increases_pain(self):
        small = _score_company(make_company(employee_count=100), make_icp())
        large = _score_company(make_company(employee_count=1000), make_icp())
        assert large.breakdown["pain"] > small.breakdown["pain"]

    def test_learning_keywords_in_description_increases_pain(self):
        no_kw = _score_company(make_company(description="A large bank."), make_icp())
        with_kw = _score_company(make_company(description="We invest in learning and training our people."), make_icp())
        assert with_kw.breakdown["pain"] > no_kw.breakdown["pain"]

    def test_pain_never_exceeds_10(self):
        company = make_company(employee_count=99999, description="learning training development talent")
        result = _score_company(company, make_icp())
        assert result.breakdown["pain"] <= 10


# ─── Relative ranking ─────────────────────────────────────────────────────────

class TestRelativeRanking:
    def test_banking_giant_scores_higher_than_small_agro(self):
        icp = make_icp()
        bank = make_company(id="b1", name="BCA", industry="Banking", employee_count=30000,
                            website="https://bca.co.id", linkedin_url="https://linkedin.com/bca")
        agro = make_company(id="a1", name="PT Agro", industry="Agriculture", employee_count=100,
                            website=None, linkedin_url=None)
        r_bank = _score_company(bank, icp)
        r_agro = _score_company(agro, icp)
        assert r_bank.total > r_agro.total

    def test_score_companies_returns_top_n(self):
        icp = make_icp()
        companies = [make_company(id=str(i), name=f"Company {i}") for i in range(10)]
        result = score_companies(companies, icp, top_n=3)
        assert len(result) == 3

    def test_score_companies_sorted_descending(self):
        icp = make_icp()
        companies = [
            make_company(id="1", industry="Agriculture", employee_count=50),
            make_company(id="2", industry="Banking", employee_count=10000),
            make_company(id="3", industry="Retail", employee_count=500),
        ]
        result = score_companies(companies, icp, top_n=3)
        scores = [r[1].total for r in result]
        assert scores == sorted(scores, reverse=True)

    def test_score_companies_empty_list(self):
        result = score_companies([], make_icp(), top_n=5)
        assert result == []

    def test_score_companies_fewer_than_top_n(self):
        companies = [make_company(id="1")]
        result = score_companies(companies, make_icp(), top_n=5)
        assert len(result) == 1
