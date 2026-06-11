"""
Sherlock social enrichment service.

Role: ENRICHMENT, not discovery. Apollo gives us name/email/linkedin; this module
derives candidate usernames from that, runs Sherlock against a curated site
whitelist, and returns confirmed public social profiles.

Hard rules (see docs/sherlock-enrichment-plan.md):
- On-demand / per-contact only. NEVER called from the bulk discovery pipeline.
- Curated whitelist only (12 sites). Never the full 400+ default list.
- Public existence only. We store that a profile exists, not its content.
- Results from low-confidence usernames are flagged unverified.
"""

import asyncio
import csv
import glob
import importlib.util
import os
import re
import shutil
import sys
import tempfile
from typing import Awaitable, Callable, List, Optional, Tuple

from models.schemas import Contact, SocialProfile

# --- Site whitelist (12 sites): professional first, then social ---------------
# Names MUST match Sherlock's site catalog (data.json) EXACTLY, including case
# and punctuation. Validated against sherlock-project 0.16.0 (QA-2).
# Note: Facebook, TikTok, Pinterest, and Wellfound/AngelList are NOT in
# Sherlock's catalog and were dropped. Login-wall sites (Twitter, Instagram)
# are the least reliable and may be dropped after measuring hit rate.
SITE_WHITELIST: List[str] = [
    # professional / creator (stronger signal, biased to L&D + content people)
    "Twitter",
    "Medium",
    "About.me",
    "Behance",
    "SlideShare",
    "WordPress",
    "GitHub",
    "DEV Community",
    # social (weaker signal, context only)
    "Instagram",
    "YouTube",
    "Reddit",
    "tumblr",
]

# Per-username Sherlock timeout (seconds) passed to --timeout.
SHERLOCK_SITE_TIMEOUT = 10
# Hard ceiling per single sherlock run (whole subprocess), seconds.
SHERLOCK_RUN_TIMEOUT = 45
# Max candidate usernames we will check per contact (1 high + up to 3 low).
MAX_USERNAMES = 4

# Cache callables: caller injects DB-backed implementations.
# cache_get(username) -> Optional[List[dict]]   (list of {"site","url"}) or None on miss
# cache_set(username, results: List[dict]) -> None
CacheGet = Callable[[str], Awaitable[Optional[List[dict]]]]
CacheSet = Callable[[str, List[dict]], Awaitable[None]]


# --- Username derivation ------------------------------------------------------

def _clean(token: str) -> str:
    return re.sub(r"[^a-z0-9._-]", "", token.strip().lower())


def _alnum(token: str) -> str:
    return re.sub(r"[^a-z0-9]", "", token.strip().lower())


def derive_usernames(contact: Contact) -> List[Tuple[str, str, str]]:
    """
    Return ordered list of (username, source, confidence), highest confidence
    first, deduped case-insensitively.

    Confidence model (kept binary to match schema):
      - "high": exact email local-part. The one signal we actually trust.
      - "low":  everything else (normalized email, linkedin slug, name guesses).
    """
    candidates: List[Tuple[str, str, str]] = []

    # 1. Email local-part (exact) -> high
    if contact.email and "@" in contact.email:
        local = _clean(contact.email.split("@", 1)[0])
        if local:
            candidates.append((local, "email_localpart", "high"))
            # normalized variant (drop separators) -> low
            local_alnum = _alnum(local)
            if local_alnum and local_alnum != local:
                candidates.append((local_alnum, "email_localpart", "low"))

    # 2. LinkedIn vanity slug -> low
    if contact.linkedin_url:
        m = re.search(r"/in/([^/?#]+)", contact.linkedin_url)
        if m:
            slug = _clean(m.group(1))
            # strip trailing -<digits or hash> e.g. budi-santoso-1a2b3 -> budi-santoso
            slug = re.sub(r"-[0-9a-f]{2,}$", "", slug)
            if slug:
                candidates.append((slug, "linkedin_slug", "low"))

    # 3. Name permutations -> low
    if contact.name:
        parts = [_alnum(p) for p in contact.name.split() if _alnum(p)]
        if len(parts) >= 2:
            first, last = parts[0], parts[-1]
            for u in (f"{first}.{last}", f"{first}{last}", f"{first[0]}{last}", f"{first}_{last}"):
                candidates.append((u, "name_permutation", "low"))
        elif len(parts) == 1:
            candidates.append((parts[0], "name_permutation", "low"))

    # Dedup case-insensitively, keep first occurrence (already priority-ordered:
    # high candidates were appended before low ones).
    seen = set()
    ordered_high = [c for c in candidates if c[2] == "high"]
    ordered_low = [c for c in candidates if c[2] == "low"]
    result: List[Tuple[str, str, str]] = []
    for uname, source, conf in ordered_high + ordered_low:
        key = uname.lower()
        if uname and key not in seen:
            seen.add(key)
            result.append((uname, source, conf))

    return result[:MAX_USERNAMES]


# --- Sherlock subprocess ------------------------------------------------------

def sherlock_available() -> bool:
    """True if Sherlock can be run (console script on PATH or module importable).
    Used by the endpoint to tell 'not installed' apart from 'found nothing'."""
    if shutil.which("sherlock"):
        return True
    return importlib.util.find_spec("sherlock_project") is not None


def _sherlock_command(username: str, sites: List[str], folder: str) -> List[str]:
    base = shutil.which("sherlock")
    cmd = [base] if base else [sys.executable, "-m", "sherlock_project"]
    cmd += [
        username,
        "--timeout", str(SHERLOCK_SITE_TIMEOUT),
        "--csv",
        "--folderoutput", folder,
        "--print-found",
        "--no-color",
        "--local",  # use bundled data.json, avoid fetching remote site list
    ]
    for site in sites:
        cmd += ["--site", site]
    return cmd


def _parse_csv(folder: str) -> List[dict]:
    """Read Sherlock CSV output, return [{site, url}] for Claimed rows."""
    hits: List[dict] = []
    for path in glob.glob(os.path.join(folder, "*.csv")):
        try:
            with open(path, newline="", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    if (row.get("exists") or "").strip().lower() == "claimed":
                        site = (row.get("name") or "").strip()
                        url = (row.get("url_user") or row.get("url_main") or "").strip()
                        if site and url:
                            hits.append({"site": site, "url": url})
        except (OSError, csv.Error):
            continue
    return hits


async def _run_sherlock(username: str, sites: List[str]) -> List[dict]:
    """Run Sherlock for one username. Returns [{site, url}]. Never raises."""
    folder = tempfile.mkdtemp(prefix="sherlock_")
    proc = None
    try:
        cmd = _sherlock_command(username, sites, folder)
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=folder,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        try:
            await asyncio.wait_for(proc.communicate(), timeout=SHERLOCK_RUN_TIMEOUT)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            return []
        return _parse_csv(folder)
    except (FileNotFoundError, OSError):
        # sherlock not installed / not runnable — fail soft
        return []
    finally:
        shutil.rmtree(folder, ignore_errors=True)


# --- Orchestrator -------------------------------------------------------------

async def enrich_contact_socials(
    contact: Contact,
    *,
    cache_get: Optional[CacheGet] = None,
    cache_set: Optional[CacheSet] = None,
    sites: Optional[List[str]] = None,
) -> List[SocialProfile]:
    """
    Derive usernames -> run Sherlock (cache-aware) -> dedup -> attach confidence.

    One profile per site; higher-confidence username wins. Bounded by a total
    timeout so a slow username can't hang the request.
    """
    sites = sites or SITE_WHITELIST
    usernames = derive_usernames(contact)
    if not usernames:
        return []

    profiles_by_site: dict = {}

    async def _process_one(uname: str, source: str, confidence: str):
        hits: Optional[List[dict]] = None
        if cache_get:
            hits = await cache_get(uname)
        if hits is None:
            hits = await _run_sherlock(uname, sites)
            if cache_set:
                await cache_set(uname, hits)
        for hit in hits:
            site = hit["site"]
            # keep first hit per site (usernames processed high-confidence first)
            if site not in profiles_by_site:
                profiles_by_site[site] = SocialProfile(
                    site=site,
                    url=hit["url"],
                    username=uname,
                    source=source,
                    confidence=confidence,
                )

    try:
        # high-confidence first so its source/confidence wins on dedup
        await asyncio.wait_for(
            _run_sequential(usernames, _process_one),
            timeout=SHERLOCK_RUN_TIMEOUT * 2,
        )
    except asyncio.TimeoutError:
        pass  # return whatever we gathered before the ceiling

    return list(profiles_by_site.values())


async def _run_sequential(usernames, handler):
    for uname, source, confidence in usernames:
        await handler(uname, source, confidence)
