"""Product Pydantic schemas for validation and serialization."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.review import ReviewSummary


class CategoryResponse(BaseModel):
    """Category response model."""

    id: int
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryResponse(BaseModel):
    """Inventory response model with calculated fields."""

    id: int
    product_id: int
    stock_quantity: int
    reserved_quantity: int
    available_quantity: int  # Calculated from available_quantity property
    low_stock_threshold: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    """Product creation schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    price: Decimal = Field(..., gt=Decimal("0"), max_digits=10, decimal_places=2)
    category_id: int = Field(..., gt=0)
    is_available: bool = Field(default=True)


class ProductUpdate(BaseModel):
    """Product update schema (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    price: Decimal | None = Field(None, gt=Decimal("0"), max_digits=10, decimal_places=2)
    category_id: int | None = Field(None, gt=0)
    is_available: bool | None = None


class ProductResponse(BaseModel):
    """Product response model with nested category."""

    id: int
    name: str
    description: str | None = None
    price: Decimal
    category_id: int
    category: CategoryResponse
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(BaseModel):
    """Product detail response including inventory and review information."""

    id: int
    name: str
    description: str | None = None
    price: Decimal
    category_id: int
    category: CategoryResponse
    is_available: bool
    inventory: InventoryResponse | None = None
    reviews: ReviewSummary | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
