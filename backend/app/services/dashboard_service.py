"""Dashboard service layer for admin statistics."""

import logging

from sqlalchemy import func, select, text

from app.core.uow import UnitOfWork
from app.models.branch import Branch
from app.models.order import Order
from app.models.product import Product
from app.schemas.dashboard import DashboardStatsResponse

logger = logging.getLogger(__name__)

_DB_STATUS_PENDING = "pending"


async def get_dashboard_stats(uow: UnitOfWork) -> DashboardStatsResponse:
    """Get dashboard KPI statistics (admin only)."""
    now = func.now()

    # Orders created today
    today_start = func.date_trunc("day", now)
    today_orders_result = await uow.session.execute(
        select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= today_start),
    )
    total_orders_today, total_revenue_today = today_orders_result.one()
    total_revenue_today = float(total_revenue_today) if total_revenue_today else 0.0

    # Active branches
    try:
        branches_result = await uow.session.execute(
            select(func.count(Branch.id)).where(Branch.is_active.is_(True)),
        )
        active_branches = branches_result.scalar_one()
    except Exception:
        active_branches = 0

    # Pending orders (using DB enum value "pending")
    pending_result = await uow.session.execute(
        text("SELECT COUNT(*) FROM orders WHERE status::text = :st"),
        {"st": _DB_STATUS_PENDING},
    )
    pending_orders = pending_result.scalar_one()

    # Total products
    products_result = await uow.session.execute(select(func.count(Product.id)))
    total_products = products_result.scalar_one()

    # Monthly revenue
    month_start = func.date_trunc("month", now)
    monthly_result = await uow.session.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.created_at >= month_start),
    )
    monthly_revenue = float(monthly_result.scalar_one())

    # Orders by status (using DB enum values)
    status_counts_result = await uow.session.execute(
        text("SELECT status::text, COUNT(*) FROM orders GROUP BY status"),
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
