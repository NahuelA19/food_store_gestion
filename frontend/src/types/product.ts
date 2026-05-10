/**
 * Product and Inventory TypeScript interfaces
 */

export interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: number;
  product_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  category: Category;
  is_available: boolean;
  inventory?: Inventory;
  avg_rating?: number;
  purchase_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  is_available?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  category_id?: number;
  is_available?: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}
