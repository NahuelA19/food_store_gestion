/**
 * useProducts hook - Fetch and manage product list
 */

import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import { Product, ProductListResponse } from "../types/product";

export function useProducts(
  page = 1,
  categoryId?: number,
  searchQuery = "",
  sortBy = "created_at",
  order = "desc"
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data: ProductListResponse = await productApi.getProducts(
          page,
          20,
          categoryId,
          undefined,
          undefined,
          undefined,
          searchQuery,
          sortBy,
          order
        );
        setProducts(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [page, categoryId, searchQuery, sortBy, order]);

  return { products, total, totalPages, isLoading, error };
}
