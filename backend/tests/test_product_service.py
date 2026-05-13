"""Tests for product service functions."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.product_service import (
    create_product,
    delete_product,
    get_product,
    get_related_products,
    list_products,
    toggle_availability,
    update_product,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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


def _mock_scalar(value) -> MagicMock:
    m = MagicMock()
    m.scalar.return_value = value
    return m


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_product() -> Product:
    return Product(
        id=1,
        name="Test Product",
        description="A test product description",
        price=Decimal("19.99"),
        category_id=1,
        is_available=True,
        image_url=None,
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )


@pytest.fixture
def second_product() -> Product:
    return Product(
        id=2,
        name="Another Product",
        description="Another description",
        price=Decimal("29.99"),
        category_id=2,
        is_available=False,
        image_url="http://example.com/img.jpg",
        created_at=datetime(2024, 6, 1, tzinfo=timezone.utc),
        updated_at=datetime(2024, 6, 1, tzinfo=timezone.utc),
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


# ---------------------------------------------------------------------------
# list_products
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_products_basic(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Happy path — returns paginated products with correct metadata."""
    mock_count = _mock_scalar(25)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock)

    assert len(result["items"]) == 1
    assert result["items"][0].id == 1
    assert result["items"][0].name == "Test Product"
    assert result["total"] == 25
    assert result["page"] == 1
    assert result["limit"] == 20
    assert result["total_pages"] == 2
    assert result["has_next"] is True
    assert result["has_previous"] is False
    assert uow_mock.session.execute.await_count == 2


@pytest.mark.asyncio
async def test_list_products_empty(uow_mock: AsyncMock) -> None:
    """Returns empty items list when no products match."""
    mock_count = _mock_scalar(0)
    mock_items = _mock_scalars_all([])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock)

    assert result["items"] == []
    assert result["total"] == 0
    assert result["total_pages"] == 0
    assert result["has_next"] is False
    assert result["has_previous"] is False


@pytest.mark.asyncio
async def test_list_products_with_category_filter(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Filters products by category_id."""
    mock_count = _mock_scalar(5)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, category_id=1)

    assert len(result["items"]) == 1
    assert result["items"][0].category_id == 1
    assert result["total"] == 5


@pytest.mark.asyncio
async def test_list_products_with_price_range(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Filters products by min_price and max_price."""
    mock_count = _mock_scalar(3)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, min_price=Decimal("10.00"), max_price=Decimal("50.00"))

    assert len(result["items"]) == 1
    assert result["total"] == 3


@pytest.mark.asyncio
async def test_list_products_with_search(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Filters products by search term (ilike on name)."""
    mock_count = _mock_scalar(1)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, search="test")

    assert len(result["items"]) == 1
    assert result["items"][0].name == "Test Product"
    assert result["total"] == 1


@pytest.mark.asyncio
async def test_list_products_with_in_stock_filter(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Filters products by in_stock (is_available)."""
    mock_count = _mock_scalar(10)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, in_stock=True)

    assert len(result["items"]) == 1
    assert result["total"] == 10


@pytest.mark.asyncio
async def test_list_products_sorted_by_name_asc(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Sorts products by name ascending."""
    mock_count = _mock_scalar(10)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, sort_by="name", order="asc")

    assert len(result["items"]) == 1


@pytest.mark.asyncio
async def test_list_products_sorted_by_price_desc(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Sorts products by price descending."""
    mock_count = _mock_scalar(10)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, sort_by="price", order="desc")

    assert len(result["items"]) == 1


@pytest.mark.asyncio
async def test_list_products_second_page(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Paginates correctly with has_previous and has_next."""
    mock_count = _mock_scalar(50)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, page=2, limit=10)

    assert result["page"] == 2
    assert result["limit"] == 10
    assert result["total_pages"] == 5
    assert result["has_next"] is True
    assert result["has_previous"] is True


@pytest.mark.asyncio
async def test_list_products_last_page(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Last page has has_next=False."""
    mock_count = _mock_scalar(21)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(uow_mock, page=2, limit=20)

    assert result["page"] == 2
    assert result["total_pages"] == 2
    assert result["has_next"] is False
    assert result["has_previous"] is True


@pytest.mark.asyncio
async def test_list_products_with_all_filters(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Applies all filters simultaneously."""
    mock_count = _mock_scalar(1)
    mock_items = _mock_scalars_all([sample_product])
    uow_mock.session.execute.side_effect = [mock_count, mock_items]

    result = await list_products(
        uow_mock,
        page=1,
        limit=20,
        category_id=1,
        min_price=Decimal("10.00"),
        max_price=Decimal("50.00"),
        in_stock=True,
        search="test",
        sort_by="price",
        order="asc",
    )

    assert len(result["items"]) == 1
    assert result["total"] == 1
    assert result["page"] == 1


# ---------------------------------------------------------------------------
# get_product
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_product_found(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Returns the product when found."""
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(sample_product)

    result = await get_product(uow_mock, 1)

    assert result.id == 1
    assert result.name == "Test Product"
    assert result.price == Decimal("19.99")
    uow_mock.session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_product_not_found(uow_mock: AsyncMock) -> None:
    """Raises 404 when product does not exist."""
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    with pytest.raises(HTTPException) as exc:
        await get_product(uow_mock, 999)

    assert exc.value.status_code == 404
    assert "999" in exc.value.detail


# ---------------------------------------------------------------------------
# create_product
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_product_success(uow_mock: AsyncMock) -> None:
    """Creates product + inventory, returns product with generated fields."""
    category_mock = MagicMock()
    category_mock.id = 1
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(category_mock)

    async def _refresh_product(*args, **kwargs):
        product = args[0]
        product.id = 1
        product.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
        product.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    data = ProductCreate(
        name="New Product",
        description="Brand new product",
        price=Decimal("9.99"),
        category_id=1,
    )

    result = await create_product(uow_mock, data)

    assert result.name == "New Product"
    assert result.description == "Brand new product"
    assert result.price == Decimal("9.99")
    assert result.category_id == 1
    assert result.is_available is True
    assert result.id == 1
    assert uow_mock.session.add.call_count == 2  # once for Product, once for Inventory
    assert uow_mock.flush.await_count == 2
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_product_category_not_found(uow_mock: AsyncMock) -> None:
    """Raises 400 when category_id does not exist."""
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    data = ProductCreate(
        name="Orphan Product",
        description="Has no valid category",
        price=Decimal("5.00"),
        category_id=999,
    )

    with pytest.raises(HTTPException) as exc:
        await create_product(uow_mock, data)

    assert exc.value.status_code == 400
    assert "999" in exc.value.detail
    uow_mock.session.add.assert_not_called()
    uow_mock.flush.assert_not_called()


# ---------------------------------------------------------------------------
# update_product
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_product_success(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Updates all provided fields on the product."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_product(*args, **kwargs):
        product = args[0]
        product.updated_at = datetime(2024, 6, 15, tzinfo=timezone.utc)

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    data = ProductUpdate(
        name="Updated Name",
        description="Updated description",
        price=Decimal("24.99"),
    )

    result = await update_product(uow_mock, 1, data)

    assert result.name == "Updated Name"
    assert result.description == "Updated description"
    assert result.price == Decimal("24.99")
    assert sample_product.name == "Updated Name"
    assert sample_product.description == "Updated description"
    assert sample_product.price == Decimal("24.99")
    uow_mock.session.add.assert_called_once_with(sample_product)
    assert uow_mock.flush.await_count == 1
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_product_partial(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Only updates provided fields, leaves others unchanged."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_product(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    data = ProductUpdate(description="Just the description")

    result = await update_product(uow_mock, 1, data)

    assert result.description == "Just the description"
    assert result.name == "Test Product"
    assert result.price == Decimal("19.99")
    uow_mock.session.add.assert_called_once_with(sample_product)


@pytest.mark.asyncio
async def test_update_product_with_category_change(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Updates category when valid category_id is provided."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    mock_category_check = _mock_scalar_one_or_none(MagicMock(id=2))
    uow_mock.session.execute.side_effect = [mock_get, mock_category_check]

    async def _refresh_product(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    data = ProductUpdate(category_id=2)

    result = await update_product(uow_mock, 1, data)

    assert result.category_id == 2
    assert sample_product.category_id == 2
    assert uow_mock.session.execute.await_count == 2


@pytest.mark.asyncio
async def test_update_product_toggle_availability(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Sets is_available when provided."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_product(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    data = ProductUpdate(is_available=False)

    result = await update_product(uow_mock, 1, data)

    assert result.is_available is False
    assert sample_product.is_available is False


@pytest.mark.asyncio
async def test_update_product_not_found(uow_mock: AsyncMock) -> None:
    """Raises 404 when product does not exist."""
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    data = ProductUpdate(name="Ghost")

    with pytest.raises(HTTPException) as exc:
        await update_product(uow_mock, 999, data)

    assert exc.value.status_code == 404
    uow_mock.session.add.assert_not_called()


@pytest.mark.asyncio
async def test_update_product_category_not_found(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Raises 400 when changing to a non-existent category."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    mock_category_check = _mock_scalar_one_or_none(None)
    uow_mock.session.execute.side_effect = [mock_get, mock_category_check]

    data = ProductUpdate(category_id=999)

    with pytest.raises(HTTPException) as exc:
        await update_product(uow_mock, 1, data)

    assert exc.value.status_code == 400
    assert "999" in exc.value.detail
    uow_mock.session.add.assert_not_called()


# ---------------------------------------------------------------------------
# delete_product
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_product_success(uow_mock: AsyncMock) -> None:
    """Soft-deletes the product and calls flush."""
    product_mock = MagicMock()
    product_mock.soft_delete = MagicMock()
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(product_mock)

    result = await delete_product(uow_mock, 1)

    assert result is None
    product_mock.soft_delete.assert_called_once()
    uow_mock.session.add.assert_called_once_with(product_mock)
    uow_mock.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_product_not_found(uow_mock: AsyncMock) -> None:
    """Raises 404 when product does not exist."""
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    with pytest.raises(HTTPException) as exc:
        await delete_product(uow_mock, 999)

    assert exc.value.status_code == 404
    uow_mock.session.add.assert_not_called()


# ---------------------------------------------------------------------------
# toggle_availability
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_toggle_availability_true_to_false(uow_mock: AsyncMock, sample_product: Product) -> None:
    """Toggles is_available from True to False."""
    assert sample_product.is_available is True
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(sample_product)

    async def _refresh_product(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    result = await toggle_availability(uow_mock, 1)

    assert result.is_available is False
    assert sample_product.is_available is False
    uow_mock.session.add.assert_called_once_with(sample_product)
    assert uow_mock.flush.await_count == 1
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_toggle_availability_false_to_true(uow_mock: AsyncMock) -> None:
    """Toggles is_available from False to True."""
    product = Product(
        id=2,
        name="Unavailable Product",
        price=Decimal("5.00"),
        category_id=1,
        is_available=False,
    )
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(product)

    async def _refresh_product(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_product)

    result = await toggle_availability(uow_mock, 2)

    assert result.is_available is True
    assert product.is_available is True


# ---------------------------------------------------------------------------
# get_related_products
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_related_products_returns_matches(
    uow_mock: AsyncMock,
    sample_product: Product,
    second_product: Product,
) -> None:
    """Returns products from the same category excluding the source product."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    mock_related = _mock_scalars_all([second_product])
    uow_mock.session.execute.side_effect = [mock_get, mock_related]

    result = await get_related_products(uow_mock, 1)

    assert len(result) == 1
    assert result[0].id == 2
    assert uow_mock.session.execute.await_count == 2


@pytest.mark.asyncio
async def test_get_related_products_respects_limit(
    uow_mock: AsyncMock,
    sample_product: Product,
    second_product: Product,
) -> None:
    """Respects the limit parameter."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    mock_related = _mock_scalars_all([second_product])
    uow_mock.session.execute.side_effect = [mock_get, mock_related]

    result = await get_related_products(uow_mock, 1, limit=1)

    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_related_products_empty(
    uow_mock: AsyncMock,
    sample_product: Product,
) -> None:
    """Returns empty list when no related products exist."""
    mock_get = _mock_scalar_one_or_none(sample_product)
    mock_related = _mock_scalars_all([])
    uow_mock.session.execute.side_effect = [mock_get, mock_related]

    result = await get_related_products(uow_mock, 1)

    assert result == []


@pytest.mark.asyncio
async def test_get_related_products_source_not_found(uow_mock: AsyncMock) -> None:
    """Raises 404 from get_product when source product does not exist."""
    uow_mock.session.execute.return_value = _mock_scalar_one_or_none(None)

    with pytest.raises(HTTPException) as exc:
        await get_related_products(uow_mock, 999)

    assert exc.value.status_code == 404
