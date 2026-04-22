from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Contact(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class LeadScore(BaseModel):
    total: float  # 0-100
    breakdown: dict  # PRIORITY dimension scores
    reasoning: List[str]  # human-readable bullets


class Company(BaseModel):
    id: str
    name: str
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    description: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    keywords: List[str] = []
    founded_year: Optional[int] = None
    revenue: Optional[float] = None


class Lead(BaseModel):
    company: Company
    score: LeadScore
    contact: Optional[Contact] = None
    fetched_at: Optional[datetime] = None


class OutreachRequest(BaseModel):
    company_id: str
    channel: str = "linkedin"  # linkedin | email | whatsapp


class OutreachDraft(BaseModel):
    company_id: str
    channel: str
    subject: Optional[str] = None  # for email
    message: str
    tips: List[str] = []


class ICPConfig(BaseModel):
    industries: List[str]
    employee_ranges: List[str]
    keywords: List[str]
    locations: List[str]
    target_roles: List[str]


class DashboardResponse(BaseModel):
    leads: List[Lead]
    generated_at: datetime
    icp_summary: str
