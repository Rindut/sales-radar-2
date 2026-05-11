"""
Unit tests for pure utility functions in services/apollo.py
Tests _expand_title_terms and _score_person_title — no API calls needed.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from services.apollo import _expand_title_terms, _score_person_title


TARGET_ROLES = ["Head of Learning", "L&D Manager", "Talent Development"]
ICP_KEYWORDS = ["learning", "training", "talent development", "upskilling"]


# ─── _expand_title_terms ─────────────────────────────────────────────────────

class TestExpandTitleTerms:
    def test_returns_list(self):
        result = _expand_title_terms(TARGET_ROLES, ICP_KEYWORDS)
        assert isinstance(result, list)

    def test_includes_original_target_roles(self):
        result = _expand_title_terms(TARGET_ROLES, ICP_KEYWORDS)
        for role in TARGET_ROLES:
            assert role in result

    def test_includes_core_domain_terms(self):
        result = _expand_title_terms([], [])
        domain_terms = ["Learning", "Training", "Talent", "HR", "People"]
        for term in domain_terms:
            assert term in result, f"Missing domain term: {term}"

    def test_extracts_words_from_roles(self):
        result = _expand_title_terms(["Head of Learning"], [])
        assert "Head" in result
        assert "Learning" in result

    def test_skips_short_words(self):
        result = _expand_title_terms(["Head of Learning"], [])
        # "of" is 2 chars, should not be added as standalone
        assert "of" not in result

    def test_includes_icp_keywords(self):
        result = _expand_title_terms([], ["upskilling", "reskilling"])
        assert "upskilling" in result
        assert "reskilling" in result

    def test_no_duplicates(self):
        result = _expand_title_terms(["Learning"], ["learning"])
        # Even if "Learning" appears in both roles and domain terms, list should not have excessive duplicates
        # (set deduplication means each unique term appears once)
        assert len(result) == len(set(result))

    def test_empty_inputs_returns_domain_terms_only(self):
        result = _expand_title_terms([], [])
        assert len(result) > 0  # at least domain terms


# ─── _score_person_title ─────────────────────────────────────────────────────

class TestScorePersonTitle:
    def test_empty_title_returns_zero(self):
        assert _score_person_title("", TARGET_ROLES, ICP_KEYWORDS) == 0

    def test_none_title_returns_zero(self):
        assert _score_person_title(None, TARGET_ROLES, ICP_KEYWORDS) == 0

    def test_exact_role_match_adds_20(self):
        score = _score_person_title("Head of Learning", TARGET_ROLES, ICP_KEYWORDS)
        assert score >= 20

    def test_icp_keyword_match_adds_10(self):
        # Title that matches keyword but not a specific role
        score_with = _score_person_title("Corporate Training Specialist", TARGET_ROLES, ["training"])
        score_without = _score_person_title("Corporate Procurement Specialist", TARGET_ROLES, [])
        assert score_with > score_without

    def test_chief_seniority_bonus(self):
        score = _score_person_title("Chief Learning Officer", [], [])
        assert score >= 15  # seniority bonus for "chief"

    def test_director_seniority_bonus(self):
        score = _score_person_title("Learning Director", [], [])
        assert score >= 12

    def test_head_seniority_bonus(self):
        score = _score_person_title("Head of Talent", [], [])
        assert score >= 10

    def test_vp_seniority_bonus(self):
        score = _score_person_title("VP of Human Resources", [], [])
        assert score >= 12

    def test_manager_seniority_bonus(self):
        score = _score_person_title("HR Manager", [], [])
        assert score >= 6

    def test_specialist_gets_low_seniority(self):
        score = _score_person_title("Learning Specialist", [], [])
        assert score >= 2

    def test_irrelevant_title_scores_zero(self):
        score = _score_person_title("Finance Analyst", [], [])
        assert score == 0

    def test_scoring_is_case_insensitive(self):
        score_upper = _score_person_title("HEAD OF LEARNING", TARGET_ROLES, ICP_KEYWORDS)
        score_lower = _score_person_title("head of learning", TARGET_ROLES, ICP_KEYWORDS)
        assert score_upper == score_lower

    def test_clo_scores_higher_than_specialist(self):
        clo = _score_person_title("Chief Learning Officer", TARGET_ROLES, ICP_KEYWORDS)
        specialist = _score_person_title("Learning Specialist", TARGET_ROLES, ICP_KEYWORDS)
        assert clo > specialist

    def test_multiple_role_matches_stack(self):
        # Title that matches multiple target roles
        roles = ["Learning", "Development"]
        score = _score_person_title("Learning and Development Manager", roles, [])
        # Should get 20 + 20 + seniority
        assert score >= 40

    def test_only_one_seniority_bonus_counted(self):
        # "chief" and "director" both appear, only highest should count
        score_chief_only = _score_person_title("Chief Officer", [], [])
        score_chief_director = _score_person_title("Chief Director Officer", [], [])
        # Both should get same seniority bonus (break after first match)
        assert score_chief_only == score_chief_director
