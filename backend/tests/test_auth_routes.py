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
            "/api/auth/register",
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
            "/api/auth/register",
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
                "/api/auth/register",
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
            "/api/auth/register",
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
        """Successful login returns user info and token."""
        response = await async_client.post(
            "/api/auth/login",
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
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(
        self,
        async_client: AsyncClient,
        test_user: User,
    ):
        """Login with wrong password returns 401."""
        response = await async_client.post(
            "/api/auth/login",
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
            "/api/auth/login",
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
            "/api/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "TestPassword123",
            },
        )

        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()
