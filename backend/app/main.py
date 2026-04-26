"""
Food Store API - Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router

# Create FastAPI app
app = FastAPI(
    title="Food Store API",
    description="Modern E-commerce API for Food Store",
    version="0.1.0",
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
