"""Tests for inventory service functions."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.models.inventory import Inventory
from app.schemas.inventory import InventoryReserveRequest, InventoryUpdate
from app.services.inventory_service import (
    get_inventory,
    reserve_inventory,
    update_inventory,
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


@pytest.fixture
def sample_inventory() -> Inventory:
    return Inventory(
        id=1,
        product_id=1,
        stock_quantity=100,
        reserved_quantity=10,
        low_stock_threshold=10,
    )


# ---------------------------------------------------------------------------
# get_inventory
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_inventory_success(uow_mock: AsyncMock, sample_inventory: Inventory) -> None:
    mock_product = _mock_scalar_one_or_none(MagicMock())
    mock_inv = _mock_scalar_one_or_none(sample_inventory)
    uow_mock.session.execute.side_effect = [mock_product, mock_inv]

    result = await get_inventory(uow_mock, product_id=1)

    assert result.id == 1
    assert result.product_id == 1
    assert result.stock_quantity == 100
    assert result.reserved_quantity == 10
    assert result.available_quantity == 90
    assert uow_mock.session.execute.call_count == 2


@pytest.mark.asyncio
async def test_get_inventory_product_not_found(uow_mock: AsyncMock) -> None:
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    with pytest.raises(HTTPException) as exc:
        await get_inventory(uow_mock, product_id=999)

    assert exc.value.status_code == 404
    assert "999" in exc.value.detail


@pytest.mark.asyncio
async def test_get_inventory_inventory_not_found(uow_mock: AsyncMock) -> None:
    mock_product = _mock_scalar_one_or_none(MagicMock())
    mock_inv = _mock_scalar_one_or_none(None)
    uow_mock.session.execute.side_effect = [mock_product, mock_inv]

    with pytest.raises(HTTPException) as exc:
        await get_inventory(uow_mock, product_id=1)

    assert exc.value.status_code == 404
    assert "Inventory not found" in exc.value.detail


# ---------------------------------------------------------------------------
# update_inventory
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_inventory_success(uow_mock: AsyncMock, sample_inventory: Inventory) -> None:
    mock_product = _mock_scalar_one_or_none(MagicMock())
    mock_inv = _mock_scalar_one_or_none(sample_inventory)
    uow_mock.session.execute.side_effect = [mock_product, mock_inv]

    async def _refresh(*args, **kwargs):
        args[0].stock_quantity = 50

    uow_mock.refresh = AsyncMock(side_effect=_refresh)

    data = InventoryUpdate(stock_quantity=50)
    result = await update_inventory(uow_mock, product_id=1, data=data)

    assert result.stock_quantity == 50
    assert sample_inventory.stock_quantity == 50
    assert uow_mock.session.execute.call_count == 2
    uow_mock.session.add.assert_called_once()
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_inventory_below_reserved_raises_400(uow_mock: AsyncMock, sample_inventory: Inventory) -> None:
    mock_product = _mock_scalar_one_or_none(MagicMock())
    mock_inv = _mock_scalar_one_or_none(sample_inventory)
    uow_mock.session.execute.side_effect = [mock_product, mock_inv]

    data = InventoryUpdate(stock_quantity=5)

    with pytest.raises(HTTPException) as exc:
        await update_inventory(uow_mock, product_id=1, data=data)

    assert exc.value.status_code == 400
    assert "reserved" in exc.value.detail
    uow_mock.session.add.assert_not_called()


# ---------------------------------------------------------------------------
# reserve_inventory
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reserve_inventory_success(uow_mock: AsyncMock, sample_inventory: Inventory) -> None:
    mock_product = _mock_scalar_one_or_none(MagicMock())
    mock_inv = _mock_scalar_one_or_none(sample_inventory)
    uow_mock.session.execute.side_effect = [mock_product, mock_inv]

    async def _refresh(*args, **kwargs):
        args[0].reserved_quantity = 15

    uow_mock.refresh = AsyncMock(side_effect=_refresh)

    data = InventoryReserveRequest(quantity=5)
    result = await reserve_inventory(uow_mock, product_id=1, data=data)

    assert result.reserved_quantity == 15
    assert sample_inventory.reserved_quantity == 15
    uow_mock.session.add.assert_called_once()
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_reserve_inventory_insufficient_stock_raises_409(uow_mock: AsyncMock, sample_inventory: Inventory) -> None:
    mock_product = _mock_scalar_one_or_none(MagicMock())
    mock_inv = _mock_scalar_one_or_none(sample_inventory)
    uow_mock.session.execute.side_effect = [mock_product, mock_inv]

    data = InventoryReserveRequest(quantity=100)

    with pytest.raises(HTTPException) as exc:
        await reserve_inventory(uow_mock, product_id=1, data=data)

    assert exc.value.status_code == 409
    assert "available" in exc.value.detail
    uow_mock.session.add.assert_not_called()
