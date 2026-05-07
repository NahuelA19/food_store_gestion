"""Tests for admin user management endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserPreference
from app.security.jwt import create_access_token
from app.security.password import get_password_hash
from app.validation import DEFAULT_PREFERENCES


@pytest.fixture
async def regular_user(db_session: AsyncSession) -> User:
    """Create a regular (non-admin) user."""
    user = User(
        email="regular@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        is_active=True,
        role="user",
        first_name="Regular",
        last_name="User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    for key, value in DEFAULT_PREFERENCES.items():
        pref = UserPreference(user_id=user.id, pref_key=key, pref_value=value)
        db_session.add(pref)
    await db_session.commit()

    return user


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin user."""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPass123"),
        is_active=True,
        role="admin",
        first_name="Admin",
        last_name="User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    for key, value in DEFAULT_PREFERENCES.items():
        pref = UserPreference(user_id=user.id, pref_key=key, pref_value=value)
        db_session.add(pref)
    await db_session.commit()

    return user


@pytest.fixture
def regular_auth_headers(regular_user: User) -> dict:
    """Generate auth headers for regular user."""
    token = create_access_token(data={"user_id": regular_user.id, "email": regular_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(admin_user: User) -> dict:
    """Generate auth headers for admin user."""
    token = create_access_token(data={"user_id": admin_user.id, "email": admin_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_users_as_regular_user_returns_403(
    test_client: TestClient, regular_auth_headers: dict
) -> None:
    """Test GET /api/users as regular user returns 403."""
    response = test_client.get("/api/users", headers=regular_auth_headers)

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users_as_admin_returns_paginated_list(
    test_client: TestClient, admin_auth_headers: dict
) -> None:
    """Test GET /api/users as admin returns paginated user list."""
    response = test_client.get("/api/users", headers=admin_auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "next_cursor" in data
    assert len(data["users"]) > 0
    assert data["users"][0]["email"] is not None
    assert "role" in data["users"][0]


@pytest.mark.asyncio
async def test_list_users_with_limit(test_client: TestClient, admin_auth_headers: dict) -> None:
    """Test GET /api/users with limit parameter."""
    response = test_client.get("/api/users?limit=1", headers=admin_auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) <= 1


@pytest.mark.asyncio
async def test_list_users_with_cursor(
    test_client: TestClient, admin_user: User, admin_auth_headers: dict, db_session: AsyncSession
) -> None:
    """Test GET /api/users with cursor pagination."""
    # Create a second user to have pagination
    second_user = User(
        email="second@example.com",
        hashed_password=get_password_hash("TestPass123"),
        is_active=True,
        role="user",
    )
    db_session.add(second_user)
    await db_session.commit()

    # Get first page with cursor after admin user
    response = test_client.get(f"/api/users?cursor={admin_user.id}", headers=admin_auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) > 0
    # The user returned should be after the admin user
    assert all(u["id"] > admin_user.id for u in data["users"])


@pytest.mark.asyncio
async def test_update_user_status_as_admin(
    test_client: TestClient, regular_user: User, admin_auth_headers: dict
) -> None:
    """Test PATCH /api/users/{id}/status as admin deactivates user."""
    payload = {"is_active": False}
    response = test_client.patch(
        f"/api/users/{regular_user.id}/status",
        json=payload,
        headers=admin_auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False
    assert data["id"] == regular_user.id


@pytest.mark.asyncio
async def test_update_user_status_as_regular_user_returns_403(
    test_client: TestClient, admin_user: User, regular_auth_headers: dict
) -> None:
    """Test PATCH /api/users/{id}/status as regular user returns 403."""
    payload = {"is_active": False}
    response = test_client.patch(
        f"/api/users/{admin_user.id}/status",
        json=payload,
        headers=regular_auth_headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_user_status_non_existent(
    test_client: TestClient, admin_auth_headers: dict
) -> None:
    """Test PATCH /api/users/{id}/status with non-existent user returns 404."""
    payload = {"is_active": False}
    response = test_client.patch(
        "/api/users/99999/status",
        json=payload,
        headers=admin_auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user_status_reactivate(
    test_client: TestClient, regular_user: User, admin_auth_headers: dict
) -> None:
    """Test PATCH /api/users/{id}/status reactivates user."""
    # Deactivate first
    response = test_client.patch(
        f"/api/users/{regular_user.id}/status",
        json={"is_active": False},
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Reactivate
    response = test_client.patch(
        f"/api/users/{regular_user.id}/status",
        json={"is_active": True},
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is True


@pytest.mark.asyncio
async def test_list_users_without_auth_returns_403(
    test_client: TestClient,
) -> None:
    """Test GET /api/users without auth returns 403."""
    response = test_client.get("/api/users")

    assert response.status_code == 403
