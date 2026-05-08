"""Pydantic schemas for Food Store API."""

from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithProductsResponse,
)
from app.schemas.inventory import (
    InventoryReserveRequest,
    InventoryResponse,
    InventoryUpdate,
)
from app.schemas.order import (
    OrderDetailResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
)
from app.schemas.payment import (
    PaymentIntentResponse,
)
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductResponse,
    ProductUpdate,
)

__all__ = [
    # Category
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "CategoryWithProductsResponse",
    # Product
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductDetailResponse",
    # Inventory
    "InventoryUpdate",
    "InventoryReserveRequest",
    "InventoryResponse",
    # Order
    "OrderItemResponse",
    "OrderResponse",
    "OrderDetailResponse",
    "OrderListResponse",
    "OrderStatusUpdate",
    # Payment
    "PaymentIntentResponse",
]
