"""Tests for category API endpoints."""

from fastapi.testclient import TestClient


def test_list_categories_empty(test_client: TestClient):
    """Test listing categories when empty."""
    response = test_client.get("/api/categories/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_and_list_categories(test_client: TestClient):
    """Test creating and listing categories."""
    # Create a category
    response = test_client.post(
        "/api/categories/",
        json={"name": "Vegetables", "description": "Fresh vegetables"},
    )
    assert response.status_code == 201
    category_data = response.json()
    assert category_data["name"] == "Vegetables"
    assert "id" in category_data
    category_id = category_data["id"]

    # List categories
    response = test_client.get("/api/categories/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(c["id"] == category_id for c in data)


def test_get_category(test_client: TestClient):
    """Test getting a category."""
    # Create a category
    create_response = test_client.post(
        "/api/categories/",
        json={"name": "Fruits", "description": "Fresh fruits"},
    )
    category_id = create_response.json()["id"]

    # Get the category
    response = test_client.get(f"/api/categories/{category_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == category_id
    assert data["name"] == "Fruits"


def test_get_category_not_found(test_client: TestClient):
    """Test getting non-existent category."""
    response = test_client.get("/api/categories/99999")
    assert response.status_code == 404


def test_create_category_duplicate(test_client: TestClient):
    """Test creating duplicate category name."""
    # Create first category
    test_client.post(
        "/api/categories/",
        json={"name": "Grains", "description": "Grain products"},
    )

    # Try to create with same name
    response = test_client.post(
        "/api/categories/",
        json={"name": "Grains", "description": "Different description"},
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_update_category(test_client: TestClient):
    """Test updating a category."""
    # Create a category
    create_response = test_client.post(
        "/api/categories/",
        json={"name": "Dairy", "description": "Dairy products"},
    )
    category_id = create_response.json()["id"]

    # Update it
    response = test_client.put(
        f"/api/categories/{category_id}",
        json={"name": "Dairy & Cheese", "description": "Updated description"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dairy & Cheese"
    assert data["description"] == "Updated description"


def test_delete_category_empty(test_client: TestClient):
    """Test deleting a category without products."""
    # Create a category
    create_response = test_client.post(
        "/api/categories/",
        json={"name": "Meat", "description": "Meat products"},
    )
    category_id = create_response.json()["id"]

    # Delete it
    response = test_client.delete(f"/api/categories/{category_id}")
    assert response.status_code == 204

    # Verify it's deleted
    get_response = test_client.get(f"/api/categories/{category_id}")
    assert get_response.status_code == 404


def test_delete_category_with_products(test_client: TestClient):
    """Test deleting a category with products returns 409."""
    # Create a category
    create_cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Fish", "description": "Fish products"},
    )
    category_id = create_cat_response.json()["id"]

    # Create a product in the category
    test_client.post(
        "/api/products/",
        json={
            "name": "Salmon",
            "description": "Fresh salmon",
            "price": 5.50,
            "category_id": category_id,
            "is_available": True,
        },
    )

    # Try to delete the category
    response = test_client.delete(f"/api/categories/{category_id}")
    assert response.status_code == 409
    assert "Cannot delete category" in response.json()["detail"]
