/**
 * useCart hook — manages shopping cart state.
 */

import { useState, useCallback, useEffect } from "react";
import type { CartResponse, CartItemAdd, CheckoutRequest, CheckoutResponse } from "../types/cart";
import { cartApi } from "../api/cartApi";

interface UseCartReturn {
  cart: CartResponse | null;
  items: CartResponse["items"];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (shippingData: CheckoutRequest) => Promise<CheckoutResponse>;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = cart?.items ?? [];
  const itemCount = cart?.item_count ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const tax = cart?.tax ?? 0;
  const total = cart?.total ?? 0;

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cartApi.getCurrentCart();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId: number, quantity: number) => {
    setError(null);
    try {
      const payload: CartItemAdd = { product_id: productId, quantity };
      const data = await cartApi.addItem(cart!.id, payload);
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
      throw err;
    }
  }, [cart]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    setError(null);
    try {
      const data = await cartApi.updateItemQuantity(cart!.id, itemId, quantity);
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
      throw err;
    }
  }, [cart]);

  const removeItem = useCallback(async (itemId: number) => {
    setError(null);
    try {
      const data = await cartApi.removeItem(cart!.id, itemId);
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
      throw err;
    }
  }, [cart]);

  const clearCart = useCallback(async () => {
    setError(null);
    try {
      const data = await cartApi.clearCart(cart!.id);
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
      throw err;
    }
  }, [cart]);

  const checkout = useCallback(async (shippingData: CheckoutRequest): Promise<CheckoutResponse> => {
    setError(null);
    try {
      const data = await cartApi.checkout(cart!.id, shippingData);
      setCart(null); // Cart is now checked out, reset local state
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      throw err;
    }
  }, [cart]);

  // Fetch cart on mount (when auth token exists)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchCart();
    }
  }, [fetchCart]);

  return {
    cart,
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading,
    error,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    checkout,
  };
}
