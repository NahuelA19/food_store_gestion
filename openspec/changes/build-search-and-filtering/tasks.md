# Change 6: Build Search and Filtering — Implementation Tasks

**Total Estimated Effort**: 40–50 hours (5–6 dev days)  
**Estimated Task Count**: ~110 tasks  
**Complexity**: Medium–High

---

## Section 1: Database Setup & FTS Index (5–6 hours)

Setup PostgreSQL full-text search infrastructure.

- [x] Create Alembic migration file: `alembic/versions/006_add_fts_index.py`
- [x] Add `search_vector` column (tsvector) to products table
- [x] Create migration to populate `search_vector` for existing products
- [x] Create GIN index on `search_vector` for fast text matching
- [x] Create trigger `products_search_vector_update` for auto-updates
- [x] Test migration locally: `alembic upgrade head`
- [x] Verify GIN index was created: `\d products` in psql
- [x] Run VACUUM ANALYZE on products table
- [x] Test EXPLAIN ANALYZE on sample FTS query (should be < 100ms plan)

---

## Section 2: Database Indexes Verification (4–5 hours)

Ensure all required indexes exist for filtering performance.

- [x] Verify B-tree index on `products.category_id`
- [x] Verify B-tree index on `products.price`
- [x] Verify B-tree index on `products.is_available`
- [x] Verify B-tree index on `inventory.product_id`
- [x] Verify B-tree index on `inventory.stock_quantity`
- [x] Run EXPLAIN ANALYZE on sample filter queries (< 50ms each)
- [x] Document index strategy in `backend/docs/indexing.md`
- [x] Add index monitoring script (optional: `scripts/check_indexes.py`)

---

## Section 3: Backend Search Endpoint (8–10 hours)

Implement `GET /api/v1/products/search` with full-text search and filtering.

- [x] Create `backend/app/schemas/search.py` with SearchParams and SearchResponse models
- [x] Define SearchParams dataclass with all query params: q, category_id, min_price, max_price, in_stock, min_stock, page, limit, sort_by, order
- [x] Define PaginationInfo schema (total, page, limit, total_pages, has_next, has_previous)
- [x] Define SearchResponse schema (items: list[ProductDetailResponse], pagination: PaginationInfo)
- [x] Create `backend/app/routes/search.py` with search router
- [x] Implement FTS query building: `Product.search_vector.match(plainto_tsquery())`
- [x] Implement category_id filter logic
- [x] Implement price range filter (min_price, max_price)
- [x] Implement availability filter (is_available)
- [x] Implement stock quantity filter (inventory.stock_quantity >= min_stock)
- [x] Implement AND logic to combine filters (use `and_(*filters)`)
- [x] Implement sorting by name, price, created_at
- [x] Implement relevance sorting using ts_rank() when searching
- [x] Implement pagination with offset/limit
- [x] Use `selectinload()` to prevent N+1 queries (load category + inventory)
- [x] Add validation: min_price <= max_price
- [x] Add validation: category_id must exist (query DB)
- [x] Add validation: limit must be 1–100
- [x] Add validation: page must be >= 1
- [x] Handle empty results gracefully (return empty items array)
- [x] Handle malformed FTS queries (plainto_tsquery handles automatically)
- [x] Register search router in `backend/app/main.py`: `app.include_router(search_router, prefix="/api/v1")`
- [x] Test endpoint manually with curl or Swagger UI
- [x] Verify response schema matches spec (items, pagination, all fields)

---

## Section 4: Filter Query Builder & Utilities (8–10 hours)

Extract and test filter logic separately for maintainability.

- [x] Create `backend/app/services/search_service.py` with filter builder functions
- [x] Implement `build_filter_clauses()` function that returns list of WHERE conditions
- [x] Implement `validate_search_params()` function with all validations
- [x] Implement `build_sort_order()` function to handle sort_by and order params
- [x] Implement `calculate_pagination_info()` helper function
- [x] Add docstrings with examples to all utility functions
- [x] Test each filter type in isolation (unit tests for build_filter_clauses)
- [x] Test filter combinations (AND logic with multiple filters)
- [x] Test edge cases: empty filters, null values, zero values
- [x] Verify filter performance with EXPLAIN ANALYZE (each filter < 50ms)
- [x] Add logging for slow queries (log if query > 200ms)

---

## Section 5: Advanced Filters Implementation (8–10 hours)

Implement category, price, stock, and availability filters in UI.

- [x] Create FilterPanel component: `frontend/src/components/FilterPanel.tsx`
- [x] Add CategoryFilter sub-component with dropdown (load from categories API)
- [x] Add PriceRangeFilter sub-component with min/max inputs
- [x] Add AvailabilityFilter sub-component with checkbox
- [x] Add StockQuantityFilter sub-component with number input
- [x] Implement filter state management (useState for each filter)
- [x] Implement validation logic: min_price <= max_price
- [x] Show validation errors to user when applying invalid filters
- [x] Implement Apply button: calls `onFilterChange()` with validated filters
- [x] Implement Reset button: calls `onReset()` to clear all filters
- [x] Add CSS styling for FilterPanel (responsive layout)
- [x] Add placeholder text and labels for all inputs
- [x] Add disabled state when loading (prop: isLoading)
- [x] Test all filters in isolation (unit tests)
- [x] Test filter interactions (changing one filter doesn't affect others)
- [x] Test Apply/Reset button functionality

---

## Section 6: Search Pagination & Sorting (6–8 hours)

Implement pagination controls and sorting options.

- [x] Implement pagination buttons in SearchResults component (Previous/Next)
- [x] Display current page info: "Page 2 of 5"
- [x] Disable Previous button when on page 1
- [x] Disable Next button when on last page
- [x] Implement page change handler: `onPageChange(pageNumber)`
- [x] Implement sort dropdown with options: relevance, name, price, created_at
- [x] Implement order toggle: asc/desc
- [x] Update URL params when sort_by or order changes
- [x] Verify sorting works with filters (e.g., sort by price within category)
- [x] Verify sorting works with search (e.g., relevance ranking with ts_rank)
- [x] Test pagination with different limit values (10, 20, 50)
- [x] Test edge case: page number out of range (redirect to page 1)
- [x] Add loading skeleton for pagination controls
- [x] Verify pagination state persists in URL

---

## Section 7: Backend Performance Optimization (6–8 hours)

Ensure search queries meet < 200ms performance target.

- [x] Run EXPLAIN ANALYZE on all search query variations
- [x] Benchmark FTS query: `search_vector @@ plainto_tsquery()` (target: < 50ms)
- [x] Benchmark filter query: category + price (target: < 50ms)
- [x] Benchmark complex query: FTS + category + price + availability (target: < 150ms)
- [x] Verify N+1 prevention: ensure only 3 queries executed (products, category, inventory)
- [x] Test with 100+ products in database
- [x] Test with 1000+ products in database
- [x] Profile slow queries with Django Debug Toolbar or similar (if available)
- [x] Add caching for category list (endpoint: `GET /api/v1/categories`)
- [x] Document performance findings in `backend/docs/search_performance.md`
- [x] Set up monitoring alerts for slow queries (future: > 500ms)

---

## Section 8: Backend Unit Tests for Search (10–12 hours)

Test search endpoint with various scenarios.

- [x] Create `backend/tests/test_search.py` test file
- [x] Create fixtures: `db_session`, `sample_products`, `sample_categories`
- [x] Test FTS search with single keyword: "pasta"
- [x] Test FTS search with multiple keywords: "organic pasta"
- [x] Test FTS search with partial word (e.g., "spag" → no results, as expected)
- [x] Test FTS search with special chars (|, &, !, parens) → stripped automatically
- [x] Test FTS search with empty query: q=""
- [x] Test FTS search with very long query (> 500 chars) → 400 Bad Request
- [x] Test search with no results (verify empty items array)
- [x] Test search with exact match (e.g., product name "Pasta")
- [x] Test case-insensitive search ("PASTA" finds "pasta")
- [x] Test partial word matching (e.g., "past" matches "pasta" if using word search)
- [x] Test category filter: category_id=3
- [x] Test category filter with non-existent ID: category_id=999 → 400 Bad Request
- [x] Test price range: min_price=2.50, max_price=10.00
- [x] Test price range edge case: min_price=10.00, max_price=2.50 → 400 Bad Request
- [x] Test availability filter: in_stock=true
- [x] Test availability filter: in_stock=false
- [x] Test stock quantity filter: min_stock=5
- [x] Test combined filters: category + price + availability + stock
- [x] Test pagination: page=1, limit=20
- [x] Test pagination: page=2, limit=20
- [x] Test pagination: page=999 (out of range) → empty results
- [x] Test limit validation: limit=0 → 400 Bad Request
- [x] Test limit validation: limit=101 → 400 Bad Request
- [x] Test sort by name: sort_by=name, order=asc
- [x] Test sort by price: sort_by=price, order=desc
- [x] Test sort by relevance: sort_by=relevance (with search query)
- [x] Test sort by created_at: sort_by=created_at
- [x] Test N+1 prevention: verify total DB queries == 3 (or less)
- [x] Test response schema: verify all fields present (items, pagination, etc.)
- [x] Test pagination info: total, page, limit, total_pages, has_next, has_previous

---

## Section 9: Backend Unit Tests for Filters (10–12 hours)

Test filter logic in isolation.

- [x] Create `backend/tests/test_filters.py` test file
- [x] Create fixtures: `db_session`, `sample_products`, `sample_inventory`
- [x] Test filter_by_category: single category
- [x] Test filter_by_price_range: min and max
- [x] Test filter_by_price_range: only min
- [x] Test filter_by_price_range: only max
- [x] Test filter_by_price_range: invalid range (min > max)
- [x] Test filter_by_availability: true
- [x] Test filter_by_availability: false
- [x] Test filter_by_stock: min_stock=5
- [x] Test filter_by_stock: min_stock=0 (treat as null)
- [x] Test filter combinations: category + price
- [x] Test filter combinations: category + price + availability
- [x] Test filter combinations: all four filters
- [x] Test edge case: no filters → all products returned
- [x] Test edge case: all filters set very strict → empty results
- [x] Test performance: each filter query < 50ms
- [x] Test performance: combined filters < 150ms
- [x] Test error handling: invalid category_id
- [x] Test error handling: non-numeric price
- [x] Test validation: min_price and max_price are decimals
- [x] Test validation: page is positive integer
- [x] Test validation: limit is positive integer

---

## Section 10: Frontend SearchBar Component (6–8 hours)

Build search input with debouncing.

- [x] Create `frontend/src/components/SearchBar.tsx` component
- [x] Add text input field with placeholder "Search products..."
- [x] Implement onChange handler with local state (immediate update)
- [x] Implement debounced onChange callback (300ms delay)
- [x] Import debounce utility from lodash or custom implementation
- [x] Add clear (✕) button (visible only when value.length > 0)
- [x] Implement clear button onClick: clear input and call onClear()
- [x] Add loading spinner (visible only when isLoading=true)
- [x] Add search icon (🔍) as visual indicator
- [x] Add CSS styling: input field, clear button, spinner animation
- [x] Implement autoFocus prop (optional, default true)
- [x] Implement placeholder prop (optional, default "Search products...")
- [x] Test debouncing: verify onChange fires only once after 300ms
- [x] Test clear button: verify input clears and onClear() is called
- [x] Test loading spinner: verify it shows/hides correctly
- [x] Test accessibility: proper labels and aria-labels
- [x] Test keyboard: Enter key behavior (optional enhancement)
- [x] Add TypeScript types for all props

---

## Section 11: Frontend FilterPanel Component (8–10 hours)

Build filter controls with validation.

- [x] Create `frontend/src/components/FilterPanel.tsx` component
- [x] Import category data from prop (categories: Category[])
- [x] Implement Category dropdown (single-select)
- [x] Add "All Categories" default option
- [x] Implement PriceRange inputs (min and max)
- [x] Add step="0.01" and min="0" attributes
- [x] Implement Availability checkbox: "In Stock Only"
- [x] Implement StockQuantity input: "Minimum Stock"
- [x] Implement Apply button: calls onFilterChange() with current filters
- [x] Implement Reset button: calls onReset()
- [x] Add local state for filters (useState)
- [x] Add validation: min_price <= max_price
- [x] Display validation errors to user (if any)
- [x] Disable all inputs when isLoading=true
- [x] Add CSS styling: responsive layout, inputs, buttons
- [x] Add error message display area
- [x] Test category selection: verify value updates
- [x] Test price inputs: verify values update
- [x] Test availability checkbox: verify toggle
- [x] Test stock input: verify value updates
- [x] Test Apply button: verify onFilterChange() called with correct filters
- [x] Test Reset button: verify onReset() called
- [x] Test validation error display: min_price > max_price
- [x] Test disabled state: all inputs disabled while loading

---

## Section 12: Frontend Search Results Display (6–8 hours)

Implement results grid and empty state handling.

- [x] Create or update `frontend/src/components/SearchResults.tsx`
- [x] Implement loading state: show skeleton loaders for ProductCard
- [x] Implement error state: display error message
- [x] Implement empty state: "No products found" message
- [x] Render ProductGrid with ProductCard components
- [x] Add "Results count" label: "Showing X of Y products"
- [x] Implement pagination controls: Previous / Next buttons
- [x] Display page info: "Page X of Y"
- [x] Disable Previous button on page 1
- [x] Disable Next button on last page
- [x] Implement onPageChange callback for pagination
- [x] Add CSS styling: responsive grid (3 cols desktop, 2 tablet, 1 mobile)
- [x] Add CSS styling: pagination controls
- [x] Test loading state: skeleton shows while fetching
- [x] Test error state: error message displays
- [x] Test empty state: message displays when items.length === 0
- [x] Test pagination: Previous/Next buttons enabled/disabled correctly
- [x] Test ProductCard rendering: verify each item is displayed
- [x] Add accessibility: proper button labels and semantic HTML

---

## Section 13: Frontend URL Synchronization (6–8 hours)

Sync filter state with URL query params.

- [x] Create `frontend/src/hooks/useSearch.ts` custom hook
- [x] Import useSearchParams from react-router-dom
- [x] Read query params on component mount
- [x] Parse q, category_id, min_price, max_price, in_stock, min_stock, page from URL
- [x] Initialize state from URL params (fallback to defaults)
- [x] Implement useEffect to sync state → URL whenever state changes
- [x] Build URLSearchParams from current state
- [x] Call setSearchParams() to update browser URL
- [x] Test backward navigation: browser back button restores filters
- [x] Test forward navigation: browser forward button restores filters
- [x] Test URL sharing: copy URL with filters → paste in new tab → same filters applied
- [x] Test URL encoding: special chars in search query are properly encoded
- [x] Test URL params: verify all filter types in URL
- [x] Add debouncing to URL updates (optional: prevent excessive URL changes)
- [x] Verify page is reset to 1 when query/filters change
- [x] Test pagination persistence: page number in URL

---

## Section 14: Frontend Search & Filter Hooks (6–8 hours)

Implement search state management and API calls.

- [x] Extend `useSearch.ts` hook
- [x] Implement useState for: query, filters, page, items, pagination, loading, error, categories
- [x] Implement useEffect to fetch categories on mount
- [x] Implement fetchCategories() async function
- [x] Implement useEffect to fetch results when query/filters/page change
- [x] Implement fetchResults() async function: calls `GET /api/v1/products/search`
- [x] Handle loading state: setLoading(true/false)
- [x] Handle error state: catch exceptions and display to user
- [x] Parse API response: extract items and pagination
- [x] Implement setQuery() handler: resets page to 1
- [x] Implement setFilters() handler: resets page to 1
- [x] Implement setPage() handler: fetches new page results
- [x] Implement resetFilters() handler: clears all filters and page
- [x] Implement clearSearch() handler: clears search query
- [x] Test hook: verify state updates correctly
- [x] Test hook: verify URL syncs correctly
- [x] Test hook: verify API calls are made
- [x] Test hook: verify loading state changes
- [x] Test hook: verify error handling
- [x] Test hook: verify categories are loaded
- [x] Mock API in tests to avoid real HTTP calls

---

## Section 15: Frontend Component Testing (8–10 hours)

Unit and integration tests for React components.

- [x] Create `frontend/src/__tests__/SearchBar.test.tsx`
- [x] Test SearchBar: value prop updates correctly
- [x] Test SearchBar: onChange callback debounces (300ms)
- [x] Test SearchBar: clear button clears input
- [x] Test SearchBar: loading spinner shows/hides
- [x] Create `frontend/src/__tests__/FilterPanel.test.tsx`
- [x] Test FilterPanel: category dropdown changes
- [x] Test FilterPanel: price inputs change
- [x] Test FilterPanel: availability checkbox toggles
- [x] Test FilterPanel: stock input changes
- [x] Test FilterPanel: Apply button calls onFilterChange
- [x] Test FilterPanel: Reset button calls onReset
- [x] Test FilterPanel: validation error displays (min > max)
- [x] Create `frontend/src/__tests__/SearchResults.test.tsx`
- [x] Test SearchResults: loading skeleton shows
- [x] Test SearchResults: error message displays
- [x] Test SearchResults: empty state displays
- [x] Test SearchResults: ProductCard renders for each item
- [x] Test SearchResults: pagination buttons work
- [x] Create `frontend/src/__tests__/useSearch.test.ts`
- [x] Test useSearch: initial state from URL
- [x] Test useSearch: state syncs to URL
- [x] Test useSearch: categories load on mount
- [x] Test useSearch: results fetch on query change
- [x] Test useSearch: results fetch on filter change
- [x] Test useSearch: error handling (network error)
- [x] Use Vitest + @testing-library/react for tests
- [x] Mock fetch() API calls with MSW (Mock Service Worker)
- [x] Verify all tests pass: `npm run test --workspace frontend`

---

## Section 16: Frontend Integration & Page Assembly (6–8 hours)

Integrate components into ProductsPage.

- [x] Create or update `frontend/src/pages/ProductsPage.tsx`
- [x] Import useSearch hook
- [x] Import SearchBar, FilterPanel, SearchResults components
- [x] Implement page layout: SearchBar + (FilterPanel | Results)
- [x] Call useSearch() hook to get state and callbacks
- [x] Pass state to SearchBar: value, onChange, onClear, isLoading
- [x] Pass state to FilterPanel: filters, onFilterChange, onReset, categories
- [x] Pass state to SearchResults: items, pagination, loading, error, onPageChange
- [x] Add responsive CSS: grid layout (sidebar + main on desktop, stacked on mobile)
- [x] Add page title and description
- [x] Test ProductsPage: all components render
- [x] Test ProductsPage: user can type in SearchBar
- [x] Test ProductsPage: user can apply filters
- [x] Test ProductsPage: results update correctly
- [x] Test ProductsPage: pagination works
- [x] Test ProductsPage: URL syncs with state
- [x] Test ProductsPage: mobile responsive
- [x] Verify no console errors or warnings

---

## Section 17: Documentation (6–8 hours)

Write comprehensive documentation.

- [x] Create `docs/SEARCH_GUIDE.md`: user-facing guide for search/filtering
- [x] Create `backend/docs/search_api.md`: API documentation (copy from specs)
- [x] Create `backend/docs/search_performance.md`: performance benchmarks and optimization notes
- [x] Create `frontend/docs/search_components.md`: component architecture and usage
- [x] Document FTS limitations and gotchas
- [x] Document filter combinations and AND logic
- [x] Document pagination behavior
- [x] Document URL param format
- [x] Document error codes and responses
- [x] Add examples: curl requests, JavaScript fetch, React usage
- [x] Add troubleshooting section
- [x] Update main `README.md` with search feature mention
- [x] Add API endpoint to Swagger/OpenAPI (if auto-generated)

---

## Section 18: E2E Tests & QA (8–10 hours)

End-to-end testing and quality assurance.

- [x] Create `frontend/src/__tests__/ProductsPage.e2e.test.tsx` (or Cypress/Playwright test)
- [x] Test user flow: load page → see all products
- [x] Test user flow: type search query → see filtered results
- [x] Test user flow: select category filter → see filtered results
- [x] Test user flow: set price range → see filtered results
- [x] Test user flow: combine multiple filters → see filtered results
- [x] Test user flow: pagination → load next page
- [x] Test user flow: clear filters → see all products again
- [x] Test user flow: share URL with filters → load same results in new tab
- [x] Test performance: search response < 200ms (manual timing)
- [x] Test performance: UI doesn't freeze during search
- [x] Test error handling: network error → show error message
- [x] Test error handling: invalid filters → show validation error
- [x] Test error handling: no results → show empty state
- [x] Test accessibility: keyboard navigation (Tab, Enter, Escape)
- [x] Test accessibility: screen reader compatibility
- [x] Test mobile: responsive layout works on small screens
- [x] Test mobile: filters accessible (not hidden off-screen)
- [x] Test mobile: search bar usable with mobile keyboard
- [x] Manual QA: test all browser versions (Chrome, Firefox, Safari, Edge)
- [x] Manual QA: test with slow network (throttle to 3G in DevTools)
- [x] Manual QA: test with 10+ filter combinations
- [x] Performance audit: run Lighthouse, verify no major issues
- [x] Security audit: verify no XSS vulnerabilities in search input

---

## Checklist Summary

**Total Sections**: 18  
**Total Tasks**: ~110  
**Estimated Hours**: 40–50

### Breakdown by Layer

| Layer | Hours | Tasks |
|-------|-------|-------|
| Database | 9–11 | 18 |
| Backend | 26–32 | 48 |
| Frontend | 15–18 | 34 |
| Testing & QA | 8–10 | 18 |
| **Total** | **40–50** | **~110** |

### Dependency Order

1. Database (Section 1–2) → Backend (Section 3–4) → Backend Tests (Section 8–9)
2. Frontend (Section 10–14) → Frontend Tests (Section 15) → Integration (Section 16)
3. Documentation (Section 17) → E2E Tests (Section 18)

---

## Commit Messages (Conventional Commits)

Example commits for each section:

- `feat(database): add FTS5 search index on products`
- `feat(backend): implement product search endpoint with filters`
- `feat(backend): add filter query builder and utilities`
- `test(backend): add unit tests for search endpoint`
- `test(backend): add unit tests for filter logic`
- `feat(frontend): add SearchBar component with debouncing`
- `feat(frontend): add FilterPanel component with validation`
- `feat(frontend): add SearchResults component with pagination`
- `feat(frontend): add useSearch hook for state management`
- `test(frontend): add component tests for search UI`
- `feat(frontend): integrate search into ProductsPage`
- `docs: add search and filtering documentation`
- `test(e2e): add end-to-end tests for search flow`

