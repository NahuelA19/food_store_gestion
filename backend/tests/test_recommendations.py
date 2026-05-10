"""Tests for recommendation engine endpoints and service."""

import time
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.services.recommendation_service import (
    TTLCache,
    RecommendationService,
    get_recommendation_service,
)


# ── TTLCache Unit Tests ─────────────────────────────────────────────


class TestTTLCache:
    """Test TTL cache behavior."""

    def test_get_set(self):
        cache = TTLCache(ttl_seconds=300)
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_missing(self):
        cache = TTLCache(ttl_seconds=300)
        assert cache.get("nonexistent") is None

    def test_expiry(self):
        cache = TTLCache(ttl_seconds=1)
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_invalidate(self):
        cache = TTLCache(ttl_seconds=300)
        cache.set("key1", "value1")
        cache.invalidate("key1")
        assert cache.get("key1") is None

    def test_invalidate_pattern(self):
        cache = TTLCache(ttl_seconds=300)
        cache.set("trending:8", [1, 2, 3])
        cache.set("personalized:1:8", [4, 5, 6])
        cache.set("other", "data")
        cache.invalidate_pattern("trending:")
        assert cache.get("trending:8") is None
        assert cache.get("personalized:1:8") is not None
        assert cache.get("other") == "data"

    def test_clear(self):
        cache = TTLCache(ttl_seconds=300)
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_overwrite(self):
        cache = TTLCache(ttl_seconds=300)
        cache.set("key1", "value1")
        cache.set("key1", "value2")
        assert cache.get("key1") == "value2"

    def test_different_keys_dont_interfere(self):
        cache = TTLCache(ttl_seconds=300)
        cache.set("a", 1)
        cache.set("b", 2)
        assert cache.get("a") == 1
        assert cache.get("b") == 2


# ── RecommendationService Unit Tests (mocked DB) ────────────────────


class TestRecommendationService:
    """Test service strategies with mocked database."""

    @pytest.fixture
    def service(self):
        return RecommendationService()

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.mark.asyncio
    async def test_trending_empty_returns_empty(self, service, mock_db):
        """Trending with no data returns empty list."""
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result
        result = await service.get_trending(mock_db, limit=4)
        assert result == []

    @pytest.mark.asyncio
    async def test_trending_with_data(self, service, mock_db):
        """Trending returns products with ratings and counts."""
        product = MagicMock()
        product.id = 1
        product.name = "Test Product"
        product.category_id = 1
        product.is_available = True

        class FakeRow:
            Product = product
            avg_rating = 4.5
            purchase_count = 10

        mock_result = MagicMock()
        mock_result.all.return_value = [FakeRow()]
        mock_db.execute.return_value = mock_result

        result = await service.get_trending(mock_db, limit=8)
        assert len(result) == 1
        assert result[0][0].name == "Test Product"
        assert result[0][1] == 4.5
        assert result[0][2] == 10

    @pytest.mark.asyncio
    async def test_fbt_no_orders_falls_back_to_category(self, service, mock_db):
        """FBT falls back to same-category when no co-purchases exist."""
        # No co-purchased products
        mock_result_ids = MagicMock()
        mock_result_ids.scalars.return_value.all.return_value = []

        mock_result_category = MagicMock()
        mock_result_category.scalar_one_or_none.return_value = 1

        fallback_product = MagicMock()
        fallback_product.id = 2
        fallback_product.name = "Fallback Product"
        mock_result_fallback = MagicMock()
        mock_result_fallback.scalars.return_value.all.return_value = [fallback_product]

        mock_db.execute.side_effect = [
            mock_result_ids,
            mock_result_category,
            mock_result_fallback,
        ]

        result = await service.get_frequently_bought_together(mock_db, 1, limit=4)
        assert len(result) == 1
        assert result[0].id == 2

    @pytest.mark.asyncio
    async def test_personalized_no_history_falls_back_to_trending(self, service, mock_db):
        """Personalized falls back to trending when user has no history."""
        mock_count = MagicMock()
        mock_count.scalar.return_value = 0

        mock_trending = MagicMock()
        mock_trending.all.return_value = []

        mock_db.execute.side_effect = [mock_count, mock_trending]

        result = await service.get_personalized(mock_db, user_id=1, limit=8)
        assert result == []

    @pytest.mark.asyncio
    async def test_cache_hit(self, service, mock_db):
        """Cache returns cached data on subsequent calls."""
        product = MagicMock()
        product.id = 1
        product.name = "Cached Product"

        class FakeRow:
            Product = product
            avg_rating = 4.0
            purchase_count = 5

        mock_result = MagicMock()
        mock_result.all.return_value = [FakeRow()]
        mock_db.execute.return_value = mock_result

        await service.get_trending(mock_db, limit=8)

        mock_db.execute.reset_mock()
        result = await service.get_trending(mock_db, limit=8)
        assert len(result) == 1
        mock_db.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalidate_all(self, service, mock_db):
        """Invalidate all clears cache."""
        product = MagicMock()
        product.id = 1

        class FakeRow:
            Product = product
            avg_rating = 4.0
            purchase_count = 5

        mock_result = MagicMock()
        mock_result.all.return_value = [FakeRow()]
        mock_db.execute.return_value = mock_result

        await service.get_trending(mock_db, limit=8)
        service.invalidate_all()

        result = await service.get_trending(mock_db, limit=8)
        assert mock_db.execute.called


# ── Dependency Factory Tests ────────────────────────────────────────


def test_get_recommendation_service_is_singleton():
    """Dependency factory returns the same instance."""
    svc1 = get_recommendation_service()
    svc2 = get_recommendation_service()
    assert svc1 is svc2


# ── Helper to register a user via test_client ───────────────────────


def _register_user(test_client: TestClient, email: str, password: str) -> dict:
    """Register a user and return auth headers."""
    resp = test_client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 201, f"Register failed: {resp.json()}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_category(test_client: TestClient, name: str, headers: dict | None = None) -> int:
    """Create a category and return its ID."""
    resp = test_client.post(
        "/api/categories/",
        json={"name": name, "description": "Test category"},
        headers=headers or {},
    )
    assert resp.status_code == 200, f"Category create failed: {resp.json()}"
    return resp.json()["id"]


def _create_product(
    test_client: TestClient,
    name: str,
    price: float,
    category_id: int,
    is_available: bool = True,
    headers: dict | None = None,
) -> int:
    """Create a product and return its ID."""
    resp = test_client.post(
        "/api/products/",
        json={"name": name, "price": price, "category_id": category_id, "is_available": is_available},
        headers=headers or {},
    )
    assert resp.status_code == 201, f"Product create failed: {resp.json()}"
    return resp.json()["id"]


# ── Endpoint Integration Tests ──────────────────────────────────────


class TestRecommendationEndpoints:
    """Test recommendation endpoints via HTTP test client."""

    def test_trending_returns_products(self, test_client: TestClient):
        """Trending endpoint returns products successfully."""
        cat_id = _create_category(test_client, "TrendingCat")

        _create_product(test_client, "Trend A", 10.00, cat_id)
        _create_product(test_client, "Trend B", 20.00, cat_id)

        response = test_client.get("/api/products/trending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "name" in item
            assert "avg_rating" in item
            assert "purchase_count" in item

    def test_trending_respects_limit(self, test_client: TestClient):
        """Trending endpoint respects the limit parameter."""
        cat_id = _create_category(test_client, "TrendLimitCat")

        for i in range(5):
            _create_product(test_client, f"TrendLimit {i}", 10.00 + i, cat_id)

        response = test_client.get("/api/products/trending?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2

    def test_trending_validates_limit_upper_bound(self, test_client: TestClient):
        """Trending rejects limit > 20."""
        response = test_client.get("/api/products/trending?limit=50")
        assert response.status_code == 422

    def test_recommendations_without_auth_returns_trending(self, test_client: TestClient):
        """Recommendations without auth returns trending."""
        cat_id = _create_category(test_client, "RecNoAuthCat")
        _create_product(test_client, "RecNoAuth", 10.00, cat_id)

        response = test_client.get("/api/products/recommendations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "avg_rating" in data[0]
            assert "purchase_count" in data[0]

    def test_recommendations_with_auth_no_history(self, test_client: TestClient):
        """Recommendations with auth but no order history returns trending."""
        auth = _register_user(test_client, "recauth@example.com", "RecAuth123")
        cat_id = _create_category(test_client, "RecAuthCat")
        _create_product(test_client, "RecAuthProd", 15.00, cat_id)

        response = test_client.get("/api/products/recommendations", headers=auth)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_recommendations_returns_correct_shape(self, test_client: TestClient):
        """Recommendations response has the TrendingProductResponse shape."""
        cat_id = _create_category(test_client, "ShapeCat")
        _create_product(test_client, "Shape Prod", 10.00, cat_id)

        response = test_client.get("/api/products/recommendations")
        assert response.status_code == 200
        for item in response.json():
            assert "id" in item
            assert "name" in item
            assert "price" in item
            assert "category_id" in item
            assert "category" in item
            assert "is_available" in item

    def test_recommendations_respects_limit(self, test_client: TestClient):
        """Recommendations respects limit parameter."""
        cat_id = _create_category(test_client, "LimitCat")
        for i in range(5):
            _create_product(test_client, f"LimitProd {i}", 10.00 + i, cat_id)

        response = test_client.get("/api/products/recommendations?limit=2")
        assert response.status_code == 200
        assert len(response.json()) <= 2

    def test_fbt_returns_related_products(self, test_client: TestClient):
        """FBT returns same-category products when no co-purchases exist."""
        cat_id = _create_category(test_client, "FBTCat")
        p1_id = _create_product(test_client, "FBT Base", 10.00, cat_id)
        _create_product(test_client, "FBT Related", 15.00, cat_id)

        response = test_client.get(f"/api/products/{p1_id}/frequently-bought-together")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for item in data:
            assert item["id"] != p1_id
            assert item["category_id"] == cat_id

    def test_fbt_returns_empty_when_alone_in_category(self, test_client: TestClient):
        """FBT returns empty list when no other products in same category."""
        cat_id = _create_category(test_client, "LonelyCat")
        p1_id = _create_product(test_client, "Only Product", 5.00, cat_id)

        response = test_client.get(f"/api/products/{p1_id}/frequently-bought-together")
        assert response.status_code == 200
        assert response.json() == []

    def test_fbt_nonexistent_product_returns_404(self, test_client: TestClient):
        """FBT returns 404 for non-existent product."""
        response = test_client.get("/api/products/99999/frequently-bought-together")
        assert response.status_code == 404

    def test_fbt_with_orders_shows_co_purchased(self, test_client: TestClient):
        """FBT returns products from same orders when data exists."""
        auth = _register_user(test_client, "fbtuser@example.com", "FbtTest123")
        cat_id = _create_category(test_client, "CoPurchaseCat", auth)

        p1_id = _create_product(test_client, "Base Product", 10.00, cat_id, headers=auth)
        p2_id = _create_product(test_client, "Co-Purchased A", 15.00, cat_id, headers=auth)
        p3_id = _create_product(test_client, "Co-Purchased B", 20.00, cat_id, headers=auth)

        # Add products to cart and checkout
        cart_resp = test_client.get("/api/carts/", headers=auth)
        cart_id = cart_resp.json()["id"]

        test_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": p1_id, "quantity": 1},
            headers=auth,
        )
        test_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": p2_id, "quantity": 1},
            headers=auth,
        )
        test_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": p3_id, "quantity": 2},
            headers=auth,
        )

        checkout_resp = test_client.post(
            "/api/orders/checkout",
            json={"notes": "Test order"},
            headers=auth,
        )
        assert checkout_resp.status_code == 201

        fbt_resp = test_client.get(f"/api/products/{p1_id}/frequently-bought-together")
        assert fbt_resp.status_code == 200
        data = fbt_resp.json()
        fbt_ids = {item["id"] for item in data}
        assert p2_id in fbt_ids, f"Expected {p2_id} in FBT results, got {fbt_ids}"
        assert p3_id in fbt_ids, f"Expected {p3_id} in FBT results, got {fbt_ids}"
        assert p1_id not in fbt_ids

    def test_trending_does_not_include_unavailable(self, test_client: TestClient):
        """Trending only returns available products."""
        cat_id = _create_category(test_client, "AvailCat")
        _create_product(test_client, "Available", 10.00, cat_id, is_available=True)
        _create_product(test_client, "Unavailable", 5.00, cat_id, is_available=False)

        response = test_client.get("/api/products/trending")
        assert response.status_code == 200
        for item in response.json():
            assert item["is_available"] is True

    def test_fbt_excludes_target_product(self, test_client: TestClient):
        """FBT never includes the target product itself."""
        cat_id = _create_category(test_client, "ExcludeSelfCat")
        p1_id = _create_product(test_client, "Self", 10.00, cat_id)
        _create_product(test_client, "Other", 15.00, cat_id)

        response = test_client.get(f"/api/products/{p1_id}/frequently-bought-together")
        fbt_ids = {item["id"] for item in response.json()}
        assert p1_id not in fbt_ids

    def test_trending_response_has_extra_fields(self, test_client: TestClient):
        """Trending response includes avg_rating and purchase_count."""
        cat_id = _create_category(test_client, "ExtraFieldsCat")
        _create_product(test_client, "Extra", 10.00, cat_id)

        response = test_client.get("/api/products/trending")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            assert "avg_rating" in data[0]
            assert "purchase_count" in data[0]
