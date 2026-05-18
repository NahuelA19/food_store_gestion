"""Admin API routes for the Food Store."""

import logging
from datetime import datetime, timedelta, timezone
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import contains_eager, selectinload

from app.core.uow import UnitOfWork
from app.dependencies import get_admin_user, get_uow, require_role
from app.models.branch import Branch
from app.models.order import Order, OrderStatus
from app.services.order_service import build_status_condition
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.order import (
    HistorialResponse,
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
    search: str | None = Query(None, description="Search by order ID or customer email"),
    current_user: User = Depends(require_role("admin", "cajero", "chef")),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderListResponse:
    """List ALL orders (admin, cajero, or chef). Supports pagination, status and search filtering."""
    query = select(Order).outerjoin(Order.user)

    if status_filter:
        cond = build_status_condition(status_filter)
        if cond is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: '{status_filter}'",
            )
        query = query.where(cond)

    if search:
        term = search.strip()
        if term.isdigit():
            query = query.where(Order.id == int(term))
        else:
            query = query.where(User.email.ilike(f"%{term}%"))

    count_query = select(func.count()).select_from(query.subquery())
    count_result = await uow.session.execute(count_query)
    total = count_result.scalar_one()

    offset = (page - 1) * limit
    result = await uow.session.execute(
        query.options(
            contains_eager(Order.user),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    orders = result.unique().scalars().all()

    total_pages = max(1, ceil(total / limit)) if total > 0 else 1

    return OrderListResponse(
        items=[
            OrderResponse(
                id=o.id,
                user_id=o.user_id,
                user_email=o.user.email if o.user else None,
                status=o.status.value if hasattr(o.status, "value") else o.status,
                total_amount=o.total_amount,
                payment_method=o.payment_method,
                payment_status=o.payment_status.value if hasattr(o.payment_status, "value") else o.payment_status,
                created_at=o.created_at,
                items=[
                    OrderItemResponse(
                        id=i.id,
                        order_id=i.order_id,
                        product_id=i.product_id,
                        product_name=i.product.name if i.product else None,
                        quantity=i.quantity,
                        unit_price=i.unit_price,
                    )
                    for i in o.items
                ],
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
    current_user: User = Depends(require_role("admin", "cajero", "chef")),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderDetailResponse:
    """Get ANY order detail (admin, cajero, or chef bypasses ownership check)."""
    result = await uow.session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .options(selectinload(Order.user))
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

    # Use the FSM historial table instead of the legacy JSON field
    status_history = []
    if order.historial:
        status_history = [
            HistorialResponse.model_validate(h) for h in order.historial
        ]

    return OrderDetailResponse(
        id=order.id,
        user_id=order.user_id,
        user_email=order.user.email if order.user else None,
        status=order.status.value if hasattr(order.status, "value") else order.status,
        total_amount=order.total_amount,
        status_history=status_history,
        payment_status=order.payment_status.value if order.payment_status and hasattr(order.payment_status, "value") else order.payment_status,
        payment_method=order.payment_method,
        paid_at=order.paid_at,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_response,
    )


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def admin_dashboard_stats(
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> DashboardStatsResponse:
    """Get dashboard KPI statistics (admin only)."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate last month start correctly
    if month_start.month == 1:
        last_month_start = month_start.replace(year=month_start.year - 1, month=12)
    else:
        last_month_start = month_start.replace(month=month_start.month - 1)

    def _calc_pct(curr, prev):
        if not prev or prev == 0:
            return 100.0 if curr > 0 else 0.0
        return round(((curr - prev) / prev) * 100, 1)

    # 1. Orders and Revenue TODAY
    today_orders_result = await uow.session.execute(
        select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= today_start)
    )
    total_orders_today, total_revenue_today = today_orders_result.one()
    total_revenue_today = float(total_revenue_today)

    # 2. Orders and Revenue YESTERDAY
    yesterday_orders_result = await uow.session.execute(
        select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= yesterday_start)
        .where(Order.created_at < today_start)
    )
    orders_yesterday, revenue_yesterday = yesterday_orders_result.one()
    revenue_yesterday = float(revenue_yesterday)

    orders_today_change = _calc_pct(total_orders_today, orders_yesterday)
    revenue_today_change = _calc_pct(total_revenue_today, revenue_yesterday)

    # 3. Active branches
    try:
        branches_result = await uow.session.execute(
            select(func.count(Branch.id)).where(Branch.is_active.is_(True))
        )
        active_branches = branches_result.scalar_one()
    except Exception:
        active_branches = 0

    # 4. Pending orders
    pending_result = await uow.session.execute(
        text("SELECT COUNT(*) FROM orders WHERE status::text = :st"),
        {"st": _DB_STATUS_PENDING},
    )
    pending_orders = pending_result.scalar_one()
    
    pending_yesterday_result = await uow.session.execute(
        text("SELECT COUNT(*) FROM orders WHERE status::text = :st AND created_at < :ts"),
        {"st": _DB_STATUS_PENDING, "ts": today_start},
    )
    pending_yesterday = pending_yesterday_result.scalar_one()
    pending_orders_change = _calc_pct(pending_orders, pending_yesterday)

    # 5. Total products
    products_result = await uow.session.execute(select(func.count(Product.id)))
    total_products = products_result.scalar_one()
    
    seven_days_ago = now - timedelta(days=7)
    new_products_result = await uow.session.execute(
        select(func.count(Product.id)).where(Product.created_at >= seven_days_ago)
    )
    new_products_count = new_products_result.scalar_one()
    total_products_change = float(new_products_count)

    # 6. Monthly revenue
    monthly_result = await uow.session.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= month_start)
    )
    monthly_revenue = float(monthly_result.scalar_one())

    last_monthly_result = await uow.session.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= last_month_start)
        .where(Order.created_at < month_start)
    )
    last_monthly_revenue = float(last_monthly_result.scalar_one())
    monthly_revenue_change = _calc_pct(monthly_revenue, last_monthly_revenue)

    # 7. Orders by status
    status_counts_result = await uow.session.execute(
        text("SELECT LOWER(status::text), COUNT(*) FROM orders GROUP BY status")
    )
    orders_by_status = {row[0]: row[1] for row in status_counts_result.all()}

    return DashboardStatsResponse(
        total_orders_today=total_orders_today,
        orders_today_change=orders_today_change,
        total_revenue_today=total_revenue_today,
        revenue_today_change=revenue_today_change,
        active_branches=active_branches,
        pending_orders=pending_orders,
        pending_orders_change=pending_orders_change,
        total_products=total_products,
        total_products_change=total_products_change,
        monthly_revenue=monthly_revenue,
        monthly_revenue_change=monthly_revenue_change,
        orders_by_status=orders_by_status,
    )
