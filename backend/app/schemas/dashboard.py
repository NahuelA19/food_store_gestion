"""Dashboard Pydantic schemas for admin KPIs and statistics."""

from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics response schema."""

    total_orders_today: int
    orders_today_change: float = 0.0
    total_revenue_today: float
    revenue_today_change: float = 0.0
    active_branches: int
    pending_orders: int
    pending_orders_change: float = 0.0
    total_products: int
    total_products_change: float = 0.0
    monthly_revenue: float
    monthly_revenue_change: float = 0.0
    orders_by_status: dict[str, int]
