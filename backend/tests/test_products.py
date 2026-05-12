"""Tests for product API endpoints."""

from decimal import Decimal

from fastapi.testclient import TestClient


def test_list_products_empty(test_client: TestClient):
    """Test listing products when empty."""
    response = test_client.get("/api/v1/products/?page=1&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_create_and_list_products(test_client: TestClient):
    """Test creating and listing products."""
    # Create a category first
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Vegetables", "description": "Fresh vegetables"},
    )
    category_id = cat_response.json()["id"]

    # Create a product
    response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Tomato",
            "description": "Fresh tomato",
            "price": 2.50,
            "category_id": category_id,
            "is_available": True,
        },
    )
    assert response.status_code == 201
    product_data = response.json()
    assert product_data["name"] == "Tomato"
    assert "inventory" in product_data

    # List products
    response = test_client.get("/api/v1/products/?page=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0


def test_get_product(test_client: TestClient):
    """Test getting a single product."""
    # Create category and product
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Fruits"},
    )
    category_id = cat_response.json()["id"]

    create_response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Apple",
            "price": 1.50,
            "category_id": category_id,
        },
    )
    product_id = create_response.json()["id"]

    # Get the product
    response = test_client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_id
    assert data["name"] == "Apple"
    assert "inventory" in data


def test_get_product_not_found(test_client: TestClient):
    """Test getting non-existent product."""
    response = test_client.get("/api/v1/products/99999")
    assert response.status_code == 404


def test_create_product_invalid_category(test_client: TestClient):
    """Test creating product with invalid category."""
    response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Orange",
            "price": 1.50,
            "category_id": 99999,
        },
    )
    assert response.status_code == 400


def test_create_product_invalid_price(test_client: TestClient):
    """Test creating product with negative price."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Dairy"},
    )
    category_id = cat_response.json()["id"]

    response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Milk",
            "price": -1.50,
            "category_id": category_id,
        },
    )
    assert response.status_code == 422


def test_update_product(test_client: TestClient):
    """Test updating a product."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Bakery"},
    )
    category_id = cat_response.json()["id"]

    create_response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Bread",
            "price": 2.00,
            "category_id": category_id,
        },
    )
    product_id = create_response.json()["id"]

    # Update it
    response = test_client.put(
        f"/api/v1/products/{product_id}",
        json={
            "name": "Whole Wheat Bread",
            "price": 3.00,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Whole Wheat Bread"
    assert Decimal(str(data["price"])) == Decimal("3.00")


def test_delete_product(test_client: TestClient):
    """Test deleting a product."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Beverages"},
    )
    category_id = cat_response.json()["id"]

    create_response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Orange Juice",
            "price": 3.50,
            "category_id": category_id,
        },
    )
    product_id = create_response.json()["id"]

    # Delete it
    response = test_client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 204

    # Verify it's deleted
    get_response = test_client.get(f"/api/v1/products/{product_id}")
    assert get_response.status_code == 404


def test_list_products_filter_by_category(test_client: TestClient):
    """Test filtering products by category."""
    # Create two categories
    cat1_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Fruits"},
    )
    cat1_id = cat1_response.json()["id"]

    cat2_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Vegetables"},
    )
    cat2_id = cat2_response.json()["id"]

    # Create products in each
    test_client.post(
        "/api/v1/products/",
        json={"name": "Banana", "price": 1.00, "category_id": cat1_id},
    )
    test_client.post(
        "/api/v1/products/",
        json={"name": "Carrot", "price": 0.50, "category_id": cat2_id},
    )

    # Filter by category 1
    response = test_client.get(f"/api/v1/products/?category_id={cat1_id}")
    assert response.status_code == 200
    data = response.json()
    assert all(item["category_id"] == cat1_id for item in data["items"])


def test_list_products_filter_by_price(test_client: TestClient):
    """Test filtering products by price range."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Snacks"},
    )
    category_id = cat_response.json()["id"]

    test_client.post(
        "/api/v1/products/",
        json={"name": "Chips", "price": 2.00, "category_id": category_id},
    )
    test_client.post(
        "/api/v1/products/",
        json={"name": "Cookies", "price": 3.00, "category_id": category_id},
    )
    test_client.post(
        "/api/v1/products/",
        json={"name": "Nuts", "price": 5.00, "category_id": category_id},
    )

    # Filter by price range
    response = test_client.get("/api/v1/products/?min_price=2.5&max_price=4.0")
    assert response.status_code == 200
    data = response.json()
    assert all(
        Decimal("2.5") <= Decimal(str(item["price"])) <= Decimal("4.0")
        for item in data["items"]
    )


def test_list_products_search(test_client: TestClient):
    """Test searching products."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Pasta"},
    )
    category_id = cat_response.json()["id"]

    test_client.post(
        "/api/v1/products/",
        json={"name": "Spaghetti", "price": 1.50, "category_id": category_id},
    )
    test_client.post(
        "/api/v1/products/",
        json={"name": "Penne", "price": 1.50, "category_id": category_id},
    )

    # Search
    response = test_client.get("/api/v1/products/?search=Spaghetti")
    assert response.status_code == 200
    data = response.json()
    assert any("Spaghetti" in item["name"] for item in data["items"])


def test_toggle_product_availability(test_client: TestClient):
    """Test toggling product availability."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Frozen"},
    )
    category_id = cat_response.json()["id"]

    create_response = test_client.post(
        "/api/v1/products/",
        json={
            "name": "Ice Cream",
            "price": 4.00,
            "category_id": category_id,
            "is_available": True,
        },
    )
    product_id = create_response.json()["id"]
    initial_status = create_response.json()["is_available"]

    # Toggle availability
    response = test_client.put(f"/api/v1/products/{product_id}/availability")
    assert response.status_code == 200
    data = response.json()
    assert data["is_available"] != initial_status

    # Toggle back
    response = test_client.put(f"/api/v1/products/{product_id}/availability")
    data = response.json()
    assert data["is_available"] == initial_status


def test_get_related_products(test_client: TestClient):
    """Test getting related products."""
    cat_response = test_client.post(
        "/api/v1/categories/",
        json={"name": "Grains"},
    )
    category_id = cat_response.json()["id"]

    # Create multiple products
    p1_response = test_client.post(
        "/api/v1/products/",
        json={"name": "Rice", "price": 2.00, "category_id": category_id},
    )
    product_id = p1_response.json()["id"]

    test_client.post(
        "/api/v1/products/",
        json={"name": "Wheat", "price": 2.50, "category_id": category_id},
    )

    # Get related products
    response = test_client.get(f"/api/v1/products/{product_id}/related")
    assert response.status_code == 200
    data = response.json()
    assert all(item["id"] != product_id for item in data)
    assert all(item["category_id"] == category_id for item in data)
