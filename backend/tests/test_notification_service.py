"""Tests for notification service functions."""

from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.notification import Notification
from app.models.order import OrderStatus
from app.services.notification_service import (
    get_user_notification_preference,
    create_notification,
    create_and_send_notification,
    get_user_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    create_order_notification,
    cleanup_old_notifications,
)


@pytest.fixture
def sample_notification() -> Notification:
    return Notification(
        id=1,
        user_id=1,
        type="order_confirmed",
        title="Order Confirmed",
        message="Your order has been confirmed and is being prepared.",
        related_order_id=100,
        is_read=False,
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )


@pytest.fixture
def uow_mock() -> AsyncMock:
    uow = AsyncMock()
    uow.session = AsyncMock()
    uow.session.execute = AsyncMock()
    uow.session.add = MagicMock()
    uow.session.delete = MagicMock()
    uow.flush = AsyncMock()
    uow.refresh = AsyncMock()
    return uow


def _mock_scalar_one_or_none(value) -> MagicMock:
    m = MagicMock()
    m.scalar_one_or_none.return_value = value
    return m


def _mock_scalar_one(value) -> MagicMock:
    m = MagicMock()
    m.scalar_one.return_value = value
    return m


def _mock_scalars_all(values: list) -> MagicMock:
    m = MagicMock()
    scalars = MagicMock()
    scalars.all.return_value = values
    m.scalars.return_value = scalars
    return m


# ---------------------------------------------------------------------------
# get_user_notification_preference
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_preference_returns_value(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="email")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    result = await get_user_notification_preference(uow_mock, 1)

    assert result == "email"


@pytest.mark.asyncio
async def test_get_preference_default_when_no_pref(uow_mock: AsyncMock) -> None:
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    result = await get_user_notification_preference(uow_mock, 1)

    assert result == "email"


# ---------------------------------------------------------------------------
# create_notification
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_notification_with_email_pref(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="email")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    async def _refresh_notif(*args, **kwargs):
        notif = args[0]
        notif.id = 1
        notif.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await create_notification(uow_mock, user_id=1, type="order_confirmed", title="Order Confirmed", message="Test", related_order_id=100)

    assert result is not None
    assert result.id == 1
    assert result.type == "order_confirmed"
    assert result.user_id == 1
    assert result.related_order_id == 100
    assert result.is_read is False
    uow_mock.session.add.assert_called_once()
    uow_mock.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_notification_with_push_pref(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="push")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    async def _refresh_notif(*args, **kwargs):
        args[0].id = 1

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await create_notification(uow_mock, user_id=1, type="shipped", title="Order On Its Way", message="Your order is on its way.")

    assert result is not None
    uow_mock.session.add.assert_called_once()


@pytest.mark.asyncio
async def test_create_notification_pref_off_returns_none(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="off")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    result = await create_notification(uow_mock, user_id=1, type="order_confirmed", title="Order Confirmed", message="Test")

    assert result is None
    uow_mock.session.add.assert_not_called()


@pytest.mark.asyncio
async def test_create_notification_no_related_order(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="email")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    async def _refresh_notif(*args, **kwargs):
        args[0].id = 2

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await create_notification(uow_mock, user_id=2, type="payment_succeeded", title="Payment Confirmed", message="Your payment has been received.")

    assert result is not None
    assert result.related_order_id is None


# ---------------------------------------------------------------------------
# create_and_send_notification
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_and_send_notification_creates(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="email")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    async def _refresh_notif(*args, **kwargs):
        args[0].id = 1

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await create_and_send_notification(uow_mock, user_id=1, type="delivered", title="Order Delivered", message="Enjoy!", related_order_id=50)

    assert result is not None
    assert result.id == 1
    assert result.type == "delivered"
    uow_mock.session.add.assert_called_once()


@pytest.mark.asyncio
async def test_create_and_send_notification_pref_off_returns_none(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="off")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    result = await create_and_send_notification(uow_mock, user_id=1, type="delivered", title="Order Delivered", message="Enjoy!")

    assert result is None
    uow_mock.session.add.assert_not_called()


# ---------------------------------------------------------------------------
# get_user_notifications
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_user_notifications_paginated(uow_mock: AsyncMock, sample_notification: Notification) -> None:
    mock_count = _mock_scalar_one(5)
    mock_unread = _mock_scalar_one(2)
    mock_items = _mock_scalars_all([sample_notification])
    uow_mock.session.execute.side_effect = [mock_count, mock_unread, mock_items]

    items, total, unread = await get_user_notifications(uow_mock, user_id=1, page=1, limit=20)

    assert len(items) == 1
    assert items[0].id == 1
    assert total == 5
    assert unread == 2


@pytest.mark.asyncio
async def test_get_user_notifications_empty(uow_mock: AsyncMock) -> None:
    mock_count = _mock_scalar_one(0)
    mock_unread = _mock_scalar_one(0)
    mock_items = _mock_scalars_all([])
    uow_mock.session.execute.side_effect = [mock_count, mock_unread, mock_items]

    items, total, unread = await get_user_notifications(uow_mock, user_id=1)

    assert items == []
    assert total == 0
    assert unread == 0


@pytest.mark.asyncio
async def test_get_user_notifications_unread_only(uow_mock: AsyncMock, sample_notification: Notification) -> None:
    mock_count = _mock_scalar_one(1)
    mock_unread = _mock_scalar_one(1)
    mock_items = _mock_scalars_all([sample_notification])
    uow_mock.session.execute.side_effect = [mock_count, mock_unread, mock_items]

    items, total, unread = await get_user_notifications(uow_mock, user_id=1, unread_only=True)

    assert len(items) == 1
    assert items[0].is_read is False


# ---------------------------------------------------------------------------
# get_unread_count
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_unread_count_returns_count(uow_mock: AsyncMock) -> None:
    uow_mock.session.execute.return_value = _mock_scalar_one(3)

    result = await get_unread_count(uow_mock, user_id=1)

    assert result == 3


@pytest.mark.asyncio
async def test_get_unread_count_zero(uow_mock: AsyncMock) -> None:
    uow_mock.session.execute.return_value = _mock_scalar_one(0)

    result = await get_unread_count(uow_mock, user_id=1)

    assert result == 0


# ---------------------------------------------------------------------------
# mark_as_read
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_mark_as_read_updates_notification(uow_mock: AsyncMock, sample_notification: Notification) -> None:
    sample_notification.is_read = False
    mock_get = _mock_scalar_one_or_none(sample_notification)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_notif(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await mark_as_read(uow_mock, notification_id=1, user_id=1)

    assert result is not None
    assert result.is_read is True
    uow_mock.session.add.assert_called_once_with(sample_notification)
    uow_mock.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_mark_as_read_not_found_returns_none(uow_mock: AsyncMock) -> None:
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    result = await mark_as_read(uow_mock, notification_id=999, user_id=1)

    assert result is None
    uow_mock.session.add.assert_not_called()


# ---------------------------------------------------------------------------
# mark_all_as_read
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_mark_all_as_read_returns_count(uow_mock: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.rowcount = 3
    uow_mock.session.execute.return_value = mock_result

    result = await mark_all_as_read(uow_mock, user_id=1)

    assert result == 3


@pytest.mark.asyncio
async def test_mark_all_as_read_none_to_update(uow_mock: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.rowcount = 0
    uow_mock.session.execute.return_value = mock_result

    result = await mark_all_as_read(uow_mock, user_id=1)

    assert result == 0


# ---------------------------------------------------------------------------
# create_order_notification
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_order_notification_known_status(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="email")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    async def _refresh_notif(*args, **kwargs):
        notif = args[0]
        notif.id = 1
        notif.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await create_order_notification(uow_mock, order_id=100, user_id=1, new_status=OrderStatus.CONFIRMADO)

    assert result is not None
    assert result.type == "order_confirmed"
    assert result.title == "Order Confirmed"
    assert "Order #100." in result.message
    assert result.related_order_id == 100


@pytest.mark.asyncio
async def test_create_order_notification_cancelled(uow_mock: AsyncMock) -> None:
    mock_pref = MagicMock(pref_value="email")
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(mock_pref)

    async def _refresh_notif(*args, **kwargs):
        args[0].id = 2

    uow_mock.refresh = AsyncMock(side_effect=_refresh_notif)

    result = await create_order_notification(uow_mock, order_id=200, user_id=1, new_status=OrderStatus.CANCELADO)

    assert result is not None
    assert result.type == "cancelled"
    assert result.title == "Order Cancelled"
    assert "Order #200." in result.message


@pytest.mark.asyncio
async def test_create_order_notification_unknown_status_returns_none(uow_mock: AsyncMock) -> None:
    result = await create_order_notification(uow_mock, order_id=100, user_id=1, new_status=OrderStatus.PENDIENTE)

    assert result is None
    uow_mock.session.execute.assert_not_called()


# ---------------------------------------------------------------------------
# cleanup_old_notifications
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cleanup_old_notifications_deletes_old(uow_mock: AsyncMock) -> None:
    old_notif_1 = Notification(id=1, created_at=datetime(2023, 1, 1, tzinfo=timezone.utc))
    old_notif_2 = Notification(id=2, created_at=datetime(2023, 6, 1, tzinfo=timezone.utc))
    mock_result = _mock_scalars_all([old_notif_1, old_notif_2])
    uow_mock.session.execute.return_value = mock_result

    result = await cleanup_old_notifications(uow_mock, days=90)

    assert result == 2
    assert uow_mock.session.delete.call_count == 2
    uow_mock.session.delete.assert_any_call(old_notif_1)
    uow_mock.session.delete.assert_any_call(old_notif_2)


@pytest.mark.asyncio
async def test_cleanup_old_notifications_none(uow_mock: AsyncMock) -> None:
    mock_result = _mock_scalars_all([])
    uow_mock.session.execute.return_value = mock_result

    result = await cleanup_old_notifications(uow_mock, days=90)

    assert result == 0
    uow_mock.session.delete.assert_not_called()
