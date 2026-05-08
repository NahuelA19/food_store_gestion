# Change 6: Build Search and Filtering — Proposal

## What

Implement full-text search and advanced filtering for products to enable users to efficiently find items in the Food Store catalog. This includes:

- **Full-text search** on product names and descriptions using PostgreSQL FTS5
- **Advanced filtering** by price range, category, availability, and stock levels
- **Search UI** with a debounced search bar and collapsible filter panel
- **URL-synchronized state** so users can share filtered search results
- **Optimized queries** with proper database indexing to maintain sub-200ms response times
- **Pagination and sorting** (by name, price, created date)

## Why

E-commerce platforms live and die by discovery. Users need to:

1. **Find products quickly** — searching for "organic pasta" shouldn't require scrolling through 500 items
2. **Filter intelligently** — combine criteria (price range + category + in stock) to narrow results
3. **Share results** — copy a link with filters applied so friends see the same curated list
4. **Browse intuitively** — sort by relevance, price, or newest without page reloads

Search is the second most-used feature in e-commerce after "add to cart." Without it, conversion rates drop significantly.

Change 5 (create-product-service) provides the product CRUD foundation. Change 6 builds the **discovery layer** on top.

## Goals

- ✅ Sub-200ms search query response time (measured with EXPLAIN ANALYZE)
- ✅ Zero N+1 query problems (all related data loaded in single query)
- ✅ Support filtering by: price range, category, availability, stock quantity
- ✅ Full-text search on product name + description combined
- ✅ URL query params sync: `?q=pasta&category=1&min_price=2.50&max_price=10.00`
- ✅ Debounced search (300ms) to avoid overwhelming the backend
- ✅ Frontend: SearchBar + FilterPanel + Results display (React components)
- ✅ 100+ products searchable without performance degradation
- ✅ Filter combinations work correctly (AND logic: all filters must match)
- ✅ Empty result states handled gracefully (users see "No results found")

## Non-Goals

- **Recommendation engine** — "you might like..." suggestions (future change)
- **AI-powered search** — semantic similarity or NLP-based matching (future change)
- **Faceted search** — automatic aggregations like "10 products in Produce, 3 in Dairy" (future change)
- **Search analytics** — tracking what users search for (future change)
- **Autocomplete/typeahead** — dropdown suggestions as users type (future change, depends on this)

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search response time (p99) | < 200ms | EXPLAIN ANALYZE on test queries with 100+ products |
| N+1 query freedom | Zero | Code review + test coverage |
| Searchable products | 100+ | Seed database with test data |
| Filter combinations | 4+ | Unit tests per filter type |
| URL sync accuracy | 100% | Integration tests for state → URL → state |
| User experience | No lag | Debouncing prevents > 1 request per 300ms |

## Technical Approach

### Backend (FastAPI + PostgreSQL)

1. **Database**: Add FTS5 (full-text search) index on products(name, description)
   - Index type: `GIN` for fast text matching
   - Trigger: Automatically updated when product name/description changes

2. **API Endpoint**: `GET /api/v1/products/search`
   - Query params: `q`, `category_id`, `min_price`, `max_price`, `in_stock`, `page`, `limit`, `sort_by`, `order`
   - Response: Paginated list with total count, current page, has_next, etc.
   - Uses `selectinload()` to eagerly load category + inventory (prevents N+1)

3. **Filter Builder**: Composable filter logic (not if-else spaghetti)
   - Builds WHERE clauses dynamically based on provided filters
   - Validates price ranges, category IDs, etc.

### Frontend (React + TypeScript)

1. **SearchBar Component** (`frontend/src/components/SearchBar.tsx`)
   - Text input with debouncing (300ms)
   - Clear button, search icon
   - Emits `onSearch` event with query string

2. **FilterPanel Component** (`frontend/src/components/FilterPanel.tsx`)
   - Category dropdown (multi-select or single-select)
   - Price range slider (min/max inputs or actual slider)
   - Availability toggle (in stock / out of stock)
   - Stock quantity filter (low stock warning)
   - Apply/Reset buttons

3. **Search Hook** (`frontend/src/hooks/useSearch.ts`)
   - Manages search query, filters, pagination state
   - Syncs with URL query params (useState + useSearchParams)
   - Calls backend search endpoint on state change
   - Handles loading/error states

4. **Results Display** (`frontend/src/pages/ProductsPage.tsx`)
   - Renders ProductCard for each result
   - Pagination controls (prev/next buttons or page numbers)
   - "No results" message
   - Loading skeleton during fetch

## Dependency Chain

- **Depends on**: Change 5 (create-product-service)
  - Uses existing Product/Category/Inventory ORM models
  - Uses existing ProductResponse schemas
  - Builds on existing product list endpoint as baseline

- **Enables**: Future changes
  - Autocomplete/typeahead (uses search index)
  - Recommendations (uses search history)
  - Advanced sorting (by relevance, trending, sales)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| FTS5 index bloats database | Storage cost | Regular VACUUM ANALYZE; monitor index size |
| Search query slow with 10k+ products | P99 > 200ms | Proper GIN index; EXPLAIN ANALYZE in tests |
| Filter combos create complex WHERE clauses | Bugs in filter logic | Unit tests per filter type; integration tests |
| URL params overflow with many filters | UX clutter | Compress filter state or use hash-based routing (Phase 3) |
| Stale filters after product updates | Incorrect results | Tests verify search results sync after product edits |

## Open Questions

1. **Should we support filter reset to bookmark URL?** Yes, add a "Clear filters" button that clears URL params.
2. **Should search be real-time (on every keystroke) or on submit?** Real-time with debouncing (300ms) — better UX.
3. **Should we index product ratings if available?** Out of scope for Change 6; skip for now.
4. **How do we handle typos (e.g., "spagetti" → "spaghetti")?** Out of scope; PostgreSQL ILIKE is enough for MVP.

## Files Changed / Created

### Backend
- `backend/app/models/product.py` — Add FTS5 index columns
- `backend/app/routes/search.py` — New search endpoint (separate from products.py)
- `backend/app/schemas/search.py` — SearchParams, SearchResponse schemas
- `backend/tests/test_search.py` — Search endpoint tests
- `backend/tests/test_filters.py` — Filter logic tests
- `backend/alembic/versions/` — Migration to add FTS5 index

### Frontend
- `frontend/src/components/SearchBar.tsx` — Search input with debounce
- `frontend/src/components/FilterPanel.tsx` — Filter controls
- `frontend/src/hooks/useSearch.ts` — Search state management + URL sync
- `frontend/src/pages/ProductsPage.tsx` — Integrate search + filters
- `frontend/src/__tests__/search.test.ts` — Search hook tests
- `frontend/src/__tests__/FilterPanel.test.tsx` — Filter component tests

### Documentation
- `openspec/changes/build-search-and-filtering/proposal.md` — This file
- `openspec/changes/build-search-and-filtering/design.md` — Architecture details
- `openspec/changes/build-search-and-filtering/specs/search-backend-api.md` — API spec
- `openspec/changes/build-search-and-filtering/specs/filtering-logic.md` — Filter spec
- `openspec/changes/build-search-and-filtering/specs/search-ui-components.md` — Component spec
- `openspec/changes/build-search-and-filtering/tasks.md` — Task breakdown

---

**Estimated Effort**: 40–50 hours (5–6 dev days)  
**Change Owner**: TBD  
**Review Period**: 3 days (after implementation)
