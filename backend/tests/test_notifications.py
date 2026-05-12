"""Tests for notification endpoints and services."""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.notification import Notification
from app.models.user import User, UserPreference
from app.services.notification_service import (
    create_and_send_notification,
    create_notification,
    get_unread_count,
    get_user_notifications,
    mark_all_as_read,
    mark_as_read,
)
@pytest.fixture
def test_user(db_session: AsyncSession) -> User:
    """Create a test user with default preferences."""
    import factory

    user = User(
        email=f"notif_test_{factory.Sequence(lambda n: n)}@example.com",
        hashed_password="hashed_TestPass123",
        is_active=True,
        role="user",
    )
    db_session.add(user)
    db_session.flush()

    # Add notification preference
    pref = UserPreference(user_id=user.id, pref_key="notifications", pref_value="email")
    db_session.add(pref)
    db_session.flush()
    db_session.commit()
    return user


@pytest.mark.asyncio
async def test_create_notification_respects_preference(db_session: AsyncSession, test_user: User) -> None:
    """Test create_notification respects user preferences."""
    # With "email" preference, notification should be created
    notif = await create_notification(
        db=db_session,
        user_id=test_user.id,
        type="test",
        title="Test Title",
        message="Test message",
    )
    assert notif is not None
    assert notif.title == "Test Title"
    assert notif.is_read is False

    # With "off" preference, notification should be skipped
    test_user_off = User(
        email="off_pref@example.com",
        hashed_password="hashed_TestPass123",
        is_active=True,
        role="user",
    )
    db_session.add(test_user_off)
    db_session.flush()
    pref_off = UserPreference(user_id=test_user_off.id, pref_key="notifications", pref_value="off")
    db_session.add(pref_off)
    db_session.flush()
    db_session.commit()

    notif_off = await create_notification(
        db=db_session,
        user_id=test_user_off.id,
        type="test",
        title="Should Not Appear",
        message="This should not be created",
    )
    assert notif_off is None


@pytest.mark.asyncio
async def test_get_user_notifications_pagination(async_client: AsyncClient, db_session: AsyncSession, test_user: User) -> None:
    """Test get_user_notifications with pagination."""
    # Create multiple notifications
    for i in range(5):
        await create_notification(
            db=db_session,
            user_id=test_user.id,
            type="test",
            title=f"Notification {i}",
            message=f"Message {i}",
        )
    await db_session.commit()

    items, total, unread = await get_user_notifications(
        db=db_session,
        user_id=test_user.id,
        page=1,
        limit=3,
    )
    assert len(items) == 3
    assert total == 5
    assert unread == 5


@pytest.mark.asyncio
async def test_get_unread_count(db_session: AsyncSession, test_user: User) -> None:
    """Test unread count."""
    for i in range(3):
        await create_notification(
            db=db_session,
            user_id=test_user.id,
            type="test",
            title=f"Unread {i}",
            message=f"Message {i}",
        )
    await db_session.commit()

    count = await get_unread_count(db=db_session, user_id=test_user.id)
    assert count == 3


@pytest.mark.asyncio
async def test_mark_as_read(db_session: AsyncSession, test_user: User) -> None:
    """Test mark_as_read."""
    notif = await create_notification(
        db=db_session,
        user_id=test_user.id,
        type="test",
        title="Mark Read",
        message="Will be marked read",
    )
    await db_session.commit()
    assert notif is not None
    assert notif.is_read is False

    updated = await mark_as_read(
        db=db_session,
        notification_id=notif.id,
        user_id=test_user.id,
    )
    assert updated is not None
    assert updated.is_read is True


@pytest.mark.asyncio
async def test_mark_all_as_read(db_session: AsyncSession, test_user: User) -> None:
    """Test mark_all_as_read."""
    for i in range(3):
        await create_notification(
            db=db_session,
            user_id=test_user.id,
            type="test",
            title=f"Batch {i}",
            message=f"Message {i}",
        )
    await db_session.commit()

    updated = await mark_all_as_read(db=db_session, user_id=test_user.id)
    assert updated == 3

    count = await get_unread_count(db=db_session, user_id=test_user.id)
    assert count == 0


@pytest.mark.asyncio
async def test_get_notifications_endpoint(async_client: AsyncClient, test_user: User) -> None:
    """Test GET /api/v1/notifications/ endpoint."""
    # Get auth token
    from app.auth import create_access_token

    token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # List should be empty initially
    response = await async_client.get("/api/v1/notifications/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 0
    assert data["unread_count"] == 0


@pytest.mark.asyncio
async def test_get_unread_count_endpoint(async_client: AsyncClient, db_session: AsyncSession, test_user: User) -> None:
    """Test GET /api/v1/notifications/unread-count endpoint."""
    from app.auth import create_access_token

    token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    response = await async_client.get("/api/v1/notifications/unread-count", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "unread_count" in data


@pytest.mark.asyncio
async def test_notifications_require_auth(async_client: AsyncClient) -> None:
    """Test notification endpoints return 401 without auth."""
    response = await async_client.get("/api/v1/notifications/")
    assert response.status_code == 401

    response = await async_client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 401

    response = await async_client.patch("/api/v1/notifications/1/read")
    assert response.status_code == 401

    response = await async_client.patch("/api/v1/notifications/read-all")
    assert response.status_code == 401



