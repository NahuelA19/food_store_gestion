"""
Food Store API - Main Application
"""

import json
import logging
import os
from contextlib import asynccontextmanager
from decimal import Decimal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes.admin import router as admin_router
from app.routes.admin_reviews import router as admin_reviews_router
from app.routes.auth import router as auth_router
from app.routes.branches import router as branches_router
from app.routes.cart import router as cart_router
from app.routes.cocina import router as cocina_router, set_websocket_manager
from app.routes.direcciones_entrega import router as direcciones_router
from app.routes.categories import router as categories_router
from app.routes.inventory import router as inventory_router
from app.routes.notifications import router as notifications_router
from app.routes.orders import router as orders_router
from app.routes.payments import router as payments_router
from app.routes.products import router as products_router
from app.routes.reviews import router as reviews_router
from app.routes.search import router as search_router
from app.routes.users import router as users_router
from app.routes.wishlist import router as wishlist_router
from app.services.websocket_manager import ConnectionManager
from app.services.logging_service import RequestLoggingMiddleware, configure_logging
from database.client import dispose_engine, init_engine

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialize Sentry SDK if DSN is configured."""
    pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    if os.getenv("TESTING") != "1":
        environment = os.getenv("ENVIRONMENT", "development")
        configure_logging(environment=environment)
        logger.info("Starting up Food Store API")
        await init_engine()
    
    # Initialize WebSocket connection manager for KDS
    websocket_manager = ConnectionManager()
    app.state.websocket_manager = websocket_manager  # Store in app.state for dependency injection
    set_websocket_manager(websocket_manager)  # Also set globally in cocina.py for backward compatibility
    logger.info("Initialized WebSocket manager for Kitchen Display System")
    
    yield
    
    if os.getenv("TESTING") != "1":
        await dispose_engine()


from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.security.limiter import limiter
app = FastAPI(
    title="Food Store API",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

# Include routers
app.include_router(admin_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(branches_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(cart_router, prefix="/api/v1")
app.include_router(cocina_router, prefix="/api/v1")
app.include_router(direcciones_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")   # MUST be before products_router (/{product_id} catches /search)
app.include_router(products_router, prefix="/api/v1")
app.include_router(admin_reviews_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(wishlist_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")

# Serve uploaded files (create upload directory if it doesn't exist)
import os
from pathlib import Path as PathLibPath
upload_dir = os.getenv("UPLOAD_DIR", "/tmp/foodstore_uploads")
PathLibPath(upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/")
async def root():
    return {"message": "Welcome to Food Store API", "version": "0.1.0", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
