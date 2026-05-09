export interface DashboardStats {
  total_orders_today: number;
  total_revenue_today: number;
  active_branches: number;
  pending_orders: number;
  total_products: number;
  monthly_revenue: number;
  orders_by_status: Record<string, number>;
}
