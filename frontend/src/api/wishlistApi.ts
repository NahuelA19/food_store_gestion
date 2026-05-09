/**
 * Wishlist API client
 */

import type { WishlistItem, WishlistToggleResponse } from "../types/wishlist";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const wishlistApi = {
  async toggle(productId: number): Promise<WishlistToggleResponse> {
    const response = await fetch(`${API_BASE_URL}/wishlist/toggle/${productId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to toggle wishlist");
    return response.json();
  },

  async list(): Promise<WishlistItem[]> {
    const response = await fetch(`${API_BASE_URL}/wishlist/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch wishlist");
    return response.json();
  },

  async check(productIds: number[]): Promise<Record<string, boolean>> {
    const response = await fetch(
      `${API_BASE_URL}/wishlist/check?product_ids=${productIds.join(",")}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) throw new Error("Failed to check wishlist");
    return response.json();
  },
};
