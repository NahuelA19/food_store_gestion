"""Tests for the search endpoint."""

import pytest
from decimal import Decimal
from httpx import AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Create an async HTTP client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_search_endpoint_exists(client: AsyncClient):
    """Test that search endpoint exists."""
    response = await client.get("/api/v1/products/search")
    assert response.status_code in [200, 422, 400]  # Endpoint should exist


@pytest.mark.asyncio
async def test_search_with_empty_results(client: AsyncClient, db_session):
    """Test search returning empty results."""
    response = await client.get("/api/v1/products/search?q=nonexistent123xyz")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["pagination"]["total"] == 0


@pytest.mark.asyncio
async def test_search_parameters_validation(client: AsyncClient):
    """Test parameter validation."""
    # Test invalid limit
    response = await client.get("/api/v1/products/search?limit=101")
    assert response.status_code == 400

    # Test invalid page
    response = await client.get("/api/v1/products/search?page=0")
    assert response.status_code == 400

    # Test invalid sort_by
    response = await client.get("/api/v1/products/search?sort_by=invalid")
    assert response.status_code == 400

    # Test invalid order
    response = await client.get("/api/v1/products/search?order=invalid")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_search_price_range_validation(client: AsyncClient):
    """Test price range validation."""
    # Test min > max (invalid)
    response = await client.get("/api/v1/products/search?min_price=100&max_price=10")
    assert response.status_code == 400
    assert "min_price must be <= max_price" in response.json()["detail"]


@pytest.mark.asyncio
async def test_search_pagination(client: AsyncClient):
    """Test pagination parameters."""
    response = await client.get("/api/v1/products/search?page=1&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert "pagination" in data
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 20


@pytest.mark.asyncio
async def test_search_response_schema(client: AsyncClient):
    """Test response schema structure."""
    response = await client.get("/api/v1/products/search")
    assert response.status_code == 200
    data = response.json()

    # Check top-level structure
    assert "items" in data
    assert "pagination" in data

    # Check pagination structure
    pagination = data["pagination"]
    assert "total" in pagination
    assert "page" in pagination
    assert "limit" in pagination
    assert "total_pages" in pagination
    assert "has_next" in pagination
    assert "has_previous" in pagination

    # Check pagination math
    assert pagination["total_pages"] == max(0, (pagination["total"] + pagination["limit"] - 1) // pagination["limit"])
