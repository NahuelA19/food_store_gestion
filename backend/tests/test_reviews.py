"""Tests for review API endpoints."""
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.security.jwt import create_access_token
from app.security.password import get_password_hash


@pytest.fixture
async def test_product(db_session: AsyncSession, test_category: Category) -> Product:
    """Create a test product for reviews."""
    product = Product(
        name="Reviewable Product",
        description="A product for testing reviews",
        price=Decimal("10.00"),
        category_id=test_category.id,
        is_available=True,
    )
    db_session.add(product)
    await db_session.flush()

    inventory = Inventory(product_id=product.id, stock_quantity=50)
    db_session.add(inventory)
    await db_session.commit()
    await db_session.refresh(product)
    return product


@pytest.fixture
async def second_user(db_session: AsyncSession) -> User:
    """Create a second regular user."""
    user = User(
        email="second@example.com",
        hashed_password=get_password_hash("TestPass123"),
        is_active=True,
        role="user",
        first_name="Second",
        last_name="User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def user_auth_headers(test_user: User) -> dict:
    """Generate auth headers for the default test user."""
    token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user_auth_headers(second_user: User) -> dict:
    """Generate auth headers for the second user."""
    token = create_access_token(
        data={"user_id": second_user.id, "email": second_user.email}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(test_user: User, db_session: AsyncSession) -> dict:
    """Create an admin user and return auth headers."""
    admin = User(
        email="admin_review@example.com",
        hashed_password=get_password_hash("AdminPass123"),
        is_active=True,
        role="admin",
        first_name="Admin",
        last_name="User",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    token = create_access_token(data={"user_id": admin.id, "email": admin.email})
    return {"Authorization": f"Bearer {token}"}


class TestCreateReview:
    """Tests for creating reviews."""

    def test_create_review_success(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test creating a review with all fields."""
        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
                "title": "Great product",
                "comment": "Really enjoyed this product",
            },
            headers=user_auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 4
        assert data["title"] == "Great product"
        assert data["comment"] == "Really enjoyed this product"
        assert data["is_approved"] is False
        assert data["product_id"] == test_product.id
        assert "user_name" in data

    def test_create_review_minimal(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test creating a review with only required fields."""
        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 5,
            },
            headers=user_auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 5
        assert data["title"] is None
        assert data["comment"] is None

    def test_create_review_unauthenticated(
        self,
        test_client: TestClient,
        test_product: Product,
    ):
        """Test creating review without auth returns 401."""
        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 3,
            },
        )
        assert response.status_code == 401

    def test_create_review_nonexistent_product(
        self,
        test_client: TestClient,
        user_auth_headers: dict,
    ):
        """Test creating review for non-existent product returns 404."""
        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": 99999,
                "rating": 3,
            },
            headers=user_auth_headers,
        )
        assert response.status_code == 404

    def test_create_duplicate_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test creating duplicate review returns 409."""
        # First review
        test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
            },
            headers=user_auth_headers,
        )
        # Second review (duplicate)
        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 5,
            },
            headers=user_auth_headers,
        )
        assert response.status_code == 409

    def test_create_review_invalid_rating(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test creating review with invalid rating returns 422."""
        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 0,
            },
            headers=user_auth_headers,
        )
        assert response.status_code == 422

        response = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 6,
            },
            headers=user_auth_headers,
        )
        assert response.status_code == 422


class TestListReviews:
    """Tests for listing reviews."""

    def test_list_reviews_empty(
        self,
        test_client: TestClient,
        test_product: Product,
    ):
        """Test listing reviews for product with no reviews."""
        response = test_client.get(
            f"/api/v1/reviews/product/{test_product.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["reviews"] == []
        assert data["total"] == 0
        assert data["average_rating"] is None

    def test_list_reviews_with_data(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test listing reviews shows only approved reviews."""
        # Create review
        test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
                "comment": "Nice!",
            },
            headers=user_auth_headers,
        )
        # List - should be 0 because review is pending approval
        response = test_client.get(
            f"/api/v1/reviews/product/{test_product.id}"
        )
        assert response.status_code == 200
        assert response.json()["total"] == 0


class TestUpdateReview:
    """Tests for updating reviews."""

    def test_update_own_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test updating own review succeeds."""
        # Create review
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 3,
                "comment": "Okay",
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        # Update
        response = test_client.put(
            f"/api/v1/reviews/{review_id}",
            json={"rating": 5, "comment": "Updated - amazing!"},
            headers=user_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 5
        assert data["comment"] == "Updated - amazing!"
        assert data["is_approved"] is False  # Reset on update

    def test_update_others_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        second_user_auth_headers: dict,
    ):
        """Test updating another user's review returns 403."""
        # User 1 creates review
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        # User 2 tries to update
        response = test_client.put(
            f"/api/v1/reviews/{review_id}",
            json={"rating": 1},
            headers=second_user_auth_headers,
        )
        assert response.status_code == 403


class TestDeleteReview:
    """Tests for deleting reviews."""

    def test_delete_own_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test deleting own review succeeds."""
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 3,
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        response = test_client.delete(
            f"/api/v1/reviews/{review_id}",
            headers=user_auth_headers,
        )
        assert response.status_code == 204

    def test_delete_others_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        second_user_auth_headers: dict,
    ):
        """Test deleting another user's review returns 403."""
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        response = test_client.delete(
            f"/api/v1/reviews/{review_id}",
            headers=second_user_auth_headers,
        )
        assert response.status_code == 403


class TestAdminModeration:
    """Tests for admin review moderation."""

    def test_admin_approves_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        admin_auth_headers: dict,
    ):
        """Test admin can approve a review."""
        # Create review as regular user
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 5,
                "comment": "Excellent!",
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        # Admin approves
        response = test_client.patch(
            f"/api/v1/admin/reviews/{review_id}/moderate",
            json={"action": "approve"},
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_approved"] is True

    def test_admin_rejects_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        admin_auth_headers: dict,
    ):
        """Test admin can reject a review with reason."""
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 2,
                "comment": "Bad product",
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        # Admin rejects
        response = test_client.patch(
            f"/api/v1/admin/reviews/{review_id}/moderate",
            json={
                "action": "reject",
                "rejection_reason": "Inappropriate content",
            },
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_approved"] is False
        assert data["rejection_reason"] == "Inappropriate content"

    def test_non_admin_cannot_moderate(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
    ):
        """Test non-admin user cannot moderate reviews."""
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        response = test_client.patch(
            f"/api/v1/admin/reviews/{review_id}/moderate",
            json={"action": "approve"},
            headers=user_auth_headers,
        )
        assert response.status_code == 403

    def test_admin_deletes_any_review(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        admin_auth_headers: dict,
    ):
        """Test admin can delete any review."""
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 3,
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        response = test_client.delete(
            f"/api/v1/admin/reviews/{review_id}",
            headers=admin_auth_headers,
        )
        assert response.status_code == 204


class TestProductDetailReviews:
    """Tests for review summary in product detail."""

    def test_product_detail_includes_review_summary(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        admin_auth_headers: dict,
    ):
        """Test product detail endpoint includes review summary."""
        # Create and approve a review
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 4,
                "comment": "Great!",
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        test_client.patch(
            f"/api/v1/admin/reviews/{review_id}/moderate",
            json={"action": "approve"},
            headers=admin_auth_headers,
        )

        # Get product detail
        response = test_client.get(f"/api/v1/products/{test_product.id}")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert data["reviews"]["average_rating"] == 4.0
        assert data["reviews"]["total_count"] == 1
        assert data["reviews"]["distribution"]["4"] == 1


class TestRecentReviews:
    """Tests for recent reviews endpoint."""

    def test_recent_reviews_empty(self, test_client: TestClient):
        """Test recent reviews when no approved reviews exist."""
        response = test_client.get("/api/v1/reviews/recent")
        assert response.status_code == 200
        assert response.json() == []

    def test_recent_reviews_with_data(
        self,
        test_client: TestClient,
        test_product: Product,
        user_auth_headers: dict,
        admin_auth_headers: dict,
    ):
        """Test recent reviews returns approved reviews."""
        # Create and approve a review
        create_resp = test_client.post(
            "/api/v1/reviews/",
            json={
                "product_id": test_product.id,
                "rating": 5,
                "comment": "Best product ever!",
            },
            headers=user_auth_headers,
        )
        review_id = create_resp.json()["id"]

        test_client.patch(
            f"/api/v1/admin/reviews/{review_id}/moderate",
            json={"action": "approve"},
            headers=admin_auth_headers,
        )

        response = test_client.get("/api/v1/reviews/recent?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["rating"] == 5
        assert data[0]["comment"] == "Best product ever!"
