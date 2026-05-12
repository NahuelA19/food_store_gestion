import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CartResponse, CheckoutRequest, CheckoutResponse } from "../types/cart";
import { cartApi } from "../api/cartApi";
import { useAuthStore } from "../store/authStore";

export function useCart() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCurrentCart(),
    enabled: isAuthenticated,
  });

  const cart = query.data ?? null;
  const items = cart?.items ?? [];
  const itemCount = cart?.item_count ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const tax = cart?.tax ?? 0;
  const total = cart?.total ?? 0;

  const withCartId = <T,>(fn: (cartId: number) => Promise<T>): Promise<T> => {
    const currentCart = queryClient.getQueryData<CartResponse>(["cart"]);
    if (!currentCart) throw new Error("No active cart");
    return fn(currentCart.id);
  };

  const addItemMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      withCartId((cartId) =>
        cartApi.addItem(cartId, { product_id: productId, quantity })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      withCartId((cartId) => cartApi.updateItemQuantity(cartId, itemId, quantity)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      withCartId((cartId) => cartApi.removeItem(cartId, itemId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCartMutation = useMutation({
    mutationFn: () =>
      withCartId((cartId) => cartApi.clearCart(cartId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: (shippingData: CheckoutRequest) =>
      withCartId((cartId) => cartApi.checkout(cartId, shippingData)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const anyMutating =
    addItemMutation.isPending ||
    updateQuantityMutation.isPending ||
    removeItemMutation.isPending ||
    clearCartMutation.isPending ||
    checkoutMutation.isPending;

  return {
    cart,
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading: query.isLoading || anyMutating,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch cart"
      : addItemMutation.error
        ? addItemMutation.error instanceof Error ? addItemMutation.error.message : "Failed to add item"
        : updateQuantityMutation.error
          ? updateQuantityMutation.error instanceof Error ? updateQuantityMutation.error.message : "Failed to update quantity"
          : removeItemMutation.error
            ? removeItemMutation.error instanceof Error ? removeItemMutation.error.message : "Failed to remove item"
            : clearCartMutation.error
              ? clearCartMutation.error instanceof Error ? clearCartMutation.error.message : "Failed to clear cart"
              : checkoutMutation.error
                ? checkoutMutation.error instanceof Error ? checkoutMutation.error.message : "Checkout failed"
                : null,
    fetchCart: async () => { await query.refetch(); },
    addItem: (productId: number, quantity: number) =>
      addItemMutation.mutateAsync({ productId, quantity }),
    updateQuantity: (itemId: number, quantity: number) =>
      updateQuantityMutation.mutateAsync({ itemId, quantity }),
    removeItem: (itemId: number) =>
      removeItemMutation.mutateAsync(itemId),
    clearCart: () =>
      clearCartMutation.mutateAsync(),
    checkout: (shippingData: CheckoutRequest): Promise<CheckoutResponse> =>
      checkoutMutation.mutateAsync(shippingData),
  };
}
