from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SocialProfile(BaseModel):
    site: str                              # "GitHub", "Medium", ...
    url: str                               # public profile URL Sherlock confirmed
    username: str                          # handle that produced the hit
    source: str                            # "email_localpart" | "linkedin_slug" | "name_permutation"
    confidence: str                        # "high" | "low"


class Contact(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    enrichment_warning: Optional[str] = None
    social_profiles: List[SocialProfile] = Field(default_factory=list)
    socials_enriched_at: Optional[datetime] = None


class LeadScore(BaseModel):
    total: float
    breakdown: dict
    reasoning: List[str] = Field(default_factory=list)


class Company(BaseModel):
    id: str
    name: str
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    description: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    founded_year: Optional[int] = None
    revenue: Optional[int] = None


class Lead(BaseModel):
    company: Company
    score: LeadScore
    contacts: List[Contact] = Field(default_factory=list)
    contact_warning: Optional[str] = None
    fetched_at: Optional[datetime] = None
    is_rejected: bool = False
    is_saved: bool = False


class OutreachRequest(BaseModel):
    company_id: str
    channel: str = "linkedin"
    contact_name: Optional[str] = None   # override: use selected contact's name
    contact_role: Optional[str] = None   # override: use selected contact's role


class OutreachDraft(BaseModel):
    company_id: str
    channel: str
    subject: Optional[str] = None
    message: str
    tips: List[str] = Field(default_factory=list)


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
