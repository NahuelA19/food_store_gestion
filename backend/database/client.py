"""Database connection and engine configuration."""

from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import settings


def get_database_url() -> str:
    """Get database URL from environment.

    Uses Pydantic settings to ensure .env is loaded at the right time.
    This avoids the import-time timing issue where os.getenv() runs
    before .env is parsed by Pydantic.
    """
    return settings.database_url


# Global engine instance (initialized in app startup)
_engine: Optional[AsyncEngine] = None


def create_engine() -> AsyncEngine:
    """Create async database engine with NullPool for async operations."""
    db_url = get_database_url()

    engine: AsyncEngine = create_async_engine(
        db_url,
        echo=getattr(settings, "database_echo", False),
        poolclass=NullPool,
        connect_args={"server_settings": {"application_name": "food_store"}},
    )

    return engine


def get_engine() -> AsyncEngine:
    """Get the global engine instance. Must be initialized before use."""
    global _engine
    if _engine is None:
        _engine = create_engine()
    return _engine


async def init_engine() -> AsyncEngine:
    """Initialize the database engine and run seeds (call during app startup)."""
    global _engine
    _engine = create_engine()
    
    # Run seeds after engine is initialized
    from database.seeds import run_seeds
    from sqlalchemy.ext.asyncio import AsyncSession
    
    session_factory = __import__('sqlalchemy.ext.asyncio', fromlist=['async_sessionmaker']).async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    
    async with session_factory() as session:
        await run_seeds(session)
        await session.commit()
    
    return _engine


async def dispose_engine() -> None:
    """Dispose the database engine (call during app shutdown)."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


# Backwards compatibility
engine = None
