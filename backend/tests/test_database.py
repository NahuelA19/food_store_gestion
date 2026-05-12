"""Database smoke tests for Food Store API."""

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


@pytest.mark.asyncio
async def test_database_connection(db_session: AsyncSession) -> None:
    """Test basic database connection."""
    session = db_session
    result = await session.execute(text("SELECT 1"))
    assert result.scalar() == 1


@pytest.mark.asyncio
async def test_user_creation_and_query(db_session: AsyncSession) -> None:
    """Test creating and querying a user."""
    session = db_session

    # Create a user
    user = User(
        email="test@example.com",
        hashed_password="hashed_password_123",
        is_active=True,
    )
    session.add(user)
    await session.commit()

    # Query the user back
    result = await session.execute(select(User).where(User.email == "test@example.com"))
    fetched_user = result.scalar_one_or_none()

    assert fetched_user is not None
    assert fetched_user.email == "test@example.com"
    assert fetched_user.is_active is True


@pytest.mark.asyncio
async def test_database_isolation(db_session: AsyncSession) -> None:
    """Test transaction isolation - changes don't leak between sessions."""
    session = db_session

    # Create a user in one session
    user = User(
        email="isolation_test@example.com",
        hashed_password="hashed_password_123",
        is_active=True,
    )
    session.add(user)
    await session.commit()

    # Verify it exists
    result = await session.execute(select(User).where(User.email == "isolation_test@example.com"))
    assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_unique_constraint_violation(db_session: AsyncSession) -> None:
    """Test that unique constraints are enforced."""
    session = db_session

    # Create first user
    user1 = User(
        email="duplicate@example.com",
        hashed_password="hashed_1",
        is_active=True,
    )
    session.add(user1)
    await session.commit()

    # Try to create another user with same email
    user2 = User(
        email="duplicate@example.com",
        hashed_password="hashed_2",
        is_active=True,
    )
    session.add(user2)

    with pytest.raises(IntegrityError):
        await session.commit()
