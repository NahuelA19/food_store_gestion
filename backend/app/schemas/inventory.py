"""Inventory Pydantic schemas for validation and serialization."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InventoryUpdate(BaseModel):
    """Inventory stock update schema."""

    stock_quantity: int = Field(..., ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)


class InventoryReserveRequest(BaseModel):
    """Inventory stock reservation schema."""

    quantity: int = Field(..., gt=0)


class InventoryResponse(BaseModel):
    """Inventory response model with calculated fields."""

    id: int
    product_id: int
    stock_quantity: int
    reserved_quantity: int
    available_quantity: int
    low_stock_threshold: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
