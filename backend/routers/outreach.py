from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
import httpx
import os
from datetime import datetime
from uuid import uuid4

from db import get_session, LeadRecord, OutreachEventRecord
from models.schemas import OutreachRequest, OutreachDraft, Company, Contact, LeadScore
from services.ai_outreach import generate_outreach_draft

router = APIRouter(prefix="/outreach", tags=["outreach"])

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SENDER_EMAIL   = os.getenv("GMAIL_USER", "anna.savira@bawana.com")
SENDER_NAME    = "Anna Savira"


@router.post("/generate", response_model=OutreachDraft)
async def generate_outreach(
    request: OutreachRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(LeadRecord).where(LeadRecord.id == request.company_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Lead not found. Refresh dashboard first.")

    company = Company(
        id=record.id, name=record.name, industry=record.industry,
        employee_count=record.employee_count, description=record.description,
        website=record.website, linkedin_url=record.linkedin_url, location=record.location,
    )
    # Use contacts JSON column if available, else fall back to legacy columns
    if record.contacts:
        contact = Contact(**record.contacts[0])
    elif record.contact_name:
        contact = Contact(
            name=record.contact_name, role=record.contact_role,
            linkedin_url=record.contact_linkedin, email=record.contact_email,
            phone=record.contact_phone,
        )
    else:
        contact = None

    if request.contact_name or request.contact_role:
        contact = Contact(
            name=request.contact_name or (contact.name if contact else None),
            role=request.contact_role or (contact.role if contact else None),
            linkedin_url=contact.linkedin_url if contact else None,
            email=contact.email if contact else None,
            phone=contact.phone if contact else None,
        )

    score = LeadScore(
        total=record.score,
        breakdown=record.score_breakdown or {},
        reasoning=record.reasoning or [],
    )
    draft = await generate_outreach_draft(company=company, score=score, contact=contact, channel=request.channel)
    return draft


class SendEmailRequest(BaseModel):
    company_id: str | None = None
    to_email: str   # comma-separated
    subject: str
    message: str
    company_name: str
    contact_name: str | None = None
    contact_role: str | None = None


class SendEmailResponse(BaseModel):
    success: bool
    message: str
    sent_to: list[str]
    failed: list[str]


class OutreachEventCreate(BaseModel):
    event_type: str = "outreach"
    channel: str | None = None
    contact_name: str | None = None
    contact_role: str | None = None
    recipient: str | None = None
    subject: str | None = None
    message: str | None = None
    status: str | None = None
    note: str | None = None
    metadata: dict = Field(default_factory=dict)


class OutreachEventResponse(BaseModel):
    id: str
    company_id: str
    event_type: str
    channel: str | None = None
    contact_name: str | None = None
    contact_role: str | None = None
    recipient: str | None = None
    subject: str | None = None
    message: str | None = None
    status: str | None = None
    note: str | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


def _event_to_response(record: OutreachEventRecord) -> OutreachEventResponse:
    return OutreachEventResponse(
        id=record.id,
        company_id=record.company_id,
        event_type=record.event_type,
        channel=record.channel,
        contact_name=record.contact_name,
        contact_role=record.contact_role,
        recipient=record.recipient,
        subject=record.subject,
        message=record.message,
        status=record.status,
        note=record.note,
        metadata=record.event_metadata or {},
        created_at=record.created_at,
    )


@router.get("/history/{company_id}", response_model=list[OutreachEventResponse])
async def list_outreach_history(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(OutreachEventRecord)
        .where(OutreachEventRecord.company_id == company_id)
        .order_by(OutreachEventRecord.created_at.desc())
    )
    return [_event_to_response(record) for record in result.scalars().all()]


@router.post("/history/{company_id}", response_model=OutreachEventResponse)
async def create_outreach_event(
    company_id: str,
    request: OutreachEventCreate,
    session: AsyncSession = Depends(get_session),
):
    lead = await session.get(LeadRecord, company_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    record = OutreachEventRecord(
        id=str(uuid4()),
        company_id=company_id,
        event_type=request.event_type,
        channel=request.channel,
        contact_name=request.contact_name,
        contact_role=request.contact_role,
        recipient=request.recipient,
        subject=request.subject,
        message=request.message,
        status=request.status,
        note=request.note,
        event_metadata=request.metadata or {},
        created_at=datetime.utcnow(),
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return _event_to_response(record)


@router.delete("/history/{company_id}/{event_id}")
async def delete_outreach_event(
    company_id: str,
    event_id: str,
    session: AsyncSession = Depends(get_session),
):
    record = await session.get(OutreachEventRecord, event_id)
    if not record or record.company_id != company_id:
        raise HTTPException(status_code=404, detail="Outreach event not found.")
    await session.delete(record)
    await session.commit()
    return {"status": "deleted"}


@router.post("/send-email", response_model=SendEmailResponse)
async def send_email(
    request: SendEmailRequest,
    session: AsyncSession = Depends(get_session),
):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="RESEND_API_KEY not configured.")

    recipients = [e.strip() for e in request.to_email.split(",") if e.strip() and "@" in e.strip()]
    if not recipients:
        raise HTTPException(status_code=400, detail="Tidak ada email valid yang ditemukan.")

    html_body = request.message.replace("\n", "<br>")
    html_content = f"""
    <html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;
        line-height: 1.6; margin: 0; padding: 0; text-align: left;">
        {html_body}
    </body></html>
    """

    sent_to = []
    failed = []

    async with httpx.AsyncClient(timeout=15) as client:
        for recipient in recipients:
            try:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
                        "to": [recipient],
                        "subject": request.subject or f"Perkenalan dari Bawana — {request.company_name}",
                        "html": html_content,
                        "text": request.message,
                    },
                )
                if resp.status_code in (200, 201):
                    sent_to.append(recipient)
                else:
                    err = resp.json().get("message", resp.text[:80])
                    failed.append(f"{recipient} ({err})")
            except Exception as e:
                failed.append(f"{recipient} ({str(e)[:60]})")

    if not sent_to:
        raise HTTPException(status_code=500, detail=f"All emails failed to send: {', '.join(failed)}")

    if request.company_id:
        event = OutreachEventRecord(
            id=str(uuid4()),
            company_id=request.company_id,
            event_type="outreach",
            channel="email",
            contact_name=request.contact_name,
            contact_role=request.contact_role,
            recipient=", ".join(sent_to),
            subject=request.subject or f"Perkenalan dari Bawana — {request.company_name}",
            message=request.message,
            status="sent",
            event_metadata={"failed": failed},
            created_at=datetime.utcnow(),
        )
        session.add(event)
        await session.commit()

    return SendEmailResponse(
        success=True,
        message=f"Sent to {len(sent_to)} recipient(s)" + (f", {len(failed)} failed" if failed else ""),
        sent_to=sent_to,
        failed=failed,
    )
