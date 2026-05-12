"""Order Pydantic schemas for validation and serialization."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OrderItemResponse(BaseModel):
    """Order item response schema."""

    id: int
    order_id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    """Order list item response schema."""

    id: int
    user_id: int
    status: str
    total_amount: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderDetailResponse(BaseModel):
    """Order detail response schema with items."""

    id: int
    user_id: int
    status: str
    total_amount: Decimal
    status_history: list[dict] | None = None
    payment_status: str | None = None
    payment_method: str | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    """Paginated order list response."""

    items: list[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status (admin)."""

    status: str = Field(..., min_length=1, max_length=20)


class HistorialResponse(BaseModel):
    """Order status history entry response."""

    id: int
    estado_desde: str | None = None
    estado_hasta: str
    motivo: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
