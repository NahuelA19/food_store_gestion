"""Tests for FastAPI dependencies (authentication, role checks, UoW)."""

import pytest
from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uow import UnitOfWork
from app.dependencies import (
    get_uow,
    get_current_user,
    require_role,
)
from app.models.user import User
from app.models.role import Role
from app.models.usuario_rol import UsuarioRol
from app.security.password import get_password_hash
from app.security.jwt import create_access_token
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
async def test_user_with_role(db_session: AsyncSession) -> User:
    """Create a test user with admin role."""
    role = Role(codigo="ADMIN", nombre="Administrador", descripcion="Full access")
    db_session.add(role)
    await db_session.flush()

    user = User(
        email="adminuser@example.com",
        hashed_password=get_password_hash("AdminPassword123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Assign admin role
    usuario_rol = UsuarioRol(usuario_id=user.id, rol_codigo="ADMIN")
    db_session.add(usuario_rol)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_user_without_role(db_session: AsyncSession) -> User:
    """Create a test user with no special roles."""
    user = User(
        email="regularuser@example.com",
        hashed_password=get_password_hash("RegularPassword123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def inactive_user(db_session: AsyncSession) -> User:
    """Create an inactive user."""
    user = User(
        email="inactiveuser@example.com",
        hashed_password=get_password_hash("InactivePassword123"),
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
class TestDependencies:
    """Test FastAPI dependency functions."""

    async def test_get_uow_returns_unit_of_work_instance(
        self, db_session: AsyncSession
    ) -> None:
        """Test get_uow returns a valid UnitOfWork instance."""
        uow_gen = get_uow(db_session)
        uow = await uow_gen.__anext__()

        # Verify UoW has expected attributes
        assert isinstance(uow, UnitOfWork)
        assert uow.session is not None

        # Cleanup
        await uow_gen.aclose()

    async def test_get_current_user_with_valid_token(
        self, db_session: AsyncSession, test_user_with_role: User
    ) -> None:
        """Test get_current_user returns user with valid JWT token."""
        # Create valid token
        token = create_access_token(
            data={"user_id": test_user_with_role.id},
            expires_delta=timedelta(hours=1)
        )

        # Manually call via test client
        client = TestClient(app)
        response = client.get(
            "/api/v1/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Verify successful response
        assert response.status_code == 200
        assert response.json()["user_id"] == test_user_with_role.id

    async def test_get_current_user_without_token_raises_401(self) -> None:
        """Test get_current_user raises 401 when no token provided."""
        client = TestClient(app)
        response = client.get("/api/v1/protected/test")

        # Should be 401 Unauthorized (no credentials)
        assert response.status_code == 401

    async def test_get_current_user_with_invalid_token_raises_401(self) -> None:
        """Test get_current_user raises 401 with invalid token."""
        client = TestClient(app)
        response = client.get(
            "/api/v1/protected/test",
            headers={"Authorization": "Bearer invalid.token.here"},
        )

        # Should be 401 Unauthorized
        assert response.status_code == 401

    async def test_get_current_user_with_expired_token_raises_401(
        self, db_session: AsyncSession, test_user_with_role: User
    ) -> None:
        """Test get_current_user raises 401 with expired token."""
        # Create token with very short expiry (already expired)
        token = create_access_token(
            data={"user_id": test_user_with_role.id},
            expires_delta=timedelta(seconds=-1)
        )

        client = TestClient(app)
        response = client.get(
            "/api/v1/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should be 401 Unauthorized (token expired)
        assert response.status_code == 401

    async def test_require_role_dependency_grants_access_with_correct_role(
        self, db_session: AsyncSession, test_user_with_role: User
    ) -> None:
        """Test require_role dependency allows access when user has required role."""
        token = create_access_token(
            data={"user_id": test_user_with_role.id},
            expires_delta=timedelta(hours=1)
        )

        # Call protected endpoint
        client = TestClient(app)
        response = client.get(
            "/api/v1/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

    async def test_get_current_user_with_deleted_account_raises_401(
        self, db_session: AsyncSession, test_user_with_role: User
    ) -> None:
        """Test get_current_user raises 401 when user account is deleted."""
        from datetime import datetime, timezone
        
        # Create token before deletion
        token = create_access_token(
            data={"user_id": test_user_with_role.id},
            expires_delta=timedelta(hours=1)
        )

        # Delete the user
        test_user_with_role.deleted_at = datetime.now(timezone.utc)
        await db_session.commit()

        client = TestClient(app)
        response = client.get(
            "/api/v1/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should be 401 Unauthorized (account deleted)
        assert response.status_code == 401

    async def test_get_current_user_with_inactive_account_raises_403(
        self, db_session: AsyncSession, inactive_user: User
    ) -> None:
        """Test get_current_user raises 403 when user account is inactive."""
        token = create_access_token(
            data={"user_id": inactive_user.id},
            expires_delta=timedelta(hours=1)
        )

        client = TestClient(app)
        response = client.get(
            "/api/v1/protected/test",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should be 403 Forbidden (user inactive)
        assert response.status_code == 403
