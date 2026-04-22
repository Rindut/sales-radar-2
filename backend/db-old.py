from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON
from datetime import datetime
import json
from config import DATABASE_URL

# SQLite async URL
ASYNC_DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_URL}"

engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class LeadRecord(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True)  # company_id
    name = Column(String)
    industry = Column(String, nullable=True)
    employee_count = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    keywords = Column(JSON, nullable=True)
    founded_year = Column(Integer, nullable=True)
    revenue = Column(Float, nullable=True)
    score = Column(Float)
    score_breakdown = Column(JSON)
    reasoning = Column(JSON)
    contact_name = Column(String, nullable=True)
    contact_role = Column(String, nullable=True)
    contact_linkedin = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
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
