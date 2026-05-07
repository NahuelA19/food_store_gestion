"""Integration tests for authentication middleware."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.security.jwt import create_access_token
from app.security.password import get_password_hash


@pytest.mark.asyncio
class TestAuthMiddleware:
    """Test authentication middleware and protected routes."""

    @pytest.mark.asyncio
    async def test_protected_route_with_valid_token(
        self,
        async_client: AsyncClient,
        test_user: User,
    ):
        """Protected route accepts valid JWT token."""
        # Generate token for test user
        token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})

        response = await async_client.get(
            "/api/health/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["user_id"] == test_user.id
        assert data["user_email"] == test_user.email

    @pytest.mark.asyncio
    async def test_protected_route_without_token(self, async_client: AsyncClient):
        """Protected route rejects request without token."""
        response = await async_client.get("/api/health/protected/test")

        assert response.status_code == 401  # Unauthorized (missing credentials)

    @pytest.mark.asyncio
    async def test_protected_route_with_invalid_token(self, async_client: AsyncClient):
        """Protected route rejects invalid token."""
        response = await async_client.get(
            "/api/health/protected/test",
            headers={"Authorization": "Bearer invalid.token.here"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_with_expired_token(
        self,
        async_client: AsyncClient,
        test_user: User,
    ):
        """Protected route rejects expired token."""
        from datetime import timedelta

        # Create expired token
        expired_token = create_access_token(
            data={"user_id": test_user.id, "email": test_user.email},
            expires_delta=timedelta(seconds=-1),
        )

        response = await async_client.get(
            "/api/health/protected/test",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_protected_route_with_nonexistent_user(self, async_client: AsyncClient):
        """Protected route rejects token with non-existent user."""
        # Create token for non-existent user
        token = create_access_token(data={"user_id": 99999, "email": "nonexistent@example.com"})

        response = await async_client.get(
            "/api/health/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 401
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_protected_route_with_inactive_user(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Protected route rejects token with inactive user."""
        # Create inactive user
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("Password123"),
            is_active=False,
        )
        db_session.add(inactive_user)
        await db_session.commit()

        # Create token for inactive user
        token = create_access_token(
            data={"user_id": inactive_user.id, "email": inactive_user.email}
        )

        response = await async_client.get(
            "/api/health/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_public_route_without_token(self, async_client: AsyncClient):
        """Public route bypasses authentication."""
        response = await async_client.get("/api/health/public/test")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    @pytest.mark.asyncio
    async def test_public_route_with_token(
        self,
        async_client: AsyncClient,
        test_user: User,
    ):
        """Public route works with or without token."""
        token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})

        response = await async_client.get(
            "/api/health/public/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
