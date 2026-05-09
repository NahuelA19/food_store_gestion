"""Wishlist Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductResponse


class WishlistItemResponse(BaseModel):
    """Wishlist item with full product details."""

    id: int
    product_id: int
    product: ProductResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WishlistToggleResponse(BaseModel):
    """Response after toggling a wishlist item."""

    is_wishlisted: bool
