from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, Boolean
from datetime import datetime
from config import DATABASE_URL


def _make_async_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if database_url.startswith("postgresql+asyncpg://"):
        return database_url
    if database_url.startswith("sqlite+aiosqlite://"):
        return database_url
    if database_url.startswith("sqlite:///"):
        return database_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return f"sqlite+aiosqlite:///{database_url}"


ASYNC_DATABASE_URL = _make_async_database_url(DATABASE_URL)

engine_kwargs = {"echo": False}
if ASYNC_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(ASYNC_DATABASE_URL, **engine_kwargs)
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
    # Legacy single-contact columns — kept for backward compat, no longer written
    contact_name = Column(String, nullable=True)
    contact_role = Column(String, nullable=True)
    contact_linkedin = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    # New: stores all contacts as JSON list
    contacts = Column(JSON, default=list)
    contact_warning = Column(Text, nullable=True)
    is_rejected = Column(Boolean, default=False)
    is_saved = Column(Boolean, default=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)


class ICPRecord(Base):
    __tablename__ = "icp_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_json = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow)


class OutreachEventRecord(Base):
    __tablename__ = "outreach_events"

    id = Column(String, primary_key=True)
    company_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False, default="outreach")
    channel = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    contact_role = Column(String, nullable=True)
    recipient = Column(String, nullable=True)
    subject = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    event_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


async def _migrate(conn):
    """Add contacts column if it doesn't exist (safe to run on every startup)."""
    try:
        await conn.execute(
            __import__("sqlalchemy").text(
                "ALTER TABLE leads ADD COLUMN contacts TEXT"
            )
        )
    except Exception:
        pass  # column already exists
    try:
        await conn.execute(
            __import__("sqlalchemy").text(
                "ALTER TABLE leads ADD COLUMN contact_warning TEXT"
            )
        )
    except Exception:
        pass  # column already exists
    try:
        await conn.execute(
            __import__("sqlalchemy").text(
                "ALTER TABLE leads ADD COLUMN is_saved BOOLEAN DEFAULT 0"
            )
        )
    except Exception:
        pass  # column already exists


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _migrate(conn)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
