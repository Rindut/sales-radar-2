"""
Unit tests for services/sherlock_enrich.py
Covers username derivation and CSV parsing — no subprocess / network needed.
"""
import sys, os, csv, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from models.schemas import Contact
from services.sherlock_enrich import derive_usernames, _parse_csv, MAX_USERNAMES


# ─── derive_usernames ────────────────────────────────────────────────────────

class TestDeriveUsernames:
    def test_email_localpart_is_high_confidence_and_first(self):
        c = Contact(name="Budi Santoso", email="budi.santoso@bca.co.id")
        result = derive_usernames(c)
        assert result[0] == ("budi.santoso", "email_localpart", "high")

    def test_only_one_high_confidence(self):
        c = Contact(name="Budi Santoso", email="budi.santoso@bca.co.id",
                    linkedin_url="https://linkedin.com/in/budi-santoso-1a2b")
        highs = [r for r in result(c) if r[2] == "high"]
        assert len(highs) == 1

    def test_normalized_email_variant_is_low(self):
        c = Contact(email="budi.santoso@bca.co.id")
        names = {u: (s, conf) for u, s, conf in derive_usernames(c)}
        assert names.get("budisantoso") == ("email_localpart", "low")

    def test_linkedin_slug_strips_trailing_hash(self):
        c = Contact(linkedin_url="https://www.linkedin.com/in/budi-santoso-1a2b3c")
        usernames = [u for u, _, _ in derive_usernames(c)]
        assert "budi-santoso" in usernames

    def test_name_permutations(self):
        c = Contact(name="Budi Santoso")
        usernames = [u for u, _, _ in derive_usernames(c)]
        assert "budi.santoso" in usernames
        assert "budisantoso" in usernames
        assert "bsantoso" in usernames

    def test_empty_contact_returns_empty(self):
        assert derive_usernames(Contact()) == []

    def test_dedup_case_insensitive(self):
        c = Contact(name="Budi Santoso", email="Budi.Santoso@bca.co.id")
        usernames = [u for u, _, _ in derive_usernames(c)]
        assert len(usernames) == len(set(u.lower() for u in usernames))

    def test_capped_at_max(self):
        c = Contact(name="Budi Santoso Wijaya", email="budi.santoso@bca.co.id",
                    linkedin_url="https://linkedin.com/in/budi-santoso")
        assert len(derive_usernames(c)) <= MAX_USERNAMES

    def test_high_before_low(self):
        c = Contact(name="Budi Santoso", email="budi.santoso@bca.co.id")
        confidences = [conf for _, _, conf in derive_usernames(c)]
        # once we hit a low, no high should follow
        assert confidences == sorted(confidences, key=lambda x: 0 if x == "high" else 1)


def result(c):  # tiny helper for one test above
    return derive_usernames(c)


# ─── _parse_csv ──────────────────────────────────────────────────────────────

class TestParseCsv:
    def _write_csv(self, folder, rows):
        path = os.path.join(folder, "user.csv")
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=[
                "username", "name", "url_main", "url_user",
                "exists", "http_status", "response_time_s",
            ])
            w.writeheader()
            for r in rows:
                w.writerow(r)
        return path

    def test_returns_only_claimed(self):
        with tempfile.TemporaryDirectory() as d:
            self._write_csv(d, [
                {"username": "user", "name": "GitHub", "url_main": "https://github.com",
                 "url_user": "https://github.com/user", "exists": "Claimed",
                 "http_status": "200", "response_time_s": "0.5"},
                {"username": "user", "name": "Reddit", "url_main": "https://reddit.com",
                 "url_user": "https://reddit.com/user/user", "exists": "Not Found",
                 "http_status": "404", "response_time_s": "0.3"},
            ])
            hits = _parse_csv(d)
            assert hits == [{"site": "GitHub", "url": "https://github.com/user"}]

    def test_empty_folder(self):
        with tempfile.TemporaryDirectory() as d:
            assert _parse_csv(d) == []

    def test_case_insensitive_claimed(self):
        with tempfile.TemporaryDirectory() as d:
            self._write_csv(d, [
                {"username": "user", "name": "Medium", "url_main": "https://medium.com",
                 "url_user": "https://medium.com/@user", "exists": "claimed",
                 "http_status": "200", "response_time_s": "0.5"},
            ])
            assert _parse_csv(d) == [{"site": "Medium", "url": "https://medium.com/@user"}]
