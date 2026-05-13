"""Tests for user service functions."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.models.auth import AuthResponse, LoginRequest, RegisterRequest
from app.models.user import User, UserPreference
from app.models.user_profile import (
    AdminUserResponse,
    UserPreferencesResponse,
    UserPreferenceUpdate,
    UserProfileUpdate,
    UserPublicResponse,
    UserResponse,
    UserStatusUpdate,
)
from app.services.user_service import (
    admin_list_users,
    admin_update_user_status,
    authenticate_user,
    get_public_profile,
    get_user_preferences,
    register_user,
    soft_delete_user,
    update_user_preferences,
    update_user_profile,
)


@pytest.fixture
def uow_mock() -> AsyncMock:
    uow = AsyncMock()
    uow.session = AsyncMock()
    uow.session.execute = AsyncMock()
    uow.session.add = MagicMock()
    uow.flush = AsyncMock()
    uow.refresh = AsyncMock()
    return uow


def _mock_scalar_one_or_none(value) -> MagicMock:
    m = MagicMock()
    m.scalar_one_or_none.return_value = value
    return m


def _mock_scalars_all(values: list) -> MagicMock:
    m = MagicMock()
    scalars = MagicMock()
    scalars.all.return_value = values
    m.scalars.return_value = scalars
    return m


def _make_user(**overrides) -> MagicMock:
    defaults = {
        "id": 1,
        "email": "john@example.com",
        "hashed_password": "hashed_secret123",
        "is_active": True,
        "role": "user",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "deleted_at": None,
        "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
    }
    defaults.update(overrides)
    user = MagicMock(spec=User)
    for k, v in defaults.items():
        setattr(user, k, v)
    return user


def _make_pref(user_id: int, pref_key: str, pref_value: str) -> MagicMock:
    pref = MagicMock(spec=UserPreference)
    pref.user_id = user_id
    pref.pref_key = pref_key
    pref.pref_value = pref_value
    pref.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return pref


# ---------------------------------------------------------------------------
# register_user
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_user_success(uow_mock: AsyncMock) -> None:
    mock_lookup = _mock_scalar_one_or_none(None)
    uow_mock.session.execute.return_value = mock_lookup

    async def _refresh_user(*args, **kwargs):
        user = args[0]
        user.id = 1
        user.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
        user.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    uow_mock.refresh = AsyncMock(side_effect=_refresh_user)

    data = RegisterRequest(
        email="john@example.com",
        password="StrongPass1!",
        first_name="John",
        last_name="Doe",
        phone="+1234567890",
    )

    with (
        patch("app.services.user_service.validate_password_strength", return_value=(True, "")),
        patch("app.services.user_service.get_password_hash", return_value="hashed_secret123"),
        patch("app.services.user_service.create_access_token", return_value="test_token"),
    ):
        result = await register_user(uow_mock, data)

    assert isinstance(result, AuthResponse)
    assert result.id == 1
    assert result.email == "john@example.com"
    assert result.first_name == "John"
    assert result.last_name == "Doe"
    assert result.phone == "+1234567890"
    assert result.access_token == "test_token"
    assert result.token_type == "bearer"
    assert uow_mock.session.add.call_count == 4  # user + 3 default prefs
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_register_user_weak_password_raises_422(uow_mock: AsyncMock) -> None:
    data = RegisterRequest(
        email="john@example.com",
        password="alllowercase12",
        first_name="John",
        last_name="Doe",
    )

    with patch("app.services.user_service.validate_password_strength", return_value=(False, "Password too weak")):
        with pytest.raises(HTTPException) as exc:
            await register_user(uow_mock, data)

    assert exc.value.status_code == 422
    assert "Password too weak" in exc.value.detail
    uow_mock.session.execute.assert_not_called()
    uow_mock.session.add.assert_not_called()


@pytest.mark.asyncio
async def test_register_user_duplicate_email_raises_409(uow_mock: AsyncMock) -> None:
    existing_user = _make_user()
    mock_lookup = _mock_scalar_one_or_none(existing_user)
    uow_mock.session.execute.return_value = mock_lookup

    data = RegisterRequest(
        email="john@example.com",
        password="StrongPass1!",
    )

    with patch("app.services.user_service.validate_password_strength", return_value=(True, "")):
        with pytest.raises(HTTPException) as exc:
            await register_user(uow_mock, data)

    assert exc.value.status_code == 409
    assert "Email already registered" in exc.value.detail
    uow_mock.session.add.assert_not_called()


# ---------------------------------------------------------------------------
# authenticate_user
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_authenticate_user_success(uow_mock: AsyncMock) -> None:
    user = _make_user()
    mock_lookup = _mock_scalar_one_or_none(user)
    uow_mock.session.execute.return_value = mock_lookup

    data = LoginRequest(email="john@example.com", password="StrongPass1!")

    with (
        patch("app.services.user_service.verify_password", return_value=True),
        patch("app.services.user_service.create_access_token", return_value="test_token"),
    ):
        result = await authenticate_user(uow_mock, data)

    assert isinstance(result, AuthResponse)
    assert result.id == 1
    assert result.email == "john@example.com"
    assert result.access_token == "test_token"


@pytest.mark.asyncio
async def test_authenticate_user_invalid_credentials_raises_401(uow_mock: AsyncMock) -> None:
    mock_lookup = _mock_scalar_one_or_none(None)
    uow_mock.session.execute.return_value = mock_lookup

    data = LoginRequest(email="wrong@example.com", password="wrongpass")

    with pytest.raises(HTTPException) as exc:
        await authenticate_user(uow_mock, data)

    assert exc.value.status_code == 401
    assert "Invalid credentials" in exc.value.detail


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password_raises_401(uow_mock: AsyncMock) -> None:
    user = _make_user()
    mock_lookup = _mock_scalar_one_or_none(user)
    uow_mock.session.execute.return_value = mock_lookup

    data = LoginRequest(email="john@example.com", password="wrongpass")

    with patch("app.services.user_service.verify_password", return_value=False):
        with pytest.raises(HTTPException) as exc:
            await authenticate_user(uow_mock, data)

    assert exc.value.status_code == 401
    assert "Invalid credentials" in exc.value.detail


@pytest.mark.asyncio
async def test_authenticate_user_inactive_raises_403(uow_mock: AsyncMock) -> None:
    user = _make_user(is_active=False)
    mock_lookup = _mock_scalar_one_or_none(user)
    uow_mock.session.execute.return_value = mock_lookup

    data = LoginRequest(email="john@example.com", password="StrongPass1!")

    with patch("app.services.user_service.verify_password", return_value=True):
        with pytest.raises(HTTPException) as exc:
            await authenticate_user(uow_mock, data)

    assert exc.value.status_code == 403
    assert "Account is inactive" in exc.value.detail


@pytest.mark.asyncio
async def test_authenticate_user_soft_deleted_raises_403(uow_mock: AsyncMock) -> None:
    user = _make_user(is_active=True, deleted_at=datetime(2024, 6, 1, tzinfo=timezone.utc))
    mock_lookup = _mock_scalar_one_or_none(user)
    uow_mock.session.execute.return_value = mock_lookup

    data = LoginRequest(email="john@example.com", password="StrongPass1!")

    with patch("app.services.user_service.verify_password", return_value=True):
        with pytest.raises(HTTPException) as exc:
            await authenticate_user(uow_mock, data)

    assert exc.value.status_code == 403
    assert "Account is inactive" in exc.value.detail


# ---------------------------------------------------------------------------
# get_public_profile
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_public_profile_success(uow_mock: AsyncMock) -> None:
    user = _make_user()
    mock_lookup = _mock_scalar_one_or_none(user)
    uow_mock.session.execute.return_value = mock_lookup

    result = await get_public_profile(uow_mock, 1)

    assert isinstance(result, UserPublicResponse)
    assert result.id == 1
    assert result.first_name == "John"
    assert result.last_name == "Doe"


@pytest.mark.asyncio
async def test_get_public_profile_not_found_raises_404(uow_mock: AsyncMock) -> None:
    mock_lookup = _mock_scalar_one_or_none(None)
    uow_mock.session.execute.return_value = mock_lookup

    with pytest.raises(HTTPException) as exc:
        await get_public_profile(uow_mock, 999)

    assert exc.value.status_code == 404
    assert "User not found" in exc.value.detail


# ---------------------------------------------------------------------------
# update_user_profile
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_user_profile_success(uow_mock: AsyncMock) -> None:
    user = _make_user()

    async def _refresh_user(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_user)

    data = UserProfileUpdate(first_name="Jane", last_name="Smith", phone="+9876543210")

    result = await update_user_profile(uow_mock, user, data)

    assert isinstance(result, UserResponse)
    assert user.first_name == "Jane"
    assert user.last_name == "Smith"
    assert user.phone == "+9876543210"
    assert user.updated_at is not None
    uow_mock.session.add.assert_called_once_with(user)
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


# ---------------------------------------------------------------------------
# get_user_preferences
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_user_preferences_success(uow_mock: AsyncMock) -> None:
    prefs = [
        _make_pref(1, "language", "es"),
        _make_pref(1, "theme", "dark"),
        _make_pref(1, "notifications", "push"),
    ]
    uow_mock.session.execute.return_value = _mock_scalars_all(prefs)

    result = await get_user_preferences(uow_mock, 1)

    assert isinstance(result, UserPreferencesResponse)
    assert result.language == "es"
    assert result.theme == "dark"
    assert result.notifications == "push"


@pytest.mark.asyncio
async def test_get_user_preferences_fallback_to_defaults(uow_mock: AsyncMock) -> None:
    prefs = [
        _make_pref(1, "language", "fr"),
    ]
    uow_mock.session.execute.return_value = _mock_scalars_all(prefs)

    result = await get_user_preferences(uow_mock, 1)

    assert result.language == "fr"
    assert result.theme == "light"
    assert result.notifications == "email"


# ---------------------------------------------------------------------------
# update_user_preferences
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_user_preferences_update_existing(uow_mock: AsyncMock) -> None:
    existing_lang = _make_pref(1, "language", "en")
    mock_update = _mock_scalar_one_or_none(existing_lang)

    prefs_after_update = [
        _make_pref(1, "language", "fr"),
        _make_pref(1, "theme", "light"),
        _make_pref(1, "notifications", "email"),
    ]
    uow_mock.session.execute.side_effect = [
        mock_update,
        _mock_scalars_all(prefs_after_update),
    ]

    data = UserPreferenceUpdate(language="fr")

    result = await update_user_preferences(uow_mock, 1, data)

    assert isinstance(result, UserPreferencesResponse)
    assert result.language == "fr"
    assert existing_lang.pref_value == "fr"
    uow_mock.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_user_preferences_create_new(uow_mock: AsyncMock) -> None:
    mock_none = _mock_scalar_one_or_none(None)

    prefs_after_update = [
        _make_pref(1, "language", "de"),
        _make_pref(1, "theme", "light"),
        _make_pref(1, "notifications", "email"),
    ]
    uow_mock.session.execute.side_effect = [
        mock_none,
        _mock_scalars_all(prefs_after_update),
    ]

    data = UserPreferenceUpdate(language="de")

    result = await update_user_preferences(uow_mock, 1, data)

    assert isinstance(result, UserPreferencesResponse)
    assert result.language == "de"
    assert uow_mock.session.add.call_count == 1


# ---------------------------------------------------------------------------
# soft_delete_user
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_soft_delete_user_sets_deleted_at_and_inactive(uow_mock: AsyncMock) -> None:
    user = _make_user()

    await soft_delete_user(uow_mock, user)

    assert user.deleted_at is not None
    assert user.is_active is False
    uow_mock.session.add.assert_called_once_with(user)


# ---------------------------------------------------------------------------
# admin_list_users
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_list_users_without_cursor(uow_mock: AsyncMock) -> None:
    users = [_make_user(id=i) for i in range(1, 4)]
    uow_mock.session.execute.return_value = _mock_scalars_all(users)

    result = await admin_list_users(uow_mock, cursor=None, limit=10)

    assert len(result["users"]) == 3
    assert all(isinstance(u, AdminUserResponse) for u in result["users"])
    assert result["users"][0].id == 1
    assert result["next_cursor"] is None


@pytest.mark.asyncio
async def test_admin_list_users_with_cursor(uow_mock: AsyncMock) -> None:
    users = [_make_user(id=i) for i in range(5, 8)]
    uow_mock.session.execute.return_value = _mock_scalars_all(users)

    result = await admin_list_users(uow_mock, cursor=4, limit=10)

    assert len(result["users"]) == 3
    assert result["users"][0].id == 5
    assert result["next_cursor"] is None


@pytest.mark.asyncio
async def test_admin_list_users_pagination_boundary(uow_mock: AsyncMock) -> None:
    users = [_make_user(id=i) for i in range(1, 6)]
    uow_mock.session.execute.return_value = _mock_scalars_all(users)

    result = await admin_list_users(uow_mock, cursor=None, limit=3)

    assert len(result["users"]) == 3
    assert result["users"][0].id == 1
    assert result["users"][-1].id == 3
    assert result["next_cursor"] == 3


# ---------------------------------------------------------------------------
# admin_update_user_status
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_update_user_status_success(uow_mock: AsyncMock) -> None:
    user = _make_user(is_active=False)
    mock_lookup = _mock_scalar_one_or_none(user)
    uow_mock.session.execute.return_value = mock_lookup

    async def _refresh_user(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_user)

    data = UserStatusUpdate(is_active=True)
    result = await admin_update_user_status(uow_mock, 1, data)

    assert isinstance(result, AdminUserResponse)
    assert user.is_active is True
    assert user.updated_at is not None
    uow_mock.session.add.assert_called_once_with(user)
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_admin_update_user_status_not_found_raises_404(uow_mock: AsyncMock) -> None:
    mock_lookup = _mock_scalar_one_or_none(None)
    uow_mock.session.execute.return_value = mock_lookup

    data = UserStatusUpdate(is_active=True)

    with pytest.raises(HTTPException) as exc:
        await admin_update_user_status(uow_mock, 999, data)

    assert exc.value.status_code == 404
    assert "User not found" in exc.value.detail
    uow_mock.session.add.assert_not_called()
    uow_mock.flush.assert_not_called()
