"""Tests for user preferences endpoints."""

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
async def test_get_preferences_success(
    test_client: TestClient, user_with_profile: User, auth_headers: dict
) -> None:
    """Test GET /api/v1/users/me/preferences returns default preferences."""
    response = test_client.get("/api/v1/users/me/preferences", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "en"
    assert data["theme"] == "light"
    assert data["notifications"] == "email"


@pytest.mark.asyncio
async def test_get_preferences_without_auth(test_client: TestClient) -> None:
    """Test GET /api/v1/users/me/preferences without auth returns 403."""
    response = test_client.get("/api/v1/users/me/preferences")

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_preferences_single(
    test_client: TestClient, user_with_profile: User, auth_headers: dict
) -> None:
    """Test PUT /api/v1/users/me/preferences updates single preference."""
    payload = {"theme": "dark"}
    response = test_client.put("/api/v1/users/me/preferences", json=payload, headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "dark"
    assert data["language"] == "en"  # Unchanged
    assert data["notifications"] == "email"  # Unchanged


@pytest.mark.asyncio
async def test_update_preferences_multiple(
    test_client: TestClient, user_with_profile: User, auth_headers: dict
) -> None:
    """Test PUT /api/v1/users/me/preferences updates multiple preferences."""
    payload = {
        "theme": "auto",
        "language": "es",
        "notifications": "push",
    }
    response = test_client.put("/api/v1/users/me/preferences", json=payload, headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "auto"
    assert data["language"] == "es"
    assert data["notifications"] == "push"


@pytest.mark.asyncio
async def test_update_preferences_invalid_theme(
    test_client: TestClient, user_with_profile: User, auth_headers: dict
) -> None:
    """Test PUT /api/v1/users/me/preferences with invalid theme returns 422."""
    payload = {"theme": "invalid-color"}
    response = test_client.put("/api/v1/users/me/preferences", json=payload, headers=auth_headers)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_preferences_invalid_language(
    test_client: TestClient, user_with_profile: User, auth_headers: dict
) -> None:
    """Test PUT /api/v1/users/me/preferences with invalid language returns 422."""
    payload = {"language": "xx"}
    response = test_client.put("/api/v1/users/me/preferences", json=payload, headers=auth_headers)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_preferences_without_auth(test_client: TestClient) -> None:
    """Test PUT /api/v1/users/me/preferences without auth returns 403."""
    payload = {"theme": "dark"}
    response = test_client.put("/api/v1/users/me/preferences", json=payload)

    assert response.status_code == 403
