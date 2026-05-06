"""Database connection and engine configuration."""

import os
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
)
from sqlalchemy.pool import NullPool


def get_database_url() -> str:
    """Get database URL from environment."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Fallback for development
        db_url = "postgresql+asyncpg://postgres:postgres@localhost:5432/food_store_dev"
    return db_url


# Global engine instance (initialized in app startup)
_engine: Optional[AsyncEngine] = None


def create_engine() -> AsyncEngine:
    """Create async database engine with NullPool for async operations."""
    db_url = get_database_url()

    engine: AsyncEngine = create_async_engine(
        db_url,
        echo=os.getenv("DATABASE_ECHO", "False").lower() == "true",
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
    """Initialize the database engine (call during app startup)."""
    global _engine
    _engine = create_engine()
    return _engine


async def dispose_engine() -> None:
    """Dispose the database engine (call during app shutdown)."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


# Backwards compatibility
engine = None
