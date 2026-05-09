"""Tests for wishlist API endpoints."""
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.security.jwt import create_access_token


@pytest.fixture
async def test_product(db_session: AsyncSession, test_category: Category) -> Product:
    """Create a test product."""
    product = Product(
        name="Wishlist Product",
        description="Testing wishlist",
        price=Decimal("15.00"),
        category_id=test_category.id,
        is_available=True,
    )
    db_session.add(product)
    await db_session.flush()
    inventory = Inventory(product_id=product.id, stock_quantity=10)
    db_session.add(inventory)
    await db_session.commit()
    await db_session.refresh(product)
    return product


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Generate auth headers."""
    token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


class TestWishlistToggle:
    """Tests for toggling wishlist items."""

    def test_add_to_wishlist(
        self,
        test_client: TestClient,
        test_product: Product,
        auth_headers: dict,
    ):
        """Test adding a product to wishlist."""
        response = test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_wishlisted"] is True

    def test_remove_from_wishlist(
        self,
        test_client: TestClient,
        test_product: Product,
        auth_headers: dict,
    ):
        """Test removing a product from wishlist."""
        # Add first
        test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
            headers=auth_headers,
        )
        # Remove
        response = test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_wishlisted"] is False

    def test_toggle_unauthenticated(
        self,
        test_client: TestClient,
        test_product: Product,
    ):
        """Test toggle without auth returns 401."""
        response = test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
        )
        assert response.status_code == 401

    def test_toggle_nonexistent_product(
        self,
        test_client: TestClient,
        auth_headers: dict,
    ):
        """Test toggle non-existent product returns 404."""
        response = test_client.post(
            "/api/wishlist/toggle/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestWishlistList:
    """Tests for listing wishlist items."""

    def test_list_wishlist_with_items(
        self,
        test_client: TestClient,
        test_product: Product,
        auth_headers: dict,
    ):
        """Test listing wishlist with items returns products."""
        # Add product
        test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
            headers=auth_headers,
        )
        # List
        response = test_client.get("/api/wishlist/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["product_id"] == test_product.id
        assert "product" in data[0]
        assert data[0]["product"]["name"] == "Wishlist Product"

    def test_list_wishlist_empty(
        self,
        test_client: TestClient,
        auth_headers: dict,
    ):
        """Test listing empty wishlist returns empty array."""
        response = test_client.get("/api/wishlist/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_wishlist_unauthenticated(
        self,
        test_client: TestClient,
    ):
        """Test list without auth returns 401."""
        response = test_client.get("/api/wishlist/")
        assert response.status_code == 401


class TestWishlistCheck:
    """Tests for checking wishlist status."""

    def test_check_single_product(
        self,
        test_client: TestClient,
        test_product: Product,
        auth_headers: dict,
    ):
        """Test checking a single product."""
        test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
            headers=auth_headers,
        )
        response = test_client.get(
            f"/api/wishlist/check?product_ids={test_product.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()[str(test_product.id)] is True

    def test_check_product_not_in_wishlist(
        self,
        test_client: TestClient,
        test_product: Product,
        auth_headers: dict,
    ):
        """Test checking a product not in wishlist."""
        response = test_client.get(
            f"/api/wishlist/check?product_ids={test_product.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()[str(test_product.id)] is False

    def test_check_multiple_products(
        self,
        test_client: TestClient,
        test_product: Product,
        db_session: AsyncSession,
        test_category: Category,
        auth_headers: dict,
    ):
        """Test checking multiple products."""
        # Create a second product
        p2 = Product(
            name="Second Product",
            price=Decimal("20.00"),
            category_id=test_category.id,
        )
        db_session.add(p2)
        await db_session.flush()
        inv2 = Inventory(product_id=p2.id, stock_quantity=5)
        db_session.add(inv2)
        await db_session.commit()
        await db_session.refresh(p2)

        # Add first product to wishlist only
        test_client.post(
            f"/api/wishlist/toggle/{test_product.id}",
            headers=auth_headers,
        )

        response = test_client.get(
            f"/api/wishlist/check?product_ids={test_product.id},{p2.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data[str(test_product.id)] is True
        assert data[str(p2.id)] is False
