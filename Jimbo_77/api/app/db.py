from __future__ import annotations
import os
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://ops:ops_password@localhost:5432/ops")

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session():
    async with SessionLocal() as session:
        yield session

@asynccontextmanager
async def get_async_session():
    """Get async database session"""
    async with SessionLocal() as session:
        yield session

def get_async_engine() -> AsyncEngine:
    """Get async database engine"""
    return engine
