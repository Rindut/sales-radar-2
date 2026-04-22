from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from db import get_session, LeadRecord, ICPRecord
from models.schemas import OutreachRequest, OutreachDraft, Company, Contact, LeadScore, ICPConfig
from services.ai_outreach import generate_outreach_draft
from config import DEFAULT_ICP

router = APIRouter(prefix="/outreach", tags=["outreach"])


@router.post("/generate", response_model=OutreachDraft)
async def generate_outreach(
    request: OutreachRequest,
    session: AsyncSession = Depends(get_session),
):
    """Generate AI outreach draft for a given company."""
    result = await session.execute(
        select(LeadRecord).where(LeadRecord.id == request.company_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Lead not found. Refresh dashboard first.")

    company = Company(
        id=record.id,
        name=record.name,
        industry=record.industry,
        employee_count=record.employee_count,
        description=record.description,
        website=record.website,
        linkedin_url=record.linkedin_url,
        location=record.location,
    )

    contact = Contact(
        name=record.contact_name,
        role=record.contact_role,
        linkedin_url=record.contact_linkedin,
        email=record.contact_email,
        phone=record.contact_phone,
    ) if record.contact_name else None

    score = LeadScore(
        total=record.score,
        breakdown=record.score_breakdown or {},
        reasoning=record.reasoning or [],
    )

    draft = await generate_outreach_draft(
        company=company,
        score=score,
        contact=contact,
        channel=request.channel,
    )

    return draft
