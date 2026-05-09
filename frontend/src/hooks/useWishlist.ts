/**
 * Wishlist hook
 */

import { useCallback, useEffect, useState } from "react";
import { wishlistApi } from "../api/wishlistApi";
import type { WishlistItem } from "../types/wishlist";

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await wishlistApi.list();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wishlist");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: number): Promise<boolean> => {
      try {
        const result = await wishlistApi.toggle(productId);
        // Refresh list after toggle
        await refresh();
        return result.is_wishlisted;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle");
        return false;
      }
    },
    [refresh],
  );

  const isWishlisted = useCallback(
    (productId: number): boolean => {
      return items.some((item) => item.product_id === productId);
    },
    [items],
  );

  return {
    items,
    count: items.length,
    isLoading,
    error,
    toggle,
    isWishlisted,
    refresh,
  };
}
