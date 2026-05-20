"""Pytest configuration and fixtures for Food Store tests.

Uses SQLite in-memory database (sqlite+aiosqlite:///:memory:) for fast, isolated tests.
No Docker or PostgreSQL required.

This module patches PostgreSQL-specific types (JSONB, TSVECTOR, UUID) to work with SQLite.
"""

import os
from decimal import Decimal
from typing import AsyncGenerator

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

# =====================================================================
# PATCH PostgreSQL types for SQLite compatibility BEFORE importing models
# =====================================================================
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from sqlalchemy import JSON, String, TypeDecorator

# Create SQLite-compatible replacements
class SQLiteUUID(TypeDecorator):
    """SQLite-compatible UUID type."""
    impl = String(36)
    cache_ok = True

class SQLiteJSONB(TypeDecorator):
    """SQLite-compatible JSONB type."""
    impl = JSON
    cache_ok = True

class SQLiteTSVECTOR(TypeDecorator):
    """SQLite-compatible TSVECTOR (full-text search) type."""
    impl = String(5000)
    cache_ok = True

# Monkey-patch SQLAlchemy type compiler for SQLite
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
original_process = SQLiteTypeCompiler.process

def patched_process(self, type_, **kw):
    if isinstance(type_, JSONB):
        return self.process(JSON(), **kw)
    elif isinstance(type_, TSVECTOR):
        return self.process(String(5000), **kw)
    elif isinstance(type_, UUID):
        return self.process(String(36), **kw)
    return original_process(self, type_, **kw)

SQLiteTypeCompiler.process = patched_process

# =====================================================================
# Set testing mode BEFORE importing app
# =====================================================================
os.environ["TESTING"] = "1"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"

from fastapi import APIRouter, Depends

from app.main import app
from app.models import Base
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.security.password import get_password_hash
from app.dependencies import get_current_user, get_uow
from app.core.uow import UnitOfWork

# Test-only routes for auth middleware tests
_test_router = APIRouter()


@_test_router.get("/protected/test")
async def protected_test_route(current_user=Depends(get_current_user)):
    """Test protected endpoint."""
    return {"status": "ok", "user_id": current_user.id, "user_email": current_user.email}


@_test_router.get("/public/test")
async def public_test_route():
    """Test public endpoint."""
    return {"status": "ok"}


app.include_router(_test_router, prefix="/api/v1")

# Use SQLite in-memory for tests (no Docker required)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_engine():
    """Create in-memory SQLite test database."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # Required for in-memory SQLite
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSession(test_engine, expire_on_commit=False) as session:
        yield session
        await session.rollback()


@pytest.fixture
def override_uow(db_session):
    from app.security.limiter import limiter
    limiter._storage.reset()

    async def _get_uow_override():
        async with UnitOfWork(db_session) as uow:
            yield uow
    app.dependency_overrides[get_uow] = _get_uow_override
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(override_uow) -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
def test_client(override_uow) -> TestClient:
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(email="testuser@example.com", hashed_password=get_password_hash("TestPassword123"), is_active=True)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture
async def test_category(db_session: AsyncSession) -> Category:
    category = Category(name="Vegetables", description="Fresh vegetables")
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category

@pytest.fixture
async def test_product(db_session: AsyncSession, test_category: Category) -> Product:
    product = Product(name="Tomato", description="Fresh red tomato", price=Decimal("2.50"), category_id=test_category.id, is_available=True)
    db_session.add(product)
    await db_session.flush()
    inventory = Inventory(product_id=product.id, stock_quantity=100)
    db_session.add(inventory)
    await db_session.commit()
    await db_session.refresh(product)
    return product
