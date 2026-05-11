from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx
import os

from db import get_session, LeadRecord
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

    score = LeadScore(
        total=record.score,
        breakdown=record.score_breakdown or {},
        reasoning=record.reasoning or [],
    )
    draft = await generate_outreach_draft(company=company, score=score, contact=contact, channel=request.channel)
    return draft


class SendEmailRequest(BaseModel):
    to_email: str   # comma-separated
    subject: str
    message: str
    company_name: str


class SendEmailResponse(BaseModel):
    success: bool
    message: str
    sent_to: list[str]
    failed: list[str]


@router.post("/send-email", response_model=SendEmailResponse)
async def send_email(request: SendEmailRequest):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="RESEND_API_KEY not configured.")

    recipients = [e.strip() for e in request.to_email.split(",") if e.strip() and "@" in e.strip()]
    if not recipients:
        raise HTTPException(status_code=400, detail="Tidak ada email valid yang ditemukan.")

    html_body = request.message.replace("\n", "<br>")
    html_content = f"""
    <html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;
        line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        {html_body}
        <br><br>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">
            Email ini dikirim melalui Sales Radar by Bawana.<br>
            <a href="https://bawana.id" style="color: #1D8EDE;">bawana.id</a>
        </p>
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
        raise HTTPException(status_code=500, detail=f"Semua email gagal terkirim: {', '.join(failed)}")

    return SendEmailResponse(
        success=True,
        message=f"Terkirim ke {len(sent_to)} penerima" + (f", {len(failed)} gagal" if failed else ""),
        sent_to=sent_to,
        failed=failed,
    )
