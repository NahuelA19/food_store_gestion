export type OrderStatus = "payment_pending" | "payment_failed" | "paid" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  user_id: number;
  user_email?: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  payment_status?: string | null;
  branch_id?: number | null;
  items?: OrderItem[];
}

export interface StatusHistoryEntry {
  id: number;
  estado_desde: string | null;
  estado_hasta: string;
  motivo: string | null;
  created_at: string;
}

export interface OrderDetail extends Order {
  payment_status: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  status_history?: StatusHistoryEntry[];
  items: OrderItem[];
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
