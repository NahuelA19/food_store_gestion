import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/wishlistApi";

export function useWishlist() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: number) => wishlistApi.toggle(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const items = query.data ?? [];

  const toggle = async (productId: number): Promise<boolean> => {
    try {
      const result = await toggleMutation.mutateAsync(productId);
      return result.is_wishlisted;
    } catch {
      return false;
    }
  };

  const isWishlisted = (productId: number): boolean => {
    return items.some((item) => item.product_id === productId);
  };

  return {
    items,
    count: items.length,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to load wishlist"
      : null,
    toggle,
    isWishlisted,
    refresh: query.refetch,
  };
}
