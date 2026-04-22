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
    Behavior:
    - No refresh: return semua leads dari DB (aktif + skipped)
    - Refresh: fetch 10 leads BARU dari Apollo, exclude semua yang sudah ada di DB.
               Skipped leads tetap ada di response (tidak hilang).
    """
    icp = await _get_active_icp(session)

    # Load semua existing records dari DB
    result = await session.execute(
        select(LeadRecord).order_by(desc(LeadRecord.score))
    )
    existing_records = result.scalars().all()

    if not refresh and existing_records:
        # Return cache — semua leads (aktif + skipped), frontend yang split
        leads = [_record_to_lead(r) for r in existing_records]
        latest = max((r.fetched_at for r in existing_records if r.fetched_at), default=datetime.utcnow())
        return DashboardResponse(
            leads=leads,
            generated_at=latest,
            icp_summary=_icp_summary(icp),
        )

    if refresh and existing_records:
        # Fetch 10 leads BARU — exclude semua yang sudah pernah ada (aktif maupun skipped)
        existing_ids = {r.id for r in existing_records}
        new_leads = await _fetch_fresh_leads(icp, exclude_ids=existing_ids, limit=10)

        for lead in new_leads:
            await _upsert_lead(session, lead)
        await session.commit()

        # Reload dari DB — active baru + skipped lama semua dikembalikan
        result2 = await session.execute(
            select(LeadRecord).order_by(desc(LeadRecord.score))
        )
        all_records = result2.scalars().all()
        leads = [_record_to_lead(r) for r in all_records]
        return DashboardResponse(
            leads=leads,
            generated_at=datetime.utcnow(),
            icp_summary=_icp_summary(icp),
        )

    # First time — fetch fresh 10
    new_leads = await _fetch_fresh_leads(icp, exclude_ids=set(), limit=10)
    for lead in new_leads:
        await _upsert_lead(session, lead)
    await session.commit()

    return DashboardResponse(
        leads=new_leads,
        generated_at=datetime.utcnow(),
        icp_summary=_icp_summary(icp),
    )


@router.post("/reject/{company_id}")
async def reject_lead(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    record = await session.get(LeadRecord, company_id)
    if not record:
        raise HTTPException(status_code=404, detail="Lead not found")
    record.is_rejected = True
    await session.commit()
    return {"status": "rejected", "company_id": company_id}


@router.post("/unreject/{company_id}")
async def unreject_lead(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    record = await session.get(LeadRecord, company_id)
    if not record:
        raise HTTPException(status_code=404, detail="Lead not found")
    record.is_rejected = False
    await session.commit()
    return {"status": "active", "company_id": company_id}


@router.get("/{company_id}", response_model=Lead)
async def get_lead_detail(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
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


async def _fetch_fresh_leads(icp: ICPConfig, exclude_ids: set, limit: int) -> List[Lead]:
    if DUMMY_MODE and get_dummy_companies:
        raw = [c for c in get_dummy_companies() if c.id not in exclude_ids]
    else:
        raw = await discover_companies(icp, per_page=50)
        raw = [c for c in raw if c.id not in exclude_ids]

    filtered = apply_icp_filter(raw, icp)
    top_scored = score_companies(filtered, icp, top_n=limit)

    leads = []
    for company, score in top_scored:
        contact = get_dummy_contact(company.id) if (DUMMY_MODE and get_dummy_contact) else await resolve_contact(company.id, icp.target_roles)
        leads.append(Lead(
            company=company,
            score=score,
            contact=contact,
            fetched_at=datetime.utcnow(),
        ))
    return leads


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
        # Never reset is_rejected on upsert
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
            is_rejected=False,
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
        is_rejected=r.is_rejected or False,
    )


def _icp_summary(icp: ICPConfig) -> str:
    return f"Industri: {', '.join(icp.industries[:3])} | Lokasi: {', '.join(icp.locations)} | Target: {', '.join(icp.target_roles[:2])}"
