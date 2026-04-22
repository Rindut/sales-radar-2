from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from db import get_session, ICPRecord
from models.schemas import ICPConfig
from config import DEFAULT_ICP

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/icp", response_model=ICPConfig)
async def get_icp(session: AsyncSession = Depends(get_session)):
    """Get current active ICP configuration."""
    result = await session.execute(
        select(ICPRecord).order_by(desc(ICPRecord.updated_at)).limit(1)
    )
    record = result.scalar_one_or_none()
    if record:
        return ICPConfig(**record.config_json)
    return ICPConfig(**DEFAULT_ICP)


@router.post("/icp", response_model=ICPConfig)
async def update_icp(
    config: ICPConfig,
    session: AsyncSession = Depends(get_session),
):
    """Update ICP configuration. Will affect next lead refresh."""
    record = ICPRecord(
        config_json=config.model_dump(),
        updated_at=datetime.utcnow(),
    )
    session.add(record)
    await session.commit()
    return config
