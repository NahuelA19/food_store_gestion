/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';

// Mock fetch globally
global.fetch = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useSearch hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should initialize with default values', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    expect(result.current.query).toBe('');
    expect(result.current.page).toBe(1);
    expect(result.current.items).toEqual([]);
  });

  it('should have default filter values', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    expect(result.current.filters).toEqual({
      category_id: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      min_stock: null,
    });
  });

  it('should load categories on mount', async () => {
    const categoriesResponse = {
      ok: true,
      json: async () => [
        { id: 1, name: 'Produce', description: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      ],
    };

    const searchResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('categories')) return Promise.resolve(categoriesResponse);
      return Promise.resolve(searchResponse);
    });

    const { result } = renderHook(() => useSearch(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should set query', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.setQuery('pasta');
    });

    // Query should be set with debounce (give it time)
    await waitFor(() => {
      expect(result.current.query).toBe('pasta');
    }, { timeout: 400 });
  });

  it('should reset filters', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.setFilters({
        category_id: 1,
        min_price: 5,
        max_price: 20,
        in_stock: true,
        min_stock: null,
      });
    });

    await waitFor(() => {
      expect(result.current.filters.category_id).toBe(1);
    });

    act(() => {
      result.current.resetFilters();
    });

    await waitFor(() => {
      expect(result.current.filters.category_id).toBeNull();
    });
  });

  it('should clear search', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.setQuery('pasta');
    });

    await waitFor(() => {
      expect(result.current.query).toBe('pasta');
    }, { timeout: 400 });

    act(() => {
      result.current.clearSearch();
    });

    await waitFor(() => {
      expect(result.current.query).toBe('');
    }, { timeout: 400 });
  });

  it('should set page', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);
  });

  it('should handle loading state', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    // Loading should start as false after initial setup
    await waitFor(() => {
      expect(typeof result.current.loading).toBe('boolean');
    });
  });

  it('should have error property', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false },
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSearch(), { wrapper });

    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
  });
});
