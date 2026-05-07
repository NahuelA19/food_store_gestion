from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "food-store-api"


def test_liveness():
    """Test liveness probe"""
    response = client.get("/api/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "alive"


def test_readiness():
    """Test readiness probe"""
    response = client.get("/api/health/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "docs" in data
