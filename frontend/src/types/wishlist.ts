/**
 * Wishlist TypeScript interfaces
 */

import type { Product } from "./product";

export interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface WishlistToggleResponse {
  is_wishlisted: boolean;
}
