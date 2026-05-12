import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

export function useProduct(productId?: number) {
  const query = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productApi.getProduct(productId!),
    enabled: !!productId,
  });

  return {
    product: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch product"
      : null,
  };
}
