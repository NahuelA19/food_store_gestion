/**
 * Review hooks
 */

import { useCallback, useEffect, useState } from "react";
import { reviewApi } from "../api/reviewApi";
import type { Review, ReviewCreate, ReviewListResponse, ReviewUpdate } from "../types/review";

export function useProductReviews(productId: number | undefined) {
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    reviewApi
      .getProductReviews(productId, page)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [productId, page]);

  const refetch = useCallback(() => {
    if (!productId) return;
    setIsLoading(true);
    reviewApi
      .getProductReviews(productId, page)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [productId, page]);

  return {
    reviews: data?.reviews ?? [],
    summary: {
      average_rating: data?.average_rating ?? null,
      total_count: data?.total_reviews ?? 0,
      distribution: {} as Record<number, number>,
    },
    total: data?.total ?? 0,
    page,
    setPage,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (data: ReviewCreate): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const review = await reviewApi.createReview(data);
      return review;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create review";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createReview, isLoading, error };
}

export function useUpdateReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReview = async (id: number, data: ReviewUpdate): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const review = await reviewApi.updateReview(id, data);
      return review;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update review";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateReview, isLoading, error };
}

export function useDeleteReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReview = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await reviewApi.deleteReview(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete review";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteReview, isLoading, error };
}

export function useRecentReviews(limit: number = 5) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    reviewApi
      .getRecentReviews(limit)
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { reviews, isLoading, error };
}
