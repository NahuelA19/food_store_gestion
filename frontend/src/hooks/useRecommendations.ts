import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import { Product } from "../types/product";

export function useRecommendations(limit = 8) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recs, trend] = await Promise.all([
          productApi.getRecommendations(limit),
          productApi.getTrending(limit),
        ]);
        if (!abortController.signal.aborted) {
          setRecommendations(recs);
          setTrending(trend);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch recommendations");
          setRecommendations([]);
          setTrending([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [limit]);

  return { recommendations, trending, loading, error };
}

export function useFrequentlyBoughtTogether(productId: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productApi.getFrequentlyBoughtTogether(productId, 4);
        if (!abortController.signal.aborted) {
          setProducts(data);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch frequently bought together");
          setProducts([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [productId]);

  return { products, loading, error };
}
