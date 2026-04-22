from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, Boolean
from datetime import datetime
from config import DATABASE_URL

ASYNC_DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_URL}"

engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class LeadRecord(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True)
    name = Column(String)
    industry = Column(String, nullable=True)
    employee_count = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    keywords = Column(JSON, default=list)
    founded_year = Column(Integer, nullable=True)
    revenue = Column(Integer, nullable=True)
    score = Column(Float)
    score_breakdown = Column(JSON)
    reasoning = Column(JSON)
    contact_name = Column(String, nullable=True)
    contact_role = Column(String, nullable=True)
    contact_linkedin = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    is_rejected = Column(Boolean, default=False)   # NEW — Opsi C
    fetched_at = Column(DateTime, default=datetime.utcnow)


class ICPRecord(Base):
    __tablename__ = "icp_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_json = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
