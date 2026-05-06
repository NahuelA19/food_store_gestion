"""
Food Store API - Main Application
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from database.client import dispose_engine, init_engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage FastAPI lifespan events: startup and shutdown."""
    # Startup
    logger.info("Starting up Food Store API")
    await init_engine()
    logger.info("Database engine initialized")
    yield
    # Shutdown
    logger.info("Shutting down Food Store API")
    await dispose_engine()
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

# Include routes
app.include_router(health_router)
app.include_router(auth_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Food Store API",
        "version": "0.1.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
