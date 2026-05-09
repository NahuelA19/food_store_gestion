"""Pydantic schemas for Food Store API."""

from app.schemas.branch import (
    BranchCreate,
    BranchListResponse,
    BranchResponse,
    BranchUpdate,
)
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithProductsResponse,
)
from app.schemas.dashboard import (
    DashboardStatsResponse,
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
    # Branch
    "BranchCreate",
    "BranchUpdate",
    "BranchResponse",
    "BranchListResponse",
    # Category
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "CategoryWithProductsResponse",
    # Dashboard
    "DashboardStatsResponse",
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
