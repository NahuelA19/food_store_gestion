/** Cart types for the shopping cart feature. */

export interface CartItemResponse {
  id: number;
  cart_id: number;
  product_id: number;
  product_name?: string | null;
  quantity: number;
  unit_price: number;
  subtotal?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  id: number;
  user_id: number;
  status: string;
  items: CartItemResponse[];
  item_count: number;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  expires_at?: string | null;
}

export interface CartItemAdd {
  product_id: number;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

export interface CheckoutRequest {
  shipping_address: string;
  shipping_method?: string;
  notes?: string | null;
}

export interface CheckoutResponse {
  cart_id: number;
  order_id?: number | null;
  status: string;
  total: number;
  message: string;
}
