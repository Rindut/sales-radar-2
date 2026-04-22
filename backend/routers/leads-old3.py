from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from typing import List

from db import get_session, LeadRecord, ICPRecord
from models.schemas import Lead, Company, LeadScore, Contact, DashboardResponse, ICPConfig
from services.apollo import discover_companies, resolve_contact, get_company_detail
from services.icp_filter import apply_icp_filter
from services.scoring import score_companies
from config import DEFAULT_ICP

# Import dummy support if available
try:
    from services.dummy_data import get_dummy_companies, get_dummy_contact
    from config import DUMMY_MODE
except ImportError:
    DUMMY_MODE = False
    get_dummy_companies = None
    get_dummy_contact = None

router = APIRouter(prefix="/leads", tags=["leads"])


async def _get_active_icp(session: AsyncSession) -> ICPConfig:
    result = await session.execute(
        select(ICPRecord).order_by(desc(ICPRecord.updated_at)).limit(1)
    )
    record = result.scalar_one_or_none()
    if record:
        return ICPConfig(**record.config_json)
    return ICPConfig(**DEFAULT_ICP)


@router.get("/top", response_model=DashboardResponse)
async def get_top_leads(
    refresh: bool = False,
    session: AsyncSession = Depends(get_session),
):
    """
    Get today's Top 10 prioritized leads.
    If refresh=true, re-fetch from Apollo.
    If not, return cached leads from DB.
    """
    icp = await _get_active_icp(session)

    if not refresh:
        result = await session.execute(
            select(LeadRecord).order_by(desc(LeadRecord.score)).limit(10)
        )
        records = result.scalars().all()
        if records:
            leads = [_record_to_lead(r) for r in records]
            return DashboardResponse(
                leads=leads,
                generated_at=records[0].fetched_at or datetime.utcnow(),
                icp_summary=_icp_summary(icp),
            )

    # Fresh fetch — dummy or Apollo
    if DUMMY_MODE and get_dummy_companies:
        raw_companies = get_dummy_companies()
        filtered = apply_icp_filter(raw_companies, icp)
        top_scored = score_companies(filtered, icp, top_n=10)
        leads = []
        for company, score in top_scored:
            contact = get_dummy_contact(company.id) if get_dummy_contact else None
            lead = Lead(company=company, score=score, contact=contact, fetched_at=datetime.utcnow())
            leads.append(lead)
            await _upsert_lead(session, lead)
    else:
        raw_companies = await discover_companies(icp, per_page=50)
        filtered = apply_icp_filter(raw_companies, icp)
        top_scored = score_companies(filtered, icp, top_n=10)
        leads = []
        for company, score in top_scored:
            contact = await resolve_contact(company.id, icp.target_roles)
            lead = Lead(company=company, score=score, contact=contact, fetched_at=datetime.utcnow())
            leads.append(lead)
            await _upsert_lead(session, lead)

    await session.commit()

    return DashboardResponse(
        leads=leads,
        generated_at=datetime.utcnow(),
        icp_summary=_icp_summary(icp),
    )


@router.get("/{company_id}", response_model=Lead)
async def get_lead_detail(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get full detail for a single lead."""
    result = await session.execute(
        select(LeadRecord).where(LeadRecord.id == company_id)
    )
    record = result.scalar_one_or_none()
    if record:
        return _record_to_lead(record)

    company = await get_company_detail(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Lead not found")

    icp = await _get_active_icp(session)
    contact = await resolve_contact(company_id, icp.target_roles)
    from services.scoring import _score_company
    score = _score_company(company, icp)

    return Lead(company=company, score=score, contact=contact, fetched_at=datetime.utcnow())


async def _upsert_lead(session: AsyncSession, lead: Lead):
    existing = await session.get(LeadRecord, lead.company.id)
    if existing:
        existing.score = lead.score.total
        existing.score_breakdown = lead.score.breakdown
        existing.reasoning = lead.score.reasoning
        existing.keywords = getattr(lead.company, 'keywords', [])
        existing.founded_year = getattr(lead.company, 'founded_year', None)
        existing.revenue = getattr(lead.company, 'revenue', None)
        existing.fetched_at = lead.fetched_at
    else:
        record = LeadRecord(
            id=lead.company.id,
            name=lead.company.name,
            industry=lead.company.industry,
            employee_count=lead.company.employee_count,
            description=lead.company.description,
            website=lead.company.website,
            linkedin_url=lead.company.linkedin_url,
            location=lead.company.location,
            keywords=getattr(lead.company, 'keywords', []),
            founded_year=getattr(lead.company, 'founded_year', None),
            revenue=getattr(lead.company, 'revenue', None),
            score=lead.score.total,
            score_breakdown=lead.score.breakdown,
            reasoning=lead.score.reasoning,
            contact_name=lead.contact.name if lead.contact else None,
            contact_role=lead.contact.role if lead.contact else None,
            contact_linkedin=lead.contact.linkedin_url if lead.contact else None,
            contact_email=lead.contact.email if lead.contact else None,
            contact_phone=lead.contact.phone if lead.contact else None,
            fetched_at=lead.fetched_at,
        )
        session.add(record)


def _record_to_lead(r: LeadRecord) -> Lead:
    return Lead(
        company=Company(
            id=r.id,
            name=r.name,
            industry=r.industry,
            employee_count=r.employee_count,
            description=r.description,
            website=r.website,
            linkedin_url=r.linkedin_url,
            location=r.location,
            keywords=r.keywords or [],
            founded_year=r.founded_year,
            revenue=r.revenue,
        ),
        score=LeadScore(
            total=r.score,
            breakdown=r.score_breakdown or {},
            reasoning=r.reasoning or [],
        ),
        contact=Contact(
            name=r.contact_name,
            role=r.contact_role,
            linkedin_url=r.contact_linkedin,
            email=r.contact_email,
            phone=r.contact_phone,
        ) if r.contact_name else None,
        fetched_at=r.fetched_at,
    )


def _icp_summary(icp: ICPConfig) -> str:
    return f"Industri: {', '.join(icp.industries[:3])} | Lokasi: {', '.join(icp.locations)} | Target: {', '.join(icp.target_roles[:2])}"
