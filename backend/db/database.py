"""Database connection and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from core.config import settings
from loguru import logger


# Convert to async URL — handles postgresql://, postgres:// (Neon/Render format)
_raw = settings.DATABASE_URL
DATABASE_URL = (
    _raw.replace("postgres://", "postgresql+asyncpg://")
        .replace("postgresql://", "postgresql+asyncpg://")
)

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all tables on startup and run safe column migrations."""
    from db import models  # noqa: F401 — import to register models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe column additions — won't fail if column already exists
        safe_alters = [
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS work_progress INTEGER DEFAULT 0",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS work_updates_json JSONB DEFAULT '[]'",
        ]
        for sql in safe_alters:
            try:
                await conn.execute(text(sql))
            except Exception:
                pass  # Column already exists or DB doesn't support it
    logger.info("✅ Database tables initialized")


async def get_db():
    """Dependency: yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
