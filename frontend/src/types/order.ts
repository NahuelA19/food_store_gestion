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
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  payment_status?: string | null;
  items?: OrderItem[];
}

export interface OrderDetail extends Order {
  payment_status: string | null;
  items: OrderItem[];
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
