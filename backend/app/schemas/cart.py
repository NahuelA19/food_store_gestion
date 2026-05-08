"""Cart Pydantic schemas for validation and serialization."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    """Schema for adding an item to cart."""

    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., ge=1, le=999)


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity."""

    quantity: int = Field(..., ge=0, le=999)


class CartItemResponse(BaseModel):
    """Cart item response model."""

    id: int
    cart_id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutRequest(BaseModel):
    """Schema for initiating checkout."""

    shipping_address: str = Field(..., min_length=1, max_length=500)
    shipping_method: str = Field(default="standard")
    notes: str | None = Field(None, max_length=1000)


class CartResponse(BaseModel):
    """Cart response model with computed totals."""

    id: int
    user_id: int
    status: str
    items: list[CartItemResponse] = []
    item_count: int = 0
    subtotal: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")
    created_at: datetime
    expires_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    """Checkout response model."""

    cart_id: int
    order_id: int | None = None
    status: str
    total: Decimal
    client_secret: str | None = None
    message: str = "Checkout initiated successfully"
