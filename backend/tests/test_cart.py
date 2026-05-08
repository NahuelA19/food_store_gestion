"""Tests for cart API endpoints."""


import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCartEndpoints:
    """Test cart CRUD operations."""

    @pytest.fixture
    async def auth_headers(self, async_client: AsyncClient) -> dict[str, str]:
        """Get auth headers by registering a test user."""
        response = await async_client.post(
            "/api/auth/register",
            json={
                "email": "cartuser@example.com",
                "password": "CartTest123",
            },
        )
        assert response.status_code == 201
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    async def test_get_cart_creates_on_demand(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Getting cart for first time creates one."""
        response = await async_client.get("/api/carts/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert data["items"] == []
        assert data["item_count"] == 0
        assert data["subtotal"] == 0
        assert "id" in data

    async def test_add_item_to_cart(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Test adding a product to cart."""
        # Create category and product
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "CartTestCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Test Product", "price": 15.99, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        # Get cart
        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        # Add item
        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 2},
            headers=auth_headers,
        )
        assert add_resp.status_code == 201
        data = add_resp.json()
        assert len(data["items"]) == 1
        assert data["item_count"] == 2
        assert data["items"][0]["product_id"] == prod_id
        assert data["items"][0]["quantity"] == 2
        assert float(data["items"][0]["unit_price"]) == 15.99

    async def test_add_item_idempotent(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Adding same product again updates quantity (no duplicate)."""
        # Setup: create product + cart + add item
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "IdemCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Idem Product", "price": 10.00, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        # Add once
        await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 2},
            headers=auth_headers,
        )

        # Add same product again (should update qty to 4)
        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 3},
            headers=auth_headers,
        )
        assert add_resp.status_code == 201
        data = add_resp.json()
        assert len(data["items"]) == 1  # Still 1 item, not duplicate
        assert data["items"][0]["quantity"] == 5  # 2 + 3
        assert data["item_count"] == 5

    async def test_update_item_quantity(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Test updating cart item quantity."""
        # Setup
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "UpdateCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Update Product", "price": 8.50, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 3},
            headers=auth_headers,
        )
        item_id = add_resp.json()["items"][0]["id"]

        # Update quantity
        update_resp = await async_client.patch(
            f"/api/carts/{cart_id}/items/{item_id}",
            json={"quantity": 7},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["items"][0]["quantity"] == 7
        assert data["item_count"] == 7

    async def test_update_item_to_zero_removes(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Setting quantity to 0 removes the item."""
        # Setup
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "RemoveCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Remove Product", "price": 5.00, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 1},
            headers=auth_headers,
        )
        item_id = add_resp.json()["items"][0]["id"]

        # Set to 0 = remove
        update_resp = await async_client.patch(
            f"/api/carts/{cart_id}/items/{item_id}",
            json={"quantity": 0},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert len(data["items"]) == 0

    async def test_remove_item(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Test removing an item from cart."""
        # Setup
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "DelCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Del Product", "price": 12.00, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 4},
            headers=auth_headers,
        )
        item_id = add_resp.json()["items"][0]["id"]
        assert len(add_resp.json()["items"]) == 1

        # Remove item
        del_resp = await async_client.delete(
            f"/api/carts/{cart_id}/items/{item_id}",
            headers=auth_headers,
        )
        assert del_resp.status_code == 200
        data = del_resp.json()
        assert len(data["items"]) == 0

    async def test_clear_cart(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Test clearing all items from cart."""
        # Setup
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "ClearCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Clear Product", "price": 3.00, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        # Add 2 items
        await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 2},
            headers=auth_headers,
        )

        # Add another product
        prod2_resp = await async_client.post(
            "/api/products/",
            json={"name": "Clear Product 2", "price": 7.50, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod2_id = prod2_resp.json()["id"]

        await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod2_id, "quantity": 1},
            headers=auth_headers,
        )

        # Clear cart
        clear_resp = await async_client.delete(
            f"/api/carts/{cart_id}/items",
            headers=auth_headers,
        )
        assert clear_resp.status_code == 200
        data = clear_resp.json()
        assert len(data["items"]) == 0
        assert data["item_count"] == 0
        assert float(data["total"]) == 0

    async def test_cart_totals(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Test cart subtotal, tax, and total calculations."""
        # Setup
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "TotalCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Total Prod", "price": 20.00, "category_id": cat_id, "is_available": True},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        # Add 3 items at $20 each = $60 subtotal
        add_resp = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 3},
            headers=auth_headers,
        )
        data = add_resp.json()
        assert float(data["subtotal"]) == 60.00
        assert float(data["tax"]) == 6.00  # 10%
        assert float(data["total"]) == 66.00

    async def test_cart_requires_auth(
        self,
        async_client: AsyncClient,
    ):
        """Cart endpoints require authentication."""
        response = await async_client.get("/api/carts/")
        assert response.status_code == 401

        response = await async_client.post(
            "/api/carts/999/items",
            json={"product_id": 1, "quantity": 1},
        )
        assert response.status_code == 401

    async def test_add_nonexistent_product(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Adding a non-existent product returns 404."""
        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        response = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": 99999, "quantity": 1},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_add_inactive_product(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ):
        """Adding an inactive product returns 400."""
        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "InactiveCat", "description": "Test"},
            headers=auth_headers,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Inactive Prod", "price": 5.00, "category_id": cat_id, "is_available": False},
            headers=auth_headers,
        )
        prod_id = prod_resp.json()["id"]

        cart_resp = await async_client.get("/api/carts/", headers=auth_headers)
        cart_id = cart_resp.json()["id"]

        response = await async_client.post(
            f"/api/carts/{cart_id}/items",
            json={"product_id": prod_id, "quantity": 1},
            headers=auth_headers,
        )
        assert response.status_code == 400

    async def test_user_cart_isolation(
        self,
        async_client: AsyncClient,
    ):
        """Two different users have separate carts."""
        # User 1 registers and adds item
        resp1 = await async_client.post(
            "/api/auth/register",
            json={"email": "user1@example.com", "password": "TestPass1"},
        )
        token1 = resp1.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {token1}"}

        cat_resp = await async_client.post(
            "/api/categories/",
            json={"name": "IsolCat", "description": "Test"},
            headers=headers1,
        )
        cat_id = cat_resp.json()["id"]

        prod_resp = await async_client.post(
            "/api/products/",
            json={"name": "Shared Prod", "price": 10.00, "category_id": cat_id, "is_available": True},
            headers=headers1,
        )
        prod_id = prod_resp.json()["id"]

        cart1 = await async_client.get("/api/carts/", headers=headers1)
        cart1_id = cart1.json()["id"]

        await async_client.post(
            f"/api/carts/{cart1_id}/items",
            json={"product_id": prod_id, "quantity": 3},
            headers=headers1,
        )

        # User 2 registers
        resp2 = await async_client.post(
            "/api/auth/register",
            json={"email": "user2@example.com", "password": "TestPass2"},
        )
        token2 = resp2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 2 should have empty cart
        cart2 = await async_client.get("/api/carts/", headers=headers2)
        assert cart2.status_code == 200
        assert cart2.json()["item_count"] == 0
        # Should be different cart ID
        assert cart2.json()["id"] != cart1_id
