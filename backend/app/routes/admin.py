"""Admin API routes for the Food Store."""

import logging
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_admin_user, get_db
from app.models.branch import Branch
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.order import (
    OrderDetailResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
)

# NB: The DB enum "orderstatus" was created with values:
#     pending, confirmed, shipped, delivered, cancelled
# The Python OrderStatus enum has different values (payment_pending, paid, etc.)
# We use raw text() queries for status comparisons until the DB enum is migrated.
_DB_STATUS_PENDING = "pending"

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/orders", response_model=OrderListResponse)
async def admin_list_all_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: str | None = Query(None, alias="status", description="Filter by order status"),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> OrderListResponse:
    """List ALL orders (admin only). Supports pagination and status filtering."""
    query = select(Order)

    if status_filter:
        # Map common status names to DB enum values
        _status_map = {
            "pending": "pending",
            "payment_pending": "pending",
            "confirmed": "confirmed",
            "shipped": "shipped",
            "delivered": "delivered",
            "cancelled": "cancelled",
        }
        db_status = _status_map.get(status_filter.lower())
        if not db_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: '{status_filter}'",
            ) from None
        query = query.where(text("status::text = :st")).params(st=db_status)

    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    offset = (page - 1) * limit
    result = await db.execute(
        query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
    )
    orders = result.scalars().all()

    total_pages = max(1, ceil(total / limit)) if total > 0 else 1

    return OrderListResponse(
        items=[
            OrderResponse(
                id=o.id,
                user_id=o.user_id,
                status=o.status.value if hasattr(o.status, "value") else o.status,
                total_amount=o.total_amount,
                created_at=o.created_at,
            )
            for o in orders
        ],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/orders/{order_id}", response_model=OrderDetailResponse)
async def admin_get_order_detail(
    order_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> OrderDetailResponse:
    """Get ANY order detail (admin bypasses ownership check)."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    items_response = [
        OrderItemResponse(
            id=item.id,
            order_id=item.order_id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        for item in order.items
    ]

    return OrderDetailResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status.value if hasattr(order.status, "value") else order.status,
        total_amount=order.total_amount,
        status_history=order.status_history,
        payment_status=order.payment_status.value if order.payment_status and hasattr(order.payment_status, "value") else order.payment_status,
        stripe_payment_intent_id=order.stripe_payment_intent_id,
        payment_method=order.payment_method,
        paid_at=order.paid_at,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_response,
    )


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def admin_dashboard_stats(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardStatsResponse:
    """Get dashboard KPI statistics (admin only).

    Calculates:
    - total_orders_today: Orders created today
    - total_revenue_today: Revenue from today's orders
    - active_branches: Count of active branches
    - pending_orders: Orders with PAYMENT_PENDING status
    - total_products: Count of all products
    - monthly_revenue: Revenue this month
    - orders_by_status: Distribution of orders by status
    """
    now = func.now()

    # Orders created today
    today_start = func.date_trunc("day", now)
    today_orders_result = await db.execute(
        select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= today_start)
    )
    total_orders_today, total_revenue_today = today_orders_result.one()
    total_revenue_today = float(total_revenue_today) if total_revenue_today else 0.0

    # Active branches
    try:
        branches_result = await db.execute(
            select(func.count(Branch.id)).where(Branch.is_active.is_(True))
        )
        active_branches = branches_result.scalar_one()
    except Exception:
        active_branches = 0

    # Pending orders (using DB enum value "pending")
    pending_result = await db.execute(
        text("SELECT COUNT(*) FROM orders WHERE status::text = :st"),
        {"st": _DB_STATUS_PENDING},
    )
    pending_orders = pending_result.scalar_one()

    # Total products
    products_result = await db.execute(select(func.count(Product.id)))
    total_products = products_result.scalar_one()

    # Monthly revenue
    month_start = func.date_trunc("month", now)
    monthly_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= month_start)
    )
    monthly_revenue = float(monthly_result.scalar_one())

    # Orders by status (using DB enum values)
    status_counts_result = await db.execute(
        text("SELECT status::text, COUNT(*) FROM orders GROUP BY status")
    )
    orders_by_status = {row[0]: row[1] for row in status_counts_result.all()}

    return DashboardStatsResponse(
        total_orders_today=total_orders_today,
        total_revenue_today=total_revenue_today,
        active_branches=active_branches,
        pending_orders=pending_orders,
        total_products=total_products,
        monthly_revenue=monthly_revenue,
        orders_by_status=orders_by_status,
    )
