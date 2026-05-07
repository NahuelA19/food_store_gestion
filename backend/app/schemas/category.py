"""Category Pydantic schemas for validation and serialization."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    """Category creation schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)


class CategoryUpdate(BaseModel):
    """Category update schema (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)


class CategoryResponse(BaseModel):
    """Category response model."""

    id: int
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryWithProductsResponse(BaseModel):
    """Category response with product count."""

    id: int
    name: str
    description: str | None = None
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
