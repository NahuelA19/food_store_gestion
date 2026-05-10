## Context

The backend has basic `print()` statements, a simple `/api/health` endpoint, and no error tracking. There's a `DeprecationWarning` for `on_event` startup/shutdown that should be migrated to lifespan. We need observability before deployment.

## Goals / Non-Goals

**Goals:**
- Structured JSON logging for all backend requests and errors
- Sentry integration for error tracking (FastAPI integration)
- Prometheus metrics at `/metrics` (request count, duration, errors, DB pool)
- Enhanced health endpoint with DB check + uptime
- Request logging middleware (method, path, status, duration, IP)
- Migrate from `on_event` to lifespan pattern

**Non-Goals:**
- Full ELK stack deployment (overkill at this stage)
- CloudWatch or other cloud-specific monitoring
- Distributed tracing
- Frontend monitoring (deferred)

## Decisions

1. **`structlog` over JSON logger**: Standard library's `logging` + `structlog` gives us structured JSON output with timestamps, levels, and context vars. Easy to configure and lightweight.
2. **`sentry-sdk` for error tracking**: FastAPI has first-class Sentry integration via `sentry_sdk.init()` + `SentryAsgiMiddleware`. Free tier covers 5k events/month.
3. **`prometheus-client` for metrics**: Standard `/metrics` endpoint that Prometheus can scrape. Track request count (counter), duration (histogram), in-flight requests (gauge), DB pool size.
4. **Middleware over route decorators**: Request metrics/logging are cross-cutting concerns. FastAPI middleware is the correct layer.
5. **Lifespan pattern**: Replace `@app.on_event("startup")` and `@app.on_event("shutdown")` with the modern `@asynccontextmanager lifespan` pattern. This is the recommended FastAPI approach and fixes the deprecation warning.

## Risks / Trade-offs

- **Sentry DSN is a secret**: Must be in `.env`, never committed. Without it, Sentry is a no-op.
- **Prometheus metrics add memory overhead**: Minimal for our scale (counters/histograms in-memory). Resets on restart.
- **Structured logging changes log format**: Devs reading console logs will see JSON instead of plain text. Use `structlog` dev console for local dev.
