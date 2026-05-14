export interface DashboardStats {
  total_orders_today: number;
  orders_today_change: number;
  total_revenue_today: number;
  revenue_today_change: number;
  active_branches: number;
  pending_orders: number;
  pending_orders_change: number;
  total_products: number;
  total_products_change: number;
  monthly_revenue: number;
  monthly_revenue_change: number;
  orders_by_status: Record<string, number>;
}
