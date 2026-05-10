# Observability

## Requirements

### REQ-OBS-01: Structured Logging
- All log output is JSON-formatted with `timestamp`, `level`, `logger`, `message`, and optional context fields
- Every HTTP request logs: `method`, `path`, `status_code`, `duration_ms`, `client_ip`
- Errors include `exc_info`, `traceback` in the JSON context
- Development mode (non-JSON) keeps human-readable console output

### REQ-OBS-02: Error Tracking (Sentry)
- FastAPI middleware captures unhandled exceptions and sends to Sentry
- Captures request context: URL, headers, user_id (if authenticated), params
- Sends errors asynchronously — never blocks the request
- Configurable via `SENTRY_DSN` env var; missing DSN = no-op

### REQ-OBS-03: Prometheus Metrics
- `GET /api/metrics` exposes Prometheus-format text
- Metrics tracked: `http_requests_total` (counter by method, path, status), `http_request_duration_seconds` (histogram), `http_requests_in_progress` (gauge), `db_pool_size` (gauge)
- Metrics endpoint is excluded from metrics tracking (no infinite loop)

### REQ-OBS-04: Enhanced Health Check
- `GET /api/health` returns: status, uptime (seconds), database connectivity (OK/ERROR), version
- Response format: `{"status": "ok", "uptime": 1234, "database": "ok", "version": "0.1.0"}`
- No auth required

### REQ-OBS-05: Lifespan Pattern
- Replace `@app.on_event("startup")` and `@app.on_event("shutdown")` with `@asynccontextmanager lifespan`
- Startup: initialize Sentry, configure logging, start metrics
- Shutdown: clean up resources, flush Sentry
