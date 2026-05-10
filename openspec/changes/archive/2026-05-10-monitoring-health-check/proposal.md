## Why

The app has no structured logging, no error tracking, and no performance metrics. When something breaks in production there's no way to know what happened. We need observability — structured logs, error tracking, and health/metrics endpoints — before going live.

## What Changes

- **Structured JSON logging**: Replace ad-hoc `print()` and basic logging with structured logging (request_id, duration, status, error context)
- **Sentry integration**: Error tracking for backend (FastAPI middleware), catch unhandled exceptions with context
- **Prometheus metrics endpoint**: Track request count, duration histogram, error rate, DB pool size via `/metrics`
- **Enhanced health endpoint**: Add DB connectivity check, Sentry status, uptime to existing `/api/health`
- **Request logging middleware**: Log every request with method, path, status, duration, ip

## Capabilities

### New Capabilities
- `observability`: Structured logging, request metrics, and health checks for the backend

### Modified Capabilities

None.

## Impact

- `backend/app/main.py` — add middleware (request logging, metrics, sentry)
- `backend/app/middleware/` — new directory for middleware modules
- `backend/app/services/logging_service.py` — structured logging setup
- `backend/requirements.txt` — add `sentry-sdk`, `prometheus-client`, `structlog`
- `backend/.env` — add `SENTRY_DSN`, `LOG_LEVEL`
- No frontend changes. No database changes.
