import logging

import pytest
from fastapi.testclient import TestClient

from app.main import app, init_sentry

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "food-store-api"


def test_health_response_shape():
    """Health response includes all observability fields."""
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert data["version"] == "0.1.0"
    assert "uptime" in data
    assert isinstance(data["uptime"], int)
    assert data["uptime"] >= 0
    assert "database" in data
    assert data["database"] in ("ok", "error", "unknown")


def test_health_db_fallback_on_no_connection():
    """Health DB check does not crash when no database is available."""
    response = client.get("/api/health/")
    assert response.status_code == 200
    # Without a real DB, the catch sets database="error"
    assert response.json()["database"] in ("ok", "error")


def test_metrics_endpoint():
    """Metrics endpoint returns Prometheus-format text."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    text = response.text
    assert "# HELP" in text
    assert "http_requests_total" in text
    assert "http_request_duration_seconds" in text
    assert "http_requests_in_progress" in text


def test_metrics_excludes_self():
    """Metrics endpoint does not track its own request."""
    # First call resets counters
    client.get("/api/metrics")
    # Verify /metrics path never appears in metrics output
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert 'path="/api/metrics"' not in response.text


def test_sentry_skipped_without_dsn(caplog):
    """Sentry init does nothing when SENTRY_DSN is not set."""
    import os

    original_dsn = os.environ.pop("SENTRY_DSN", None)
    try:
        with caplog.at_level(logging.INFO):
            init_sentry()
            assert any(
                "Sentry DSN not configured" in record.message
                for record in caplog.records
            )
    finally:
        if original_dsn is not None:
            os.environ["SENTRY_DSN"] = original_dsn


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
