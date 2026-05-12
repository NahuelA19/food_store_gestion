import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

export function useCategories() {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: () => productApi.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 min — categories rarely change
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch categories"
      : null,
  };
}
