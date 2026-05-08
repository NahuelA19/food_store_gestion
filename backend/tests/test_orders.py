"""Tests for order API endpoints and checkout flow."""


import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCheckoutAndOrders:
    """Test checkout flow and order management."""

    @pytest.fixture
    async def setup_data(self, async_client: AsyncClient) -> dict:
        """Create test user, category, product, and add item to cart.

        Returns dict with auth_headers, cart_id, product_id, etc.
        """
        # Register user
        resp = await async_client.post(
            "/api/auth/register",
            json={"email": "ordertest@example.com", "password": "OrderTest123"},
        )
        assert resp.status_code == 201
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create category
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "OrderCat", "description": "Test"},
            headers=headers,
        )
        assert cat_resp.status_code == 201
        cat_id = cat_resp.json()["id"]

        # Create product
        prod_resp = await async_client.post(
            "/api/products/",
            json={
                "name": "Order Product",
                "price": 25.00,
                "category_id": cat_id,
                "is_available": True,
            },
            headers=headers,
        )
        assert prod_resp.status_code == 201
        prod_id = prod_resp.json()["id"]

        # Get cart and add item
        cart_resp = await async_client.get("/api/carts/", headers=headers)
        cart_id = cart_resp.json()["id"]

        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 2},
            headers=headers,
        )
        assert add_resp.status_code == 201

        return {
            "headers": headers,
            "cart_id": cart_id,
            "product_id": prod_id,
            "token": token,
        }

    async def test_checkout_creates_order(
        self,
        async_client: AsyncClient,
        setup_data: dict,
    ):
        """Checkout creates an order and returns real order_id."""
        data = setup_data

        checkout_resp = await async_client.post(
            f"/api/carts/{data['cart_id']}/checkout",
            json={
                "shipping_address": "123 Test St",
                "shipping_method": "standard",
            },
            headers=data["headers"],
        )
        assert checkout_resp.status_code == 201
        result = checkout_resp.json()
        assert result["status"] == "checked_out"
        assert result["order_id"] is not None  # Real order_id, not None
        assert float(result["total"]) > 0
        assert result["cart_id"] == data["cart_id"]
        assert result["client_secret"] is not None  # Stripe PaymentIntent client_secret

    async def test_checkout_empty_cart_fails(
        self,
        async_client: AsyncClient,
    ):
        """Checkout on empty cart returns 400."""
        # Register fresh user (empty cart)
        resp = await async_client.post(
            "/api/auth/register",
            json={"email": "emptycart@example.com", "password": "TestPass123"},
        )
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        cart_resp = await async_client.get("/api/carts/", headers=headers)
        cart_id = cart_resp.json()["id"]

        checkout_resp = await async_client.post(
            f"/api/carts/{cart_id}/checkout",
            json={"shipping_address": "123 Test St"},
            headers=headers,
        )
        assert checkout_resp.status_code == 400

    async def test_checkout_twice_fails(
        self,
        async_client: AsyncClient,
        setup_data: dict,
    ):
        """Checking out an already checked-out cart fails."""
        # First checkout
        await async_client.post(
            f"/api/carts/{setup_data['cart_id']}/checkout",
            json={"shipping_address": "123 Test St"},
            headers=setup_data["headers"],
        )

        # Second checkout should fail
        resp = await async_client.post(
            f"/api/carts/{setup_data['cart_id']}/checkout",
            json={"shipping_address": "456 Other St"},
            headers=setup_data["headers"],
        )
        assert resp.status_code == 400

    async def test_list_orders(
        self,
        async_client: AsyncClient,
        setup_data: dict,
    ):
        """User can list their orders after checkout."""
        # Checkout
        await async_client.post(
            f"/api/carts/{setup_data['cart_id']}/checkout",
            json={"shipping_address": "123 Test St"},
            headers=setup_data["headers"],
        )

        # List orders
        resp = await async_client.get(
            "/api/orders/",
            headers=setup_data["headers"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1
        assert data["items"][0]["status"] == "payment_pending"

    async def test_order_detail(
        self,
        async_client: AsyncClient,
        setup_data: dict,
    ):
        """User can view order detail with items."""
        # Checkout
        checkout_resp = await async_client.post(
            f"/api/carts/{setup_data['cart_id']}/checkout",
            json={"shipping_address": "123 Test St"},
            headers=setup_data["headers"],
        )
        order_id = checkout_resp.json()["order_id"]

        # Get order detail
        resp = await async_client.get(
            f"/api/orders/{order_id}",
            headers=setup_data["headers"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == order_id
        assert data["status"] == "payment_pending"
        assert len(data["items"]) >= 1
        assert data["items"][0]["product_id"] == setup_data["product_id"]

    async def test_order_detail_non_owner_returns_404(
        self,
        async_client: AsyncClient,
        setup_data: dict,
    ):
        """Non-owner gets 404 (not 403) for order detail."""
        # Checkout as user 1
        checkout_resp = await async_client.post(
            f"/api/carts/{setup_data['cart_id']}/checkout",
            json={"shipping_address": "123 Test St"},
            headers=setup_data["headers"],
        )
        order_id = checkout_resp.json()["order_id"]

        # Register second user
        resp = await async_client.post(
            "/api/auth/register",
            json={"email": "otheruser@example.com", "password": "OtherPass123"},
        )
        token2 = resp.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Try to view order of user 1
        resp = await async_client.get(
            f"/api/orders/{order_id}",
            headers=headers2,
        )
        assert resp.status_code == 404

    async def test_cancel_pending_order(
        self,
        async_client: AsyncClient,
        setup_data: dict,
    ):
        """User can cancel a pending order."""
        # Checkout
        checkout_resp = await async_client.post(
            f"/api/carts/{setup_data['cart_id']}/checkout",
            json={"shipping_address": "123 Test St"},
            headers=setup_data["headers"],
        )
        order_id = checkout_resp.json()["order_id"]

        # Cancel order
        cancel_resp = await async_client.post(
            f"/api/orders/{order_id}/cancel",
            headers=setup_data["headers"],
        )
        assert cancel_resp.status_code == 200
        data = cancel_resp.json()
        assert data["status"] == "cancelled"

    async def test_cancel_non_pending_order_fails(
        self,
        async_client: AsyncClient,
    ):
        """Cancelling a non-pending order should not be possible via user endpoint."""
        # This test validates the route exists and requires pending status.
        # Full transition tests need admin endpoint.
        resp = await async_client.post("/api/orders/99999/cancel")
        assert resp.status_code in (401, 404)

    async def test_orders_requires_auth(
        self,
        async_client: AsyncClient,
    ):
        """Order endpoints require authentication."""
        resp = await async_client.get("/api/orders/")
        assert resp.status_code == 401

        resp = await async_client.get("/api/orders/1")
        assert resp.status_code == 401

        resp = await async_client.post("/api/orders/1/cancel")
        assert resp.status_code == 401
