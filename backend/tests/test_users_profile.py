"""Tests for user profile endpoints."""

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserPreference
from app.security.jwt import create_access_token
from app.security.password import get_password_hash
from app.validation import DEFAULT_PREFERENCES


@pytest.fixture
async def user_with_profile(db_session: AsyncSession) -> User:
    """Create a user with profile fields for testing."""
    user = User(
        email="testuser@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        is_active=True,
        first_name="John",
        last_name="Doe",
        phone="+1-555-123-4567",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Add default preferences
    for key, value in DEFAULT_PREFERENCES.items():
        pref = UserPreference(user_id=user.id, pref_key=key, pref_value=value)
        db_session.add(pref)
    await db_session.commit()

    return user


@pytest.fixture
def auth_headers(user_with_profile: User) -> dict:
    """Generate auth headers for test user."""
    token = create_access_token(
        data={"user_id": user_with_profile.id, "email": user_with_profile.email}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_current_profile_success(
    test_client: TestClient, user_with_profile: User, auth_headers: dict
) -> None:
    """Test GET /api/users/me returns user's full profile."""
    response = test_client.get("/api/users/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_with_profile.id
    assert data["email"] == user_with_profile.email
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["phone"] == "+1-555-123-4567"
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_get_current_profile_without_auth(test_client: TestClient) -> None:
    """Test GET /api/users/me without auth returns 401."""
    response = test_client.get("/api/users/me")

    assert response.status_code == 403  # 403 because no credentials at all


@pytest.mark.asyncio
async def test_get_public_profile_success(test_client: TestClient, user_with_profile: User) -> None:
    """Test GET /api/users/{id} returns limited public profile."""
    response = test_client.get(f"/api/users/{user_with_profile.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_with_profile.id
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert "created_at" in data

    # Should NOT include email or phone for public profile
    assert "email" not in data
    assert "phone" not in data
    assert "updated_at" not in data


@pytest.mark.asyncio
async def test_get_public_profile_non_existent(test_client: TestClient) -> None:
    """Test GET /api/users/{id} with non-existent user returns 404."""
    response = test_client.get("/api/users/99999")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_deleted_user_profile_returns_404(
    test_client: TestClient, db_session: AsyncSession
) -> None:
    """Test GET /api/users/{id} with deleted user returns 404."""
    # Create and delete a user
    user = User(
        email="deleted@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        is_active=False,
        deleted_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    response = test_client.get(f"/api/users/{user.id}")

    assert response.status_code == 404
