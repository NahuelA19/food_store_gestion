# Spec: Search UI Components

## Component Overview

Search UI is built with modular, reusable React components following functional component patterns.

---

## 1. SearchBar Component

### Location
`frontend/src/components/SearchBar.tsx`

### Purpose
Text input with debounced search, clear button, and loading spinner.

### Props

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}
```

### Behavior

1. **User types in input**
   - onChange fires immediately
   - Debounced callback (300ms) updates parent state
   - URL updates automatically (via parent hook)

2. **Clear button**
   - Visible only when `value.length > 0`
   - onClick clears input and resets to page 1
   - Calls `onClear()` callback

3. **Loading spinner**
   - Shows when `isLoading=true`
   - Indicates results are being fetched
   - Spinner icon in right side of input

4. **Focus management**
   - Optionally auto-focus on mount (`autoFocus=true`)
   - Keyboard: Enter key could trigger search (optional enhancement)

### UI Structure

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Type to search...]                    ✕    ⟳      │
└─────────────────────────────────────────────────────────┘

🔍 = Search icon
✕ = Clear button (only when value.length > 0)
⟳ = Loading spinner (only when isLoading=true)
```

### Implementation Details

```typescript
import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash.debounce';

export function SearchBar({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = "Search products...",
  autoFocus = true,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce the onChange callback
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 300),
    [onChange]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  }

  function handleClear() {
    setLocalValue("");
    onClear();
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="search-input"
      />
      {localValue && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="clear-btn"
        >
          ✕
        </button>
      )}
      {isLoading && <span className="spinner" />}
    </div>
  );
}
```

### CSS (Tailwind or custom)

```css
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #999;
}

.clear-btn:hover {
  color: #333;
}

.spinner {
  position: absolute;
  right: 0.5rem;
  width: 1rem;
  height: 1rem;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Usage Example

```typescript
const [query, setQuery] = useState("");

return (
  <SearchBar
    value={query}
    onChange={(newQuery) => setQuery(newQuery)}
    onClear={() => setQuery("")}
    isLoading={loading}
  />
);
```

---

## 2. FilterPanel Component

### Location
`frontend/src/components/FilterPanel.tsx`

### Purpose
Collapsible panel with category, price, availability, and stock filters.

### Props

```typescript
interface Filters {
  category_id: number | null;
  min_price: number | null;
  max_price: number | null;
  in_stock: boolean | null;
  min_stock: number | null;
}

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  categories: Category[];
  isLoading?: boolean;
}
```

### Behavior

1. **Category dropdown**
   - Loads from `categories` prop
   - Single select (initial MVP)
   - "All Categories" option for no filter

2. **Price range inputs**
   - Min and Max number inputs
   - Step 0.01 (cents)
   - Validates `min <= max` on apply
   - Shows error if validation fails

3. **Availability toggle**
   - Checkbox: "In Stock Only"
   - Unchecked = no filter
   - Checked = `is_available = true`

4. **Stock quantity input**
   - Min stock threshold
   - Only products with stock >= this value

5. **Apply / Reset buttons**
   - Apply: Calls `onFilterChange()` with updated filters
   - Reset: Calls `onReset()` to clear all filters

6. **Collapsible (optional)**
   - Expand/collapse for mobile UX
   - Default: expanded on desktop, collapsed on mobile

### UI Structure

```
┌─────────────────────────────────────┐
│ FILTERS  ▼ (Collapse button)         │
├─────────────────────────────────────┤
│                                     │
│ Category:                           │
│ [All Categories ▼]                  │
│                                     │
│ Price Range:                        │
│ [Min $] — [Max $]                   │
│                                     │
│ Availability:                       │
│ ☐ In Stock Only                     │
│                                     │
│ Minimum Stock:                      │
│ [Min Stock #]                       │
│                                     │
│ [Apply Filters]  [Reset]            │
│                                     │
└─────────────────────────────────────┘
```

### Implementation Details

```typescript
import { useState } from 'react';

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  categories,
  isLoading = false,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [errors, setErrors] = useState<string[]>([]);

  function handleFilterChange<K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    // Validate
    const newErrors: string[] = [];
    
    if (
      localFilters.min_price !== null &&
      localFilters.max_price !== null &&
      localFilters.min_price > localFilters.max_price
    ) {
      newErrors.push("Min price must be <= max price");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onFilterChange(localFilters);
  }

  function handleReset() {
    setLocalFilters({
      category_id: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      min_stock: null,
    });
    onReset();
  }

  return (
    <div className="filter-panel">
      <h3 className="filter-title">Filters</h3>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((err, i) => (
            <p key={i} className="error">{err}</p>
          ))}
        </div>
      )}

      <div className="filter-group">
        <label>Category</label>
        <select
          value={localFilters.category_id || ""}
          onChange={e => handleFilterChange("category_id", e.target.value ? parseInt(e.target.value) : null)}
          disabled={isLoading}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Price Range</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.min_price || ""}
            onChange={e => handleFilterChange("min_price", e.target.value ? parseFloat(e.target.value) : null)}
            step="0.01"
            min="0"
            disabled={isLoading}
          />
          <span> — </span>
          <input
            type="number"
            placeholder="Max"
            value={localFilters.max_price || ""}
            onChange={e => handleFilterChange("max_price", e.target.value ? parseFloat(e.target.value) : null)}
            step="0.01"
            min="0"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={localFilters.in_stock === true}
            onChange={e => handleFilterChange("in_stock", e.target.checked ? true : null)}
            disabled={isLoading}
          />
          In Stock Only
        </label>
      </div>

      <div className="filter-group">
        <label>Minimum Stock</label>
        <input
          type="number"
          placeholder="Any"
          value={localFilters.min_stock || ""}
          onChange={e => handleFilterChange("min_stock", e.target.value ? parseInt(e.target.value) : null)}
          min="1"
          disabled={isLoading}
        />
      </div>

      <div className="filter-actions">
        <button onClick={handleApply} disabled={isLoading} className="btn-primary">
          Apply Filters
        </button>
        <button onClick={handleReset} disabled={isLoading} className="btn-secondary">
          Reset
        </button>
      </div>
    </div>
  );
}
```

### CSS

```css
.filter-panel {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background: #f9f9f9;
}

.filter-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: bold;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.filter-group select,
.filter-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.price-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.price-inputs input {
  flex: 1;
}

.error-messages {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #ddd;
  color: #333;
}

.btn-secondary:hover {
  background: #ccc;
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 3. SearchResults Component

### Location
`frontend/src/components/SearchResults.tsx` (or part of ProductsPage)

### Purpose
Display paginated search results with empty state handling.

### Props

```typescript
interface SearchResultsProps {
  items: Product[];
  pagination: PaginationInfo;
  loading: boolean;
  error?: string;
  onPageChange: (page: number) => void;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}
```

### Behavior

1. **Loading state**
   - Show skeleton loaders for each card
   - Spinner + "Loading..." text

2. **Error state**
   - Display error message
   - "Something went wrong. Please try again."

3. **Empty results**
   - Show "No products found"
   - Suggest clearing filters

4. **Results grid**
   - Render ProductCard for each item
   - Responsive grid (3 cols desktop, 2 cols tablet, 1 col mobile)

5. **Pagination controls**
   - "Previous" and "Next" buttons
   - Page number indicator: "Page 2 of 5"
   - Quick jump to page (optional: dropdown or buttons 1-5)

### UI Structure

```
┌─────────────────────────────────────────────────────────┐
│ Results (Loading...)                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│ │  Card    │  │  Card    │  │  Card    │              │
│ │ [loading]│  │ [loading]│  │ [loading]│              │
│ └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Previous]  Page 2 of 5  [Next]                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

```typescript
export function SearchResults({
  items,
  pagination,
  loading,
  error,
  onPageChange,
}: SearchResultsProps) {
  if (error) {
    return (
      <div className="search-error">
        <p>⚠️ {error}</p>
        <p className="text-muted">Please try again or contact support.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-container">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="product-card skeleton" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="no-results">
        <p>No products found.</p>
        <p className="text-muted">Try clearing your filters or searching for something else.</p>
      </div>
    );
  }

  return (
    <div className="results-section">
      <div className="results-count">
        Showing {items.length} of {pagination.total} products
      </div>

      <div className="results-grid">
        {items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.has_previous}
        >
          ← Previous
        </button>

        <span className="page-info">
          Page {pagination.page} of {pagination.total_pages}
        </span>

        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.has_next}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
```

---

## 4. useSearch Hook

### Location
`frontend/src/hooks/useSearch.ts`

### Purpose
Manage search state, sync with URL params, fetch results from backend.

### Interface

```typescript
interface UseSearchReturn {
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

function useSearch(): UseSearchReturn
```

### Behavior

1. **Initialization**
   - Read URL query params on mount
   - Populate state from URL
   - Fetch initial results

2. **URL synchronization**
   - Whenever state changes, update URL params
   - Debounce updates to avoid excessive URL changes
   - Persist filters across page reloads

3. **Backend fetch**
   - Call `GET /api/v1/products/search` with query/filters/page
   - Handle loading, error, success states
   - Parse response into `items` and `pagination`

4. **Category loading**
   - Fetch categories on mount (needed by FilterPanel)
   - Cache in hook state

### Implementation Details

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import debounce from 'lodash.debounce';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function useSearch(): UseSearchReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<Filters>(parseFiltersFromUrl(searchParams));
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  
  const [items, setItems] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false });
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
    if (filters.min_price) params.set('min_price', filters.min_price.toString());
    if (filters.max_price) params.set('max_price', filters.max_price.toString());
    if (filters.in_stock !== null) params.set('in_stock', filters.in_stock.toString());
    if (filters.min_stock) params.set('min_stock', filters.min_stock.toString());
    params.set('page', page.toString());

    setSearchParams(params);
  }, [query, filters, page, setSearchParams]);

  // Fetch results whenever query/filters/page change
  useEffect(() => {
    fetchResults();
  }, [query, filters, page]);

  async function fetchResults() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (filters.category_id) params.set('category_id', filters.category_id.toString());
      if (filters.min_price) params.set('min_price', filters.min_price.toString());
      if (filters.max_price) params.set('max_price', filters.max_price.toString());
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
  }

  function handleSetQuery(newQuery: string) {
    setQuery(newQuery);
    setPage(1); // Reset to page 1 on new search
  }

  function handleSetFilters(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  }

  function handleResetFilters() {
    setFilters({
      category_id: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      min_stock: null,
    });
    setPage(1);
  }

  function handleClearSearch() {
    setQuery('');
    setPage(1);
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
    setQuery: handleSetQuery,
    setFilters: handleSetFilters,
    setPage,
    resetFilters: handleResetFilters,
    clearSearch: handleClearSearch,
  };
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
```

---

## Integration: ProductsPage

```typescript
export function ProductsPage() {
  const {
    query,
    filters,
    page,
    items,
    pagination,
    loading,
    error,
    categories,
    setQuery,
    setFilters,
    setPage,
    resetFilters,
    clearSearch,
  } = useSearch();

  return (
    <div className="products-page">
      <h1>Products</h1>

      <div className="search-section">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          isLoading={loading}
        />
      </div>

      <div className="content">
        <aside className="sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
            categories={categories}
            isLoading={loading}
          />
        </aside>

        <main className="results">
          <SearchResults
            items={items}
            pagination={pagination}
            loading={loading}
            error={error}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}
```

