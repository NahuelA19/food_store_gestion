"""Tests for dashboard service functions."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard_service import get_dashboard_stats


@pytest.fixture
def uow_mock() -> AsyncMock:
    uow = AsyncMock()
    uow.session = AsyncMock()
    uow.session.execute = AsyncMock()
    uow.session.add = MagicMock()
    uow.flush = AsyncMock()
    uow.refresh = AsyncMock()
    return uow


def _mock_one(value_tuple) -> MagicMock:
    m = MagicMock()
    m.one.return_value = value_tuple
    return m


def _mock_scalar_one(value) -> MagicMock:
    m = MagicMock()
    m.scalar_one.return_value = value
    return m


def _mock_all(values: list) -> MagicMock:
    m = MagicMock()
    m.all.return_value = values
    return m


@pytest.mark.asyncio
async def test_get_dashboard_stats_success(uow_mock: AsyncMock) -> None:
    mock_orders_today = _mock_one((15, 500.0))
    mock_branches = _mock_scalar_one(5)
    mock_pending = _mock_scalar_one(3)
    mock_products = _mock_scalar_one(200)
    mock_monthly = _mock_scalar_one(15000.0)
    mock_status_counts = _mock_all([("confirmed", 10), ("pending", 3), ("cancelled", 2)])

    uow_mock.session.execute.side_effect = [
        mock_orders_today,
        mock_branches,
        mock_pending,
        mock_products,
        mock_monthly,
        mock_status_counts,
    ]

    result = await get_dashboard_stats(uow_mock)

    assert isinstance(result, DashboardStatsResponse)
    assert result.total_orders_today == 15
    assert result.total_revenue_today == 500.0
    assert result.active_branches == 5
    assert result.pending_orders == 3
    assert result.total_products == 200
    assert result.monthly_revenue == 15000.0
    assert result.orders_by_status == {
        "confirmed": 10,
        "pending": 3,
        "cancelled": 2,
    }
    assert uow_mock.session.execute.call_count == 6


@pytest.mark.asyncio
async def test_get_dashboard_stats_branches_exception_defaults_to_zero(uow_mock: AsyncMock) -> None:
    mock_orders_today = _mock_one((10, 250.0))
    mock_branches = MagicMock()
    mock_branches.scalar_one.side_effect = Exception("DB connection error")
    mock_pending = _mock_scalar_one(2)
    mock_products = _mock_scalar_one(150)
    mock_monthly = _mock_scalar_one(8000.0)
    mock_status_counts = _mock_all([("confirmed", 8), ("pending", 2)])

    uow_mock.session.execute.side_effect = [
        mock_orders_today,
        mock_branches,
        mock_pending,
        mock_products,
        mock_monthly,
        mock_status_counts,
    ]

    result = await get_dashboard_stats(uow_mock)

    assert result.active_branches == 0
    assert result.total_orders_today == 10
    assert result.total_revenue_today == 250.0
    assert result.pending_orders == 2
    assert result.total_products == 150
    assert result.monthly_revenue == 8000.0
    assert result.orders_by_status == {"confirmed": 8, "pending": 2}
    assert uow_mock.session.execute.call_count == 6
