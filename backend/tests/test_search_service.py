"""Tests for search service functions."""

import pytest
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.services.search_service import (
    validate_search_params,
    build_search_filters,
    build_sort_order,
    calculate_pagination_info,
    search_products,
)


@pytest.mark.asyncio
async def test_validate_search_params_valid(db_session: AsyncSession):
    """Test validation passes for valid parameters."""
    errors = await validate_search_params(
        db=db_session,
        min_price=Decimal("5.00"),
        max_price=Decimal("20.00"),
    )
    assert errors == {}


@pytest.mark.asyncio
async def test_validate_search_params_price_range(db_session: AsyncSession):
    """Test price range validation."""
    errors = await validate_search_params(
        db=db_session,
        min_price=Decimal("20.00"),
        max_price=Decimal("5.00"),
    )
    assert "price_range" in errors
    assert "min_price must be <= max_price" in errors["price_range"]


@pytest.mark.asyncio
async def test_validate_search_params_invalid_category(db_session: AsyncSession):
    """Test invalid category ID."""
    errors = await validate_search_params(
        db=db_session,
        category_id=9999,
    )
    assert "category_id" in errors


def test_build_search_filters_empty():
    """Test building filters with no parameters."""
    filters = build_search_filters()
    assert filters == []


def test_build_search_filters_fts():
    """Test FTS filter building."""
    filters = build_search_filters(q="pasta")
    assert len(filters) == 1


def test_build_search_filters_category():
    """Test category filter building."""
    filters = build_search_filters(category_id=1)
    assert len(filters) == 1


def test_build_search_filters_price_range():
    """Test price range filter building."""
    filters = build_search_filters(
        min_price=Decimal("5.00"),
        max_price=Decimal("20.00"),
    )
    assert len(filters) == 2


def test_build_search_filters_availability():
    """Test availability filter building."""
    filters = build_search_filters(in_stock=True)
    assert len(filters) == 1


def test_build_search_filters_stock():
    """Test stock quantity filter building."""
    filters = build_search_filters(min_stock=5)
    assert len(filters) == 1


def test_build_search_filters_combined():
    """Test building multiple filters."""
    filters = build_search_filters(
        q="organic",
        category_id=2,
        min_price=Decimal("5.00"),
        max_price=Decimal("20.00"),
        in_stock=True,
        min_stock=10,
    )
    assert len(filters) == 6


def test_build_sort_order_name():
    """Test name sorting."""
    order = build_sort_order(sort_by="name", order="asc")
    assert order is not None

    order_desc = build_sort_order(sort_by="name", order="desc")
    assert order_desc is not None


def test_build_sort_order_price():
    """Test price sorting."""
    order = build_sort_order(sort_by="price", order="asc")
    assert order is not None


def test_build_sort_order_created_at():
    """Test created_at sorting."""
    order = build_sort_order(sort_by="created_at", order="asc")
    assert order is not None


def test_build_sort_order_relevance_with_query():
    """Test relevance sorting with query."""
    order = build_sort_order(sort_by="relevance", order="asc", q="pasta")
    assert order is not None


def test_build_sort_order_relevance_without_query():
    """Test relevance sorting defaults to created_at when no query."""
    order = build_sort_order(sort_by="relevance", order="asc", q=None)
    assert order is not None


def test_calculate_pagination_info():
    """Test pagination info calculation."""
    pagination = calculate_pagination_info(total=100, page=1, limit=20)
    assert pagination.total == 100
    assert pagination.page == 1
    assert pagination.limit == 20
    assert pagination.total_pages == 5
    assert pagination.has_next is True
    assert pagination.has_previous is False


def test_calculate_pagination_info_last_page():
    """Test pagination info on last page."""
    pagination = calculate_pagination_info(total=100, page=5, limit=20)
    assert pagination.has_next is False
    assert pagination.has_previous is True


def test_calculate_pagination_info_empty_results():
    """Test pagination with zero results."""
    pagination = calculate_pagination_info(total=0, page=1, limit=20)
    assert pagination.total_pages == 0
    assert pagination.has_next is False
    assert pagination.has_previous is False


@pytest.mark.asyncio
async def test_search_products_empty(db_session: AsyncSession):
    """Test search with no matches."""
    products, pagination = await search_products(
        db=db_session,
        q="nonexistent123xyz",
    )
    assert products == []
    assert pagination.total == 0


@pytest.mark.asyncio
async def test_search_products_pagination(db_session: AsyncSession):
    """Test search pagination."""
    products, pagination = await search_products(
        db=db_session,
        page=1,
        limit=20,
    )
    assert isinstance(products, list)
    assert pagination.page == 1
    assert pagination.limit == 20
