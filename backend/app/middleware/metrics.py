"""Prometheus metrics middleware."""

import time

from prometheus_client import Counter, Gauge, Histogram
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)
http_request_duration = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration",
    ["method", "path"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5],
)
http_requests_in_progress = Gauge(
    "http_requests_in_progress",
    "Requests in progress",
)

EXCLUDED_PATHS = {"/api/metrics", "/api/health", "/api/health/"}


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to track Prometheus metrics for HTTP requests."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)

        http_requests_in_progress.inc()
        start = time.time()
        try:
            response = await call_next(request)
            return response
        finally:
            duration = time.time() - start
            http_requests_in_progress.dec()
            http_requests_total.labels(
                method=request.method,
                path=request.url.path,
                status=response.status_code,
            ).inc()
            http_request_duration.labels(
                method=request.method,
                path=request.url.path,
            ).observe(duration)
