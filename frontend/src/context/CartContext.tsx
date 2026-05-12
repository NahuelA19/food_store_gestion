/**
 * Cart context for React — provides cart state to the entire app.
 */

import React, { createContext, ReactNode } from "react";
import { useCart } from "../hooks/useCart";
import type { CartResponse, CheckoutRequest, CheckoutResponse } from "../types/cart";

interface CartContextType {
  cart: CartResponse | null;
  items: CartResponse["items"];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<CartResponse>;
  updateQuantity: (itemId: number, quantity: number) => Promise<CartResponse>;
  removeItem: (itemId: number) => Promise<CartResponse>;
  clearCart: () => Promise<CartResponse>;
  checkout: (shippingData: CheckoutRequest) => Promise<CheckoutResponse>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const cart = useCart();

  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextType {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return context;
}
