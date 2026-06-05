"""
Migrate Sales Radar data from a SQLite database file into the configured database.

Usage:
    DATABASE_URL="postgresql://..." python scripts/migrate_sqlite_to_postgres.py ./sales_radar.db

The script is idempotent-ish: rows are merged by primary key, so rerunning updates
existing leads/config/events instead of creating duplicates.
"""

from __future__ import annotations

import asyncio
import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parents[1]))

from db import ICPRecord, LeadRecord, OutreachEventRecord, init_db, AsyncSessionLocal  # noqa: E402


def _json_value(value: Any, default: Any) -> Any:
    if value is None or value == "":
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return default


def _dt(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value
    text = str(value)
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value in (1, "1", "true", "TRUE", "True"):
        return True
    return False


def _has_table(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "select name from sqlite_master where type='table' and name=?",
        (table_name,),
    ).fetchone()
    return row is not None


def _columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
    return {row[1] for row in conn.execute(f'pragma table_info("{table_name}")')}


async def migrate(sqlite_path: Path) -> None:
    if not sqlite_path.exists():
        raise SystemExit(f"SQLite source not found: {sqlite_path}")

    await init_db()

    source = sqlite3.connect(sqlite_path)
    source.row_factory = sqlite3.Row

    lead_columns = _columns(source, "leads") if _has_table(source, "leads") else set()
    icp_columns = _columns(source, "icp_config") if _has_table(source, "icp_config") else set()
    event_columns = _columns(source, "outreach_events") if _has_table(source, "outreach_events") else set()

    async with AsyncSessionLocal() as session:
        lead_count = 0
        if lead_columns:
            for row in source.execute("select * from leads"):
                data = dict(row)
                record = LeadRecord(
                    id=data["id"],
                    name=data.get("name"),
                    industry=data.get("industry"),
                    employee_count=data.get("employee_count"),
                    description=data.get("description"),
                    website=data.get("website"),
                    linkedin_url=data.get("linkedin_url"),
                    location=data.get("location"),
                    keywords=_json_value(data.get("keywords"), []),
                    founded_year=data.get("founded_year"),
                    revenue=data.get("revenue"),
                    score=data.get("score"),
                    score_breakdown=_json_value(data.get("score_breakdown"), {}),
                    reasoning=_json_value(data.get("reasoning"), []),
                    contact_name=data.get("contact_name"),
                    contact_role=data.get("contact_role"),
                    contact_linkedin=data.get("contact_linkedin"),
                    contact_email=data.get("contact_email"),
                    contact_phone=data.get("contact_phone"),
                    contacts=_json_value(data.get("contacts"), []),
                    contact_warning=data.get("contact_warning") if "contact_warning" in lead_columns else None,
                    is_rejected=_bool(data.get("is_rejected")),
                    is_saved=_bool(data.get("is_saved")) if "is_saved" in lead_columns else False,
                    fetched_at=_dt(data.get("fetched_at")),
                )
                await session.merge(record)
                lead_count += 1

        icp_count = 0
        if icp_columns:
            for row in source.execute("select * from icp_config"):
                data = dict(row)
                record = ICPRecord(
                    id=data["id"],
                    config_json=_json_value(data.get("config_json"), {}),
                    updated_at=_dt(data.get("updated_at")),
                )
                await session.merge(record)
                icp_count += 1

        event_count = 0
        if event_columns:
            for row in source.execute("select * from outreach_events"):
                data = dict(row)
                record = OutreachEventRecord(
                    id=data["id"],
                    company_id=data.get("company_id"),
                    event_type=data.get("event_type") or "outreach",
                    channel=data.get("channel"),
                    contact_name=data.get("contact_name"),
                    contact_role=data.get("contact_role"),
                    recipient=data.get("recipient"),
                    subject=data.get("subject"),
                    message=data.get("message"),
                    status=data.get("status"),
                    note=data.get("note"),
                    event_metadata=_json_value(data.get("event_metadata"), {}),
                    created_at=_dt(data.get("created_at")),
                )
                await session.merge(record)
                event_count += 1

        await session.commit()

        totals = {
            "leads": (await session.execute(select(LeadRecord.id))).scalars().all(),
            "icp_config": (await session.execute(select(ICPRecord.id))).scalars().all(),
            "outreach_events": (await session.execute(select(OutreachEventRecord.id))).scalars().all(),
        }

    source.close()
    print(f"Migrated leads: {lead_count}")
    print(f"Migrated ICP config rows: {icp_count}")
    print(f"Migrated outreach events: {event_count}")
    print(f"Target totals: leads={len(totals['leads'])}, icp_config={len(totals['icp_config'])}, outreach_events={len(totals['outreach_events'])}")


if __name__ == "__main__":
    source_arg = sys.argv[1] if len(sys.argv) > 1 else "./sales_radar.db"
    asyncio.run(migrate(Path(source_arg).expanduser().resolve()))
