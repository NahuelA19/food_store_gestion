"""Tests for authentication routes."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.security.password import get_password_hash


@pytest.mark.asyncio
class TestAuthRoutes:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client: AsyncClient, db_session: AsyncSession):
        """Successful user registration returns user info and token."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "ValidPass123",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["access_token"]
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Registration with duplicate email returns 409 Conflict."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "password": "ValidPass123",
            },
        )

        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_weak_password(self, async_client: AsyncClient):
        """Registration with weak password returns 422."""
        weak_passwords = [
            "short1",  # Too short
            "nouppercase123",  # No uppercase
            "NODIGITS",  # No digit
        ]

        for weak_pass in weak_passwords:
            response = await async_client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"user{weak_pass}@example.com",
                    "password": weak_pass,
                },
            )
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, async_client: AsyncClient):
        """Registration with invalid email format returns 422."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "ValidPass123",
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Successful login returns user info and token pair."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "TestPassword123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(
        self,
        async_client: AsyncClient,
        test_user: User,
    ):
        """Login with wrong password returns 401."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "WrongPassword123",
            },
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_email(self, async_client: AsyncClient):
        """Login with non-existent email returns 401."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "ValidPass123",
            },
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Login with inactive user account returns 403."""
        # Create inactive user
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("TestPassword123"),
            is_active=False,
        )
        db_session.add(inactive_user)
        await db_session.commit()

        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "TestPassword123",
            },
        )

        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Refresh with valid token returns new token pair."""
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "TestPassword123",
            },
        )
        assert login_resp.status_code == 200
        old_refresh = login_resp.json()["refresh_token"]

        refresh_resp = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": old_refresh},
        )

        assert refresh_resp.status_code == 200
        data = refresh_resp.json()
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "bearer"
        assert data["refresh_token"] != old_refresh

    @pytest.mark.asyncio
    async def test_refresh_token_revoked(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Using same refresh token twice returns 401 (rotation)."""
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "TestPassword123",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        resp1 = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp1.status_code == 200

        resp2 = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp2.status_code == 401
        assert "refresh token" in resp2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, async_client: AsyncClient):
        """Refresh with bogus token returns 401."""
        response = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "this-is-not-a-valid-token"},
        )

        assert response.status_code == 401
        assert "refresh token" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_logout_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Logout revokes the refresh token."""
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "TestPassword123",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        logout_resp = await async_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert logout_resp.status_code == 200

        refresh_after_logout = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_after_logout.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_already_revoked(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Logout with already revoked token returns 404."""
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "TestPassword123",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        logout_resp = await async_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert logout_resp.status_code == 200

        logout_again = await async_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert logout_again.status_code == 404

    @pytest.mark.asyncio
    async def test_login_rate_limiting(
        self,
        async_client: AsyncClient,
    ):
        """6th login attempt in window returns 429."""
        for i in range(5):
            resp = await async_client.post(
                "/api/v1/auth/login",
                json={
                    "email": f"nonexistent{i}@example.com",
                    "password": "Whatever123",
                },
            )
            assert resp.status_code == 401, f"Attempt {i+1} should be 401, got {resp.status_code}"

        resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "one-more@example.com",
                "password": "Whatever123",
            },
        )
        assert resp.status_code == 429, f"6th attempt should be 429, got {resp.status_code}"
