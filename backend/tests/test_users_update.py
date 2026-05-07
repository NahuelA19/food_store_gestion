"""Tests for user profile update and delete endpoints."""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

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
    token = create_access_token(data={"user_id": user_with_profile.id, "email": user_with_profile.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_update_profile_success(test_client: TestClient, user_with_profile: User, auth_headers: dict) -> None:
    """Test PUT /api/users/me updates user profile."""
    payload = {
        "first_name": "Jane",
        "last_name": "Smith",
        "phone": "+1-555-987-6543",
    }
    response = test_client.put("/api/users/me", json=payload, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Smith"
    assert data["phone"] == "+1-555-987-6543"


@pytest.mark.asyncio
async def test_update_profile_partial(test_client: TestClient, user_with_profile: User, auth_headers: dict, db_session: AsyncSession) -> None:
    """Test PUT /api/users/me with partial fields only updates those fields."""
    payload = {
        "first_name": "Janet",
    }
    response = test_client.put("/api/users/me", json=payload, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Janet"
    assert data["last_name"] == "Doe"  # Unchanged
    assert data["phone"] == "+1-555-123-4567"  # Unchanged


@pytest.mark.asyncio
async def test_update_profile_invalid_phone(test_client: TestClient, user_with_profile: User, auth_headers: dict) -> None:
    """Test PUT /api/users/me with invalid phone returns 422."""
    payload = {
        "phone": "abc",  # Too short and invalid format
    }
    response = test_client.put("/api/users/me", json=payload, headers=auth_headers)
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_profile_without_auth(test_client: TestClient) -> None:
    """Test PUT /api/users/me without auth returns 403."""
    payload = {"first_name": "Jane"}
    response = test_client.put("/api/users/me", json=payload)
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_account_success(test_client: TestClient, user_with_profile: User, auth_headers: dict, db_session: AsyncSession) -> None:
    """Test DELETE /api/users/me soft-deletes user."""
    response = test_client.delete("/api/users/me", headers=auth_headers)
    
    assert response.status_code == 204
    
    # Verify user is soft-deleted in database
    result = await db_session.execute(select(User).where(User.id == user_with_profile.id))
    user = result.scalar_one()
    assert user.deleted_at is not None
    assert user.is_active is False


@pytest.mark.asyncio
async def test_delete_account_without_auth(test_client: TestClient) -> None:
    """Test DELETE /api/users/me without auth returns 403."""
    response = test_client.delete("/api/users/me")
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_deleted_user_cannot_login(test_client: TestClient, db_session: AsyncSession) -> None:
    """Test deleted user cannot login."""
    # Create user
    user = User(
        email="deleted@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        is_active=False,
        deleted_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    
    # Try to login
    payload = {"email": "deleted@example.com", "password": "TestPassword123"}
    response = test_client.post("/api/auth/login", json=payload)
    
    assert response.status_code == 403
    assert "inactive" in response.json()["detail"].lower()
