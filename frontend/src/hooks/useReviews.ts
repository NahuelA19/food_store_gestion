import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "../api/reviewApi";
import type { Review, ReviewCreate, ReviewUpdate } from "../types/review";
import { useAuthStore } from "../store/authStore";

export function useProductReviews(productId: number | undefined) {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["product-reviews", productId, page],
    queryFn: () => reviewApi.getProductReviews(productId!, page),
    enabled: !!productId,
  });

  return {
    reviews: query.data?.reviews ?? [],
    summary: {
      average_rating: query.data?.average_rating ?? null,
      total_count: query.data?.total_reviews ?? 0,
      distribution: {} as Record<number, number>,
    },
    total: query.data?.total ?? 0,
    page,
    setPage,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch reviews"
      : null,
    refetch: query.refetch,
  };
}

export function useMyReview(productId: number | undefined) {
  const user = useAuthStore((s) => s.user);
  const query = useQuery({
    queryKey: ["my-review", productId],
    queryFn: () => reviewApi.getMyReview(productId!),
    enabled: !!productId && !!user,
  });

  return {
    review: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: ReviewCreate) => reviewApi.createReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["my-review", variables.product_id] });
    },
  });

  return {
    createReview: async (data: ReviewCreate): Promise<Review | null> => {
      try {
        return await mutation.mutateAsync(data);
      } catch {
        return null;
      }
    },
    isLoading: mutation.isPending,
    error: mutation.error
      ? mutation.error instanceof Error ? mutation.error.message : "Failed to create review"
      : null,
  };
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewUpdate; productId: number }) =>
      reviewApi.updateReview(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-review", variables.productId] });
    },
  });

  return {
    updateReview: async (id: number, data: ReviewUpdate, productId?: number): Promise<Review | null> => {
      try {
        return await mutation.mutateAsync({ id, data, productId: productId ?? 0 });
      } catch {
        return null;
      }
    },
    isLoading: mutation.isPending,
    error: mutation.error
      ? mutation.error instanceof Error ? mutation.error.message : "Failed to update review"
      : null,
  };
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id }: { id: number; productId: number }) =>
      reviewApi.deleteReview(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-review", variables.productId] });
    },
  });

  return {
    deleteReview: async (id: number, productId: number): Promise<boolean> => {
      try {
        await mutation.mutateAsync({ id, productId });
        return true;
      } catch {
        return false;
      }
    },
    isLoading: mutation.isPending,
    error: mutation.error
      ? mutation.error instanceof Error ? mutation.error.message : "Failed to delete review"
      : null,
  };
}

export function useRecentReviews(limit: number = 5) {
  const query = useQuery({
    queryKey: ["recent-reviews", limit],
    queryFn: () => reviewApi.getRecentReviews(limit),
  });

  return {
    reviews: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch recent reviews"
      : null,
  };
}
