/**
 * Cart API client for shopping cart operations.
 */

import { useAuthStore } from "../store/authStore";
import type { CartItemAdd, CartResponse, CheckoutRequest, CheckoutResponse } from "../types/cart";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const cartApi = {
  /** Get current user's active cart (creates one if it doesn't exist). */
  async getCurrentCart(): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CartResponse>(response);
  },

  /** Get a specific cart by ID. */
  async getCartById(cartId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CartResponse>(response);
  },

  /** Add an item to the cart. Idempotent: if product already in cart, updates quantity. */
  async addItem(cartId: number, payload: CartItemAdd): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CartResponse>(response);
  },

  /** Update cart item quantity. If quantity is 0, removes the item. */
  async updateItemQuantity(cartId: number, itemId: number, quantity: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items/${itemId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse<CartResponse>(response);
  },

  /** Remove an item from cart. */
  async removeItem(cartId: number, itemId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items/${itemId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<CartResponse>(response);
  },

  /** Clear all items from cart. */
  async clearCart(cartId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<CartResponse>(response);
  },

  /** Initiate checkout for the cart. */
  async checkout(cartId: number, payload: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/checkout`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CheckoutResponse>(response);
  },
};
