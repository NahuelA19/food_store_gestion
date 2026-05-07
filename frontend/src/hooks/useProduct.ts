/**
 * useProduct hook - Fetch single product details
 */

import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import { Product } from "../types/product";

export function useProduct(productId?: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productApi.getProduct(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch product");
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, isLoading, error };
}
