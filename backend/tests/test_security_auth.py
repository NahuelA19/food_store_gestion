"""Tests for authentication dependency injection."""

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.user import User
from app.security.auth import get_current_user


@pytest.fixture
def mock_credentials() -> MagicMock:
    creds = MagicMock(spec=HTTPAuthorizationCredentials)
    creds.credentials = "valid.jwt.token"
    return creds


@pytest.fixture
def mock_session() -> AsyncMock:
    session = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def active_user() -> MagicMock:
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.is_active = True
    return user


@pytest.fixture
def inactive_user() -> MagicMock:
    user = MagicMock(spec=User)
    user.id = 2
    user.email = "inactive@example.com"
    user.is_active = False
    return user


def _mock_db_result(user) -> MagicMock:
    result = MagicMock()
    result.scalar_one_or_none.return_value = user
    return result


@pytest.mark.asyncio
async def test_get_current_user_success(
    mock_credentials: MagicMock,
    mock_session: AsyncMock,
    active_user: MagicMock,
) -> None:
    payload = {"user_id": 1, "email": "test@example.com"}
    mock_db = _mock_db_result(active_user)
    mock_session.execute.return_value = mock_db

    with patch("app.security.auth.verify_token", return_value=payload):
        user = await get_current_user(mock_credentials, mock_session)

    assert user is active_user
    assert user.id == 1
    assert user.email == "test@example.com"
    assert user.is_active is True
    mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(
    mock_credentials: MagicMock,
    mock_session: AsyncMock,
) -> None:
    with patch("app.security.auth.verify_token", return_value=None):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(mock_credentials, mock_session)

    assert exc.value.status_code == 401
    assert "Invalid or expired token" in exc.value.detail


@pytest.mark.asyncio
async def test_get_current_user_missing_claims(
    mock_credentials: MagicMock,
    mock_session: AsyncMock,
) -> None:
    payload = {"email": "test@example.com"}

    with patch("app.security.auth.verify_token", return_value=payload):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(mock_credentials, mock_session)

    assert exc.value.status_code == 401
    assert "Invalid token claims" in exc.value.detail


@pytest.mark.asyncio
async def test_get_current_user_user_not_found(
    mock_credentials: MagicMock,
    mock_session: AsyncMock,
) -> None:
    payload = {"user_id": 1, "email": "test@example.com"}
    mock_db = _mock_db_result(None)
    mock_session.execute.return_value = mock_db

    with patch("app.security.auth.verify_token", return_value=payload):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(mock_credentials, mock_session)

    assert exc.value.status_code == 401
    assert "User not found" in exc.value.detail


@pytest.mark.asyncio
async def test_get_current_user_inactive(
    mock_credentials: MagicMock,
    mock_session: AsyncMock,
    inactive_user: MagicMock,
) -> None:
    payload = {"user_id": 2, "email": "inactive@example.com"}
    mock_db = _mock_db_result(inactive_user)
    mock_session.execute.return_value = mock_db

    with patch("app.security.auth.verify_token", return_value=payload):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(mock_credentials, mock_session)

    assert exc.value.status_code == 403
    assert "User account is inactive" in exc.value.detail
