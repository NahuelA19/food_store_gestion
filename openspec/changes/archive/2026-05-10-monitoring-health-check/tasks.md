## 1. Dependencies & Config

- [ ] 1.1 Add `sentry-sdk`, `prometheus-client`, `structlog` to `backend/requirements.txt`
- [ ] 1.2 Add `SENTRY_DSN`, `LOG_LEVEL`, `SENTRY_ENVIRONMENT` to `backend/.env` (optional with defaults)

## 2. Logging Service

- [ ] 2.1 Create `backend/app/services/logging_service.py` — configure structlog with JSON renderer (dev: console, prod: JSON)
- [ ] 2.2 Add `setup_logging()` function called on startup
- [ ] 2.3 Add request logging middleware that logs method, path, status, duration, client_ip

## 3. Sentry Integration

- [ ] 3.1 Initialize Sentry SDK in lifespan startup (guard: skip if no SENTRY_DSN)
- [ ] 3.2 Add `SentryAsgiMiddleware` to the app
- [ ] 3.3 Flush Sentry on shutdown

## 4. Prometheus Metrics Middleware

- [ ] 4.1 Create `backend/app/middleware/metrics.py` — metrics tracking middleware
- [ ] 4.2 Track: `http_requests_total` (counter by method/path/status), `http_request_duration_seconds` (histogram), `http_requests_in_progress` (gauge)
- [ ] 4.3 Add `GET /api/metrics` endpoint using `prometheus_client.generate_latest()`
- [ ] 4.4 Exclude `/api/metrics` and `/api/health` from metrics tracking

## 5. Enhanced Health Check

- [ ] 5.1 Update `/api/health` to include: uptime, database connectivity check, version
- [ ] 5.2 Add DB connectivity: run `SELECT 1` and return OK/ERROR

## 6. Lifespan Migration

- [ ] 6.1 Replace `@app.on_event("startup")` with `@asynccontextmanager lifespan`
- [ ] 6.2 Replace `@app.on_event("shutdown")` with lifespan cleanup
- [ ] 6.3 Move startup logic (logging init, Sentry init) into lifespan
- [ ] 6.4 Verify no deprecation warnings on startup

## 7. Tests

- [ ] 7.1 Test health endpoint returns expected shape + DB connectivity
- [ ] 7.2 Test metrics endpoint returns Prometheus-format text
- [ ] 7.3 Test middleware logs request details
- [ ] 7.4 Test Sentry init is skipped when no DSN
