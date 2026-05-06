"""Pytest configuration and fixtures for Food Store tests."""

import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.main import app
from app.models import Base
from database.session import get_db_session

# Override DATABASE_URL for testing
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://user:password@localhost/food_store_test",
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine with NullPool.

    This fixture requires a running PostgreSQL database.
    If the database is not available, tests using this fixture will be skipped.
    """
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        pytest.skip(f"Database not available: {e}")

    yield engine

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    except Exception:
        pass  # Ignore errors on cleanup

    await engine.dispose()


@pytest.fixture
async def get_test_db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Get a test database session."""
    if test_engine is None:
        pytest.skip("Database not available")

    async with AsyncSession(test_engine, expire_on_commit=False) as session:
        try:
            yield session
        finally:
            await session.rollback()


@pytest.fixture
def override_get_db_session(get_test_db_session) -> Generator[AsyncSession, None, None]:
    """Override FastAPI dependency for test database session."""
    async def _get_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield get_test_db_session

    app.dependency_overrides[get_db_session] = _get_db_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def test_client(override_get_db_session) -> TestClient:
    """FastAPI test client with overridden database dependency."""
    return TestClient(app)

