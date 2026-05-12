import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

export function useProducts(
  page = 1,
  categoryId?: number,
  searchQuery = "",
  sortBy = "created_at",
  order = "desc"
) {
  const query = useQuery({
    queryKey: ["products", { page, categoryId, searchQuery, sortBy, order }],
    queryFn: () =>
      productApi.getProducts(
        page,
        20,
        categoryId,
        undefined,
        undefined,
        undefined,
        searchQuery,
        sortBy,
        order
      ),
    staleTime: 1000 * 60 * 5,
  });

  return {
    products: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.total_pages ?? 0,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch products"
      : null,
  };
}
