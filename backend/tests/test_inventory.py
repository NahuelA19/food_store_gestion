"""Tests for inventory API endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_get_inventory(test_client: TestClient):
    """Test getting inventory for a product."""
    # Create category and product
    cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Produce"},
    )
    category_id = cat_response.json()["id"]

    prod_response = test_client.post(
        "/api/products/",
        json={
            "name": "Potato",
            "price": 1.00,
            "category_id": category_id,
        },
    )
    product_id = prod_response.json()["id"]

    # Get inventory
    response = test_client.get(f"/api/inventory/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == product_id
    assert data["stock_quantity"] == 0  # Auto-created with 0 stock
    assert data["available_quantity"] == 0


def test_get_inventory_not_found(test_client: TestClient):
    """Test getting inventory for non-existent product."""
    response = test_client.get("/api/inventory/99999")
    assert response.status_code == 404


def test_update_inventory(test_client: TestClient):
    """Test updating inventory stock."""
    # Create category and product
    cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Dairy"},
    )
    category_id = cat_response.json()["id"]

    prod_response = test_client.post(
        "/api/products/",
        json={
            "name": "Milk",
            "price": 2.50,
            "category_id": category_id,
        },
    )
    product_id = prod_response.json()["id"]

    # Update inventory
    response = test_client.put(
        f"/api/inventory/{product_id}",
        json={"stock_quantity": 50, "low_stock_threshold": 10},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["stock_quantity"] == 50
    assert data["available_quantity"] == 50


def test_reserve_inventory(test_client: TestClient):
    """Test reserving inventory."""
    # Create category and product
    cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Meat"},
    )
    category_id = cat_response.json()["id"]

    prod_response = test_client.post(
        "/api/products/",
        json={
            "name": "Chicken",
            "price": 5.00,
            "category_id": category_id,
        },
    )
    product_id = prod_response.json()["id"]

    # First set stock
    test_client.put(
        f"/api/inventory/{product_id}",
        json={"stock_quantity": 100},
    )

    # Reserve stock
    response = test_client.post(
        f"/api/inventory/{product_id}/reserve",
        json={"quantity": 25},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["reserved_quantity"] == 25
    assert data["available_quantity"] == 75  # 100 - 25


def test_reserve_inventory_exceeds_available(test_client: TestClient):
    """Test reserving more than available."""
    # Create category and product
    cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Seafood"},
    )
    category_id = cat_response.json()["id"]

    prod_response = test_client.post(
        "/api/products/",
        json={
            "name": "Salmon",
            "price": 8.00,
            "category_id": category_id,
        },
    )
    product_id = prod_response.json()["id"]

    # Set stock
    test_client.put(
        f"/api/inventory/{product_id}",
        json={"stock_quantity": 20},
    )

    # Try to reserve more than available
    response = test_client.post(
        f"/api/inventory/{product_id}/reserve",
        json={"quantity": 50},
    )
    assert response.status_code == 409
    assert "Cannot reserve" in response.json()["detail"]


def test_update_inventory_below_reserved(test_client: TestClient):
    """Test that stock cannot be set below reserved quantity."""
    # Create category and product
    cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Bakery"},
    )
    category_id = cat_response.json()["id"]

    prod_response = test_client.post(
        "/api/products/",
        json={
            "name": "Bread",
            "price": 2.00,
            "category_id": category_id,
        },
    )
    product_id = prod_response.json()["id"]

    # Set initial stock
    test_client.put(
        f"/api/inventory/{product_id}",
        json={"stock_quantity": 100},
    )

    # Reserve some stock
    test_client.post(
        f"/api/inventory/{product_id}/reserve",
        json={"quantity": 50},
    )

    # Try to set stock below reserved
    response = test_client.put(
        f"/api/inventory/{product_id}",
        json={"stock_quantity": 30},
    )
    assert response.status_code == 400
    assert "Cannot set stock" in response.json()["detail"]


def test_reserve_multiple_times(test_client: TestClient):
    """Test multiple reservations."""
    # Create category and product
    cat_response = test_client.post(
        "/api/categories/",
        json={"name": "Drinks"},
    )
    category_id = cat_response.json()["id"]

    prod_response = test_client.post(
        "/api/products/",
        json={
            "name": "Water",
            "price": 1.50,
            "category_id": category_id,
        },
    )
    product_id = prod_response.json()["id"]

    # Set stock
    test_client.put(
        f"/api/inventory/{product_id}",
        json={"stock_quantity": 100},
    )

    # First reservation
    res1 = test_client.post(
        f"/api/inventory/{product_id}/reserve",
        json={"quantity": 30},
    )
    assert res1.status_code == 200
    assert res1.json()["reserved_quantity"] == 30

    # Second reservation
    res2 = test_client.post(
        f"/api/inventory/{product_id}/reserve",
        json={"quantity": 20},
    )
    assert res2.status_code == 200
    assert res2.json()["reserved_quantity"] == 50
    assert res2.json()["available_quantity"] == 50
