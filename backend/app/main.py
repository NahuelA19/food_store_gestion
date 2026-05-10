"""
Food Store API - Main Application

## Overview
FastAPI-based REST API for the Food Store e-commerce platform.

## Authentication
This API uses **JWT (JSON Web Tokens)** for authentication:
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Get an access token
- Protected routes require `Authorization: Bearer <token>` header
- See docs/AUTHENTICATION.md for detailed authentication flow

## Key Features
- JWT-based authentication with bcrypt password hashing
- SQLAlchemy ORM with async asyncpg driver
- Pydantic v2 for request/response validation
- Automatic OpenAPI/Swagger documentation at /docs
- CORS configured for frontend development
- Database migrations with Alembic
- Structured logging with structlog
- Prometheus metrics at /api/metrics
- Sentry error tracking (optional, requires SENTRY_DSN)

## Routes
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Prometheus metrics
- `GET /api/protected/test` - Protected route (requires authentication)
- `GET /api/public/test` - Public route (no authentication required)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Environment Variables
Set in `.env` file:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing secret
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `SENTRY_DSN` - Sentry DSN (optional)
- `LOG_LEVEL` - Logging level (default: DEBUG in dev, INFO in prod)

## Documentation
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Auth guide: docs/AUTHENTICATION.md
- Architecture: docs/ARCHITECTURE.md
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.metrics import MetricsMiddleware
from app.routes.admin import router as admin_router
from app.routes.admin_reviews import router as admin_reviews_router
from app.routes.auth import router as auth_router
from app.routes.branches import router as branches_router
from app.routes.cart import router as cart_router
from app.routes.categories import router as categories_router
from app.routes.health import router as health_router
from app.routes.inventory import router as inventory_router
from app.routes.metrics import router as metrics_router
from app.routes.notifications import router as notifications_router
from app.routes.orders import router as orders_router
from app.routes.payments import router as payments_router
from app.routes.products import router as products_router
from app.routes.reviews import router as reviews_router
from app.routes.search import router as search_router
from app.routes.users import router as users_router
from app.routes.wishlist import router as wishlist_router
from app.services.logging_service import RequestLoggingMiddleware, configure_logging
from database.client import dispose_engine, init_engine

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialize Sentry SDK if DSN is configured."""
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        logger.info("Sentry DSN not configured -- skipping Sentry initialization")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.asyncio import AsyncioIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
    except ImportError:
        logger.warning("sentry-sdk not installed -- skipping Sentry initialization")
        return

    environment = os.getenv("SENTRY_ENVIRONMENT", os.getenv("ENVIRONMENT", "development"))

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(),
            AsyncioIntegration(),
            SqlalchemyIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    logger.info("Sentry initialized (environment: %s)", environment)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    environment = os.getenv("ENVIRONMENT", "development")
    configure_logging(environment=environment)
    logger.info("Starting up Food Store API")
    init_sentry()
    await init_engine()
    logger.info("Database engine initialized")
    yield
    logger.info("Shutting down Food Store API")
    await dispose_engine()
    try:
        import sentry_sdk

        sentry_sdk.flush()
    except ImportError:
        pass
    logger.info("Database engine disposed")


# Create FastAPI app
app = FastAPI(
    title="Food Store API",
    description="Modern E-commerce API for Food Store",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monitoring middleware
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Include routes
app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(branches_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(admin_reviews_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(search_router, prefix="/api/v1")
app.include_router(wishlist_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint"""
    return {
        "message": "Welcome to Food Store API",
        "version": "0.1.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
