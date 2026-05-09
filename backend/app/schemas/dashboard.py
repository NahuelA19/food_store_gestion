"""Dashboard Pydantic schemas for admin KPIs and statistics."""

from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics response schema."""

    total_orders_today: int
    total_revenue_today: float
    active_branches: int
    pending_orders: int
    total_products: int
    monthly_revenue: float
    orders_by_status: dict[str, int]
