"""Database connection and engine configuration."""

import os

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
)
from sqlalchemy.pool import NullPool


def get_database_url() -> str:
    """Get database URL from environment."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return db_url


def create_engine() -> AsyncEngine:
    """Create async database engine with NullPool for async operations."""
    db_url = get_database_url()

    # Note: AsyncIO engines don't support connection pooling in the traditional sense
    # NullPool is used which creates a new connection for each query
    # For production, consider using a connection pooler like pgBouncer

    engine: AsyncEngine = create_async_engine(
        db_url,
        echo=os.getenv("DATABASE_ECHO", "False").lower() == "true",
        poolclass=NullPool,
        connect_args={"server_settings": {"application_name": "food_store"}},
    )

    return engine


# Create the engine instance at module level
engine: AsyncEngine = create_engine()
