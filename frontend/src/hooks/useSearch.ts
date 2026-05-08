import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { debounce } from 'lodash';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface Filters {
  category_id: number | null;
  min_price: number | null;
  max_price: number | null;
  in_stock: boolean | null;
  min_stock: number | null;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number;
  category: {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
  is_available: boolean;
  inventory: {
    id: number;
    product_id: number;
    stock_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    low_stock_threshold: number;
    created_at: string;
    updated_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseSearchReturn {
  query: string;
  filters: Filters;
  page: number;
  items: Product[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  categories: Category[];
  setQuery: (q: string) => void;
  setFilters: (filters: Filters) => void;
  setPage: (p: number) => void;
  resetFilters: () => void;
  clearSearch: () => void;
}

function parseFiltersFromUrl(params: URLSearchParams): Filters {
  return {
    category_id: params.has('category_id') ? parseInt(params.get('category_id')!) : null,
    min_price: params.has('min_price') ? parseFloat(params.get('min_price')!) : null,
    max_price: params.has('max_price') ? parseFloat(params.get('max_price')!) : null,
    in_stock: params.has('in_stock') ? params.get('in_stock') === 'true' : null,
    min_stock: params.has('min_stock') ? parseInt(params.get('min_stock')!) : null,
  };
}

export function useSearch(): UseSearchReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [query, setQueryState] = useState(searchParams.get('q') || '');
  const [filters, setFiltersState] = useState<Filters>(parseFiltersFromUrl(searchParams));
  const [page, setPageState] = useState(parseInt(searchParams.get('page') || '1'));

  const [items, setItems] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.items || data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  // Sync URL params whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.category_id) params.set('category_id', filters.category_id.toString());
    if (filters.min_price !== null) params.set('min_price', filters.min_price.toString());
    if (filters.max_price !== null) params.set('max_price', filters.max_price.toString());
    if (filters.in_stock !== null) params.set('in_stock', filters.in_stock.toString());
    if (filters.min_stock) params.set('min_stock', filters.min_stock.toString());
    params.set('page', page.toString());

    setSearchParams(params);
  }, [query, filters, page, setSearchParams]);

  // Memoized fetch to avoid infinite loops
  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (filters.category_id) params.set('category_id', filters.category_id.toString());
      if (filters.min_price !== null) params.set('min_price', filters.min_price.toString());
      if (filters.max_price !== null) params.set('max_price', filters.max_price.toString());
      if (filters.in_stock !== null) params.set('in_stock', filters.in_stock.toString());
      if (filters.min_stock) params.set('min_stock', filters.min_stock.toString());
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`${API_URL}/products/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters, page]);

  // Fetch results whenever query/filters/page change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSetQuery = useCallback(
    debounce((newQuery: string) => {
      setQueryState(newQuery);
      setPageState(1);
    }, 300)
  );

  function handleSetFilters(newFilters: Filters) {
    setFiltersState(newFilters);
    setPageState(1);
  }

  function handleResetFilters() {
    setFiltersState({
      category_id: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      min_stock: null,
    });
    setPageState(1);
  }

  function handleClearSearch() {
    setQueryState('');
    setPageState(1);
  }

  return {
    query,
    filters,
    page,
    items,
    pagination,
    loading,
    error,
    categories,
    setQuery: handleSetQuery as (q: string) => void,
    setFilters: handleSetFilters,
    setPage: setPageState,
    resetFilters: handleResetFilters,
    clearSearch: handleClearSearch,
  };
}
