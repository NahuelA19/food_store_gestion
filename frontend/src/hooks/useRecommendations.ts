import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

export function useRecommendations(limit = 8) {
  const recsQuery = useQuery({
    queryKey: ["recommendations", limit],
    queryFn: () => productApi.getRecommendations(limit),
    staleTime: 1000 * 60 * 10,
  });

  const trendingQuery = useQuery({
    queryKey: ["trending", limit],
    queryFn: () => productApi.getTrending(limit),
    staleTime: 1000 * 60 * 10,
  });

  return {
    recommendations: recsQuery.data ?? [],
    trending: trendingQuery.data ?? [],
    loading: recsQuery.isLoading || trendingQuery.isLoading,
    error: recsQuery.error
      ? recsQuery.error instanceof Error ? recsQuery.error.message : "Failed to fetch recommendations"
      : trendingQuery.error
        ? trendingQuery.error instanceof Error ? trendingQuery.error.message : "Failed to fetch trends"
        : null,
  };
}

export function useFrequentlyBoughtTogether(productId: number) {
  const query = useQuery({
    queryKey: ["frequently-bought", productId],
    queryFn: () => productApi.getFrequentlyBoughtTogether(productId, 4),
    enabled: !!productId,
  });

  return {
    products: query.data ?? [],
    loading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch frequently bought together"
      : null,
  };
}
