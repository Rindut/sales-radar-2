"""
Unit tests for services/icp_filter.py
Tests ICP filtering logic — pure functions, no external dependencies.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from models.schemas import Company, ICPConfig
from services.icp_filter import apply_icp_filter, _is_excluded, _icp_match_score


# ─── Fixtures ────────────────────────────────────────────────────────────────

def make_icp(**kwargs) -> ICPConfig:
    defaults = dict(
        industries=["banking", "financial services", "retail"],
        employee_ranges=["500,50000"],
        keywords=["learning", "training"],
        locations=["Indonesia"],
        target_roles=["Head of Learning"],
    )
    defaults.update(kwargs)
    return ICPConfig(**defaults)

def make_company(**kwargs) -> Company:
    defaults = dict(
        id="c1", name="PT Test Bank",
        industry="Banking",
        employee_count=2000,
        location="Jakarta, Indonesia",
        keywords=["learning", "finance"],
    )
    defaults.update(kwargs)
    return Company(**defaults)


# ─── _is_excluded ─────────────────────────────────────────────────────────────

class TestIsExcluded:
    def test_higher_education_is_excluded(self):
        assert _is_excluded(make_company(industry="Higher Education")) is True

    def test_government_administration_is_excluded(self):
        assert _is_excluded(make_company(industry="Government Administration")) is True

    def test_non_profit_is_excluded(self):
        assert _is_excluded(make_company(industry="Non-Profit Organization Management")) is True

    def test_religious_institutions_is_excluded(self):
        assert _is_excluded(make_company(industry="Religious Institutions")) is True

    def test_primary_secondary_education_is_excluded(self):
        assert _is_excluded(make_company(industry="Primary/Secondary Education")) is True

    def test_banking_is_not_excluded(self):
        assert _is_excluded(make_company(industry="Banking")) is False

    def test_retail_is_not_excluded(self):
        assert _is_excluded(make_company(industry="Retail")) is False

    def test_no_industry_is_not_excluded(self):
        assert _is_excluded(make_company(industry=None)) is False

    def test_exclusion_is_case_insensitive(self):
        assert _is_excluded(make_company(industry="HIGHER EDUCATION")) is True
        assert _is_excluded(make_company(industry="higher education")) is True


# ─── _icp_match_score ────────────────────────────────────────────────────────

class TestICPMatchScore:
    def test_perfect_match_scores_high(self):
        icp = make_icp()
        company = make_company(
            industry="Banking",
            employee_count=2000,
            location="Jakarta, Indonesia",
            keywords=["learning"],
        )
        score = _icp_match_score(company, icp)
        assert score >= 4  # industry(2) + employee(1) + location(1)

    def test_no_match_scores_zero(self):
        icp = make_icp(industries=["banking"], locations=["Singapore"], employee_ranges=["50000,999999"])
        company = make_company(industry="Agriculture", location="Kuala Lumpur", employee_count=50, keywords=[])
        score = _icp_match_score(company, icp)
        assert score == 0

    def test_industry_match_adds_2_points(self):
        icp = make_icp(industries=["banking"], locations=[], employee_ranges=[], keywords=[])
        company_match = make_company(industry="Banking", location=None, employee_count=None, keywords=[])
        company_no_match = make_company(industry="Retail", location=None, employee_count=None, keywords=[])
        assert _icp_match_score(company_match, icp) == 2
        assert _icp_match_score(company_no_match, icp) == 0

    def test_location_match_adds_1_point(self):
        icp = make_icp(industries=[], locations=["Indonesia"], employee_ranges=[], keywords=[])
        company = make_company(industry=None, location="Jakarta, Indonesia", employee_count=None, keywords=[])
        assert _icp_match_score(company, icp) == 1

    def test_employee_range_match_adds_1_point(self):
        icp = make_icp(industries=[], locations=[], employee_ranges=["500,5000"], keywords=[])
        company = make_company(industry=None, location=None, employee_count=1000, keywords=[])
        assert _icp_match_score(company, icp) == 1

    def test_employee_out_of_range_adds_nothing(self):
        icp = make_icp(industries=[], locations=[], employee_ranges=["500,5000"], keywords=[])
        company = make_company(industry=None, location=None, employee_count=50, keywords=[])
        assert _icp_match_score(company, icp) == 0

    def test_keyword_match_adds_1_point(self):
        icp = make_icp(industries=[], locations=[], employee_ranges=[], keywords=["learning"])
        company = make_company(industry=None, location=None, employee_count=None, keywords=["e-learning", "talent"])
        assert _icp_match_score(company, icp) == 1

    def test_invalid_employee_range_format_handled_gracefully(self):
        icp = make_icp(employee_ranges=["invalid", "500,5000"])
        company = make_company(employee_count=1000)
        score = _icp_match_score(company, icp)  # should not raise
        assert isinstance(score, int)

    def test_icp_match_is_case_insensitive(self):
        icp = make_icp(industries=["banking"], locations=["indonesia"])
        company = make_company(industry="BANKING", location="Jakarta, INDONESIA")
        score = _icp_match_score(company, icp)
        assert score >= 3


# ─── apply_icp_filter ─────────────────────────────────────────────────────────

class TestApplyICPFilter:
    def test_relevant_company_passes_filter(self):
        icp = make_icp()
        companies = [make_company(industry="Banking", employee_count=2000, location="Jakarta, Indonesia")]
        result = apply_icp_filter(companies, icp)
        assert len(result) == 1

    def test_excluded_industry_is_removed(self):
        icp = make_icp()
        companies = [make_company(industry="Higher Education", employee_count=2000)]
        result = apply_icp_filter(companies, icp)
        assert len(result) == 0

    def test_zero_icp_score_is_removed(self):
        icp = make_icp(industries=["banking"], locations=["Singapore"], employee_ranges=["50000,999999"], keywords=[])
        companies = [make_company(industry="Agriculture", location="Jakarta", employee_count=50, keywords=[])]
        result = apply_icp_filter(companies, icp)
        assert len(result) == 0

    def test_mixed_list_filters_correctly(self):
        icp = make_icp()
        companies = [
            make_company(id="1", industry="Banking", employee_count=2000, location="Indonesia"),
            make_company(id="2", industry="Higher Education", employee_count=500),
            make_company(id="3", industry="Retail", employee_count=1000, location="Indonesia"),
            make_company(id="4", industry="Agriculture", employee_count=50, location="Malaysia", keywords=[]),
        ]
        result = apply_icp_filter(companies, icp)
        ids = [c.id for c in result]
        assert "1" in ids   # banking - passes
        assert "2" not in ids  # excluded
        assert "3" in ids   # retail - passes
        assert "4" not in ids  # zero score

    def test_empty_list_returns_empty(self):
        result = apply_icp_filter([], make_icp())
        assert result == []

    def test_all_excluded_returns_empty(self):
        icp = make_icp()
        companies = [
            make_company(id="1", industry="Higher Education"),
            make_company(id="2", industry="Government Administration"),
        ]
        result = apply_icp_filter(companies, icp)
        assert result == []

    def test_no_industry_company_not_auto_excluded(self):
        """Company with no industry should not be excluded by _is_excluded (may still fail ICP score)."""
        icp = make_icp(industries=[], locations=["Indonesia"], employee_ranges=["500,50000"], keywords=[])
        companies = [make_company(industry=None, location="Jakarta, Indonesia", employee_count=1000)]
        result = apply_icp_filter(companies, icp)
        assert len(result) == 1  # location + employee match = score >= 1
