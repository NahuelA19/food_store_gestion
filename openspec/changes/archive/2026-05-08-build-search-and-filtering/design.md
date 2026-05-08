# Change 6: Build Search and Filtering — Technical Design

## Overview

This document outlines the architecture, data flow, and implementation strategy for full-text search and filtering in Food Store.

**Key Principle**: Search performance is non-negotiable. Every query must complete in < 200ms.

---

## 1. Database Design

### 1.1 Full-Text Search Index

PostgreSQL provides `tsvector` (text search vector) which is the native way to implement FTS5-like indexing.

**Current Product Table** (from Change 5):
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

**FTS Index Strategy**:
1. Add a `search_vector` column (tsvector type) combining name + description
2. Create a GIN index on `search_vector` for fast text matching
3. Use a trigger to auto-update `search_vector` when name/description change

**SQL Migration** (Alembic):
```python
# alembic/versions/006_add_fts_index.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # 1. Add search_vector column
    op.add_column('products', 
        sa.Column('search_vector', postgresql.TSVECTOR))
    
    # 2. Populate existing rows
    op.execute("""
        UPDATE products 
        SET search_vector = 
            to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
    """)
    
    # 3. Create GIN index (faster for text search than GIST)
    op.execute("""
        CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector)
    """)
    
    # 4. Create trigger to auto-update on INSERT/UPDATE
    op.execute("""
        CREATE TRIGGER products_search_vector_update
        BEFORE INSERT OR UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION 
            tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description)
    """)

def downgrade():
    op.drop_index('idx_products_search_vector')
    op.drop_column('products', 'search_vector')
    op.execute("DROP TRIGGER products_search_vector_update ON products")
```

**Index Performance** (EXPLAIN ANALYZE):
```
-- After migration, a full-text search query should look like:
SELECT * FROM products 
WHERE search_vector @@ plainto_tsquery('english', 'pasta') 
AND is_available = true
LIMIT 20;

-- Expected plan (< 50ms):
--   Bitmap Index Scan on idx_products_search_vector
--   Bitmap Heap Scan on products
--   Filter: (is_available = true)
```

### 1.2 Other Indexes

| Column | Type | Reason |
|--------|------|--------|
| `products.category_id` | B-tree | Foreign key filter |
| `products.price` | B-tree | Range queries (min/max) |
| `products.is_available` | B-tree | Availability filter |
| `inventory.product_id` | B-tree | JOIN to products |
| `inventory.stock_quantity` | B-tree | Stock filter |

All these already exist from Change 5. No new indexes needed.

---

## 2. Backend Architecture

### 2.1 Search Endpoint Design

**Route**: `GET /api/v1/products/search`

**Query Parameters**:
```python
@dataclass
class SearchParams:
    q: str | None = None  # Full-text query (e.g., "organic pasta")
    category_id: int | None = None  # Filter by category
    min_price: Decimal | None = None  # Minimum price
    max_price: Decimal | None = None  # Maximum price
    in_stock: bool | None = None  # Availability filter
    min_stock: int | None = None  # Minimum inventory quantity
    page: int = 1  # Pagination
    limit: int = 20  # Items per page (max 100)
    sort_by: str = "relevance"  # relevance | name | price | created_at
    order: str = "asc"  # asc | desc
```

**Response** (all fields):
```json
{
  "items": [
    {
      "id": 1,
      "name": "Organic Pasta",
      "description": "...",
      "price": "5.99",
      "category_id": 3,
      "category": {
        "id": 3,
        "name": "Grains",
        "description": "..."
      },
      "is_available": true,
      "inventory": {
        "stock_quantity": 50,
        "available_quantity": 50,
        "low_stock_threshold": 10
      },
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-06T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

### 2.2 Filter Query Builder

**Goal**: Build WHERE clause composably, avoiding N+1 queries.

**Implementation** (FastAPI route handler):
```python
# backend/app/routes/search.py

from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

@router.get("/search", response_model=SearchResponse)
async def search_products(
    q: str | None = None,
    category_id: int | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock: bool | None = None,
    min_stock: int | None = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "relevance",
    order: str = "asc",
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """Search and filter products."""
    
    # 1. Build WHERE clause dynamically
    filters = []
    
    # Full-text search
    if q:
        filters.append(
            Product.search_vector.match(
                func.plainto_tsquery('english', q)
            )
        )
    
    # Category filter
    if category_id:
        filters.append(Product.category_id == category_id)
    
    # Price range
    if min_price:
        filters.append(Product.price >= min_price)
    if max_price:
        filters.append(Product.price <= max_price)
    
    # Availability
    if in_stock is not None:
        filters.append(Product.is_available == in_stock)
    
    # Stock quantity (via Inventory join)
    if min_stock:
        filters.append(Inventory.stock_quantity >= min_stock)
    
    # 2. Build main query with eager loading (prevents N+1)
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.inventory),
    )
    
    if filters:
        query = query.where(and_(*filters))
    
    # 3. Count total results
    count_query = select(func.count()).select_from(Product)
    if filters:
        count_query = count_query.where(and_(*filters))
    total = await db.scalar(count_query)
    
    # 4. Apply sorting
    if sort_by == "name":
        query = query.order_by(
            Product.name.asc() if order == "asc" else Product.name.desc()
        )
    elif sort_by == "price":
        query = query.order_by(
            Product.price.asc() if order == "asc" else Product.price.desc()
        )
    elif sort_by == "relevance" and q:
        # Rank by text search relevance (ts_rank)
        query = query.order_by(
            func.ts_rank(
                Product.search_vector,
                func.plainto_tsquery('english', q)
            ).desc()
        )
    else:  # created_at
        query = query.order_by(
            Product.created_at.asc() if order == "asc" else Product.created_at.desc()
        )
    
    # 5. Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # 6. Execute and serialize
    result = await db.execute(query)
    products = result.scalars().all()
    
    return SearchResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        pagination=PaginationInfo(
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit,
            has_next=page < ((total + limit - 1) // limit),
            has_previous=page > 1,
        ),
    )
```

**Key Points**:
- `selectinload()` prevents N+1: loads category + inventory in a single query per relation
- `and_(*filters)` combines filters with AND logic (all must match)
- `plainto_tsquery()` sanitizes user input (prevents FTS syntax injection)
- `ts_rank()` returns relevance score for sorting
- Single database round-trip: one COUNT, one SELECT with eager loading

### 2.3 Error Handling

| Scenario | Response | Status |
|----------|----------|--------|
| Invalid `sort_by` param | Bad request | 400 |
| Invalid `page` (negative) | Bad request | 400 |
| Invalid `limit` (> 100) | Bad request | 400 |
| Invalid price range (min > max) | Bad request | 400 |
| No results found | Empty `items` list | 200 |
| Invalid category_id | Treated as no filter (not an error) | 200 |
| Malformed FTS query | Caught by plainto_tsquery | 200 (empty results) |

---

## 3. Frontend Architecture

### 3.1 Component Structure

```
ProductsPage (container)
├── SearchBar (presentational)
│   └── input[type=text], icon, clear button
├── FilterPanel (presentational)
│   ├── CategoryFilter (multi-select dropdown)
│   ├── PriceRange (min/max inputs)
│   ├── AvailabilityToggle (checkbox)
│   ├── StockFilter (threshold input)
│   └── Apply/Reset buttons
└── SearchResults (presentational)
    ├── ProductGrid (list)
    │   └── ProductCard (presentational) × N
    └── Pagination (controls)
```

**Data Flow**:
1. User types in SearchBar → debounced onChange
2. debounced event updates `useSearch` hook state
3. Hook builds URL query params
4. Hook calls `GET /api/v1/products/search?q=...&category_id=...`
5. Response updates `items` and `pagination` state
6. ProductsPage re-renders with new results

**State Management**:
```typescript
// useSearch hook
const [query, setQuery] = useState("");
const [filters, setFilters] = useState<Filters>({
  category_id: null,
  min_price: null,
  max_price: null,
  in_stock: null,
  min_stock: null,
});
const [page, setPage] = useState(1);
const [items, setItems] = useState<Product[]>([]);
const [pagination, setPagination] = useState<PaginationInfo>({...});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 3.2 URL Synchronization

**Goal**: Filters persist across page reloads. Users can share links with filters applied.

**Implementation** (React Router + URLSearchParams):
```typescript
// frontend/src/hooks/useSearch.ts
import { useSearchParams } from 'react-router-dom';

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // On mount: read URL params into state
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const categoryId = searchParams.get("category_id");
    // ... parse other params
    setQuery(q);
    setFilters({ category_id: categoryId ? parseInt(categoryId) : null, ... });
  }, []);
  
  // On state change: update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.category_id) params.set("category_id", filters.category_id);
    // ... add other filters
    params.set("page", page.toString());
    setSearchParams(params);
  }, [query, filters, page]);
  
  // Fetch when query/filters/page change
  useEffect(() => {
    fetchResults();
  }, [query, filters, page]);
}
```

**URL Example**:
```
/products?q=organic%20pasta&category_id=3&min_price=2.50&max_price=10.00&in_stock=true&page=1
```

### 3.3 Debouncing

**Problem**: Every keystroke triggers a search request → 1000 requests/second → backend crashes.

**Solution**: Debounce search input to 300ms.

```typescript
// inside useSearch hook
const debouncedSearch = useCallback(
  debounce((newQuery: string) => {
    setQuery(newQuery);
    setPage(1); // Reset to page 1 on new search
  }, 300),
  []
);

function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
  debouncedSearch(e.target.value);
}
```

**Timeline**:
- User types "pasta" (1 char) → wait 300ms
- User types "p" → wait 300ms
- User types "a" → wait 300ms
- ...
- User stops typing → after 300ms, ONE request to backend with "pasta"

### 3.4 Component API

**SearchBar**:
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}
```

**FilterPanel**:
```typescript
interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  categories?: Category[];
}
```

**SearchResults**:
```typescript
interface SearchResultsProps {
  items: Product[];
  pagination: PaginationInfo;
  loading: boolean;
  error?: string;
  onPageChange: (page: number) => void;
}
```

---

## 4. Performance Optimization

### 4.1 Database Query Performance

**Target**: < 200ms p99 query time

**Optimizations**:
1. ✅ GIN index on `search_vector` (FTS lookup in O(log n))
2. ✅ B-tree indexes on filter columns (category_id, price, is_available)
3. ✅ `selectinload()` to prevent N+1 (2 queries total: one for products, one for eager relations)
4. ✅ `LIMIT` on result set (never fetch > 100 items, even if user requests)
5. ✅ Column selection (not SELECT *) in future optimizations

**Before optimization** (example):
```
Seq Scan on products (cost=0.00..1500.00)
  Filter: (search_vector @@ plainto_tsquery(...))
  -> 50000 rows scanned
  Time: 2500ms
```

**After optimization** (expected):
```
Bitmap Index Scan on idx_products_search_vector (cost=10.00..50.00)
  Index Cond: (search_vector @@ plainto_tsquery(...))
  -> Bitmap Heap Scan on products (cost=50.00..150.00)
    Filter: (is_available = true)
  Time: 45ms
```

### 4.2 Frontend Performance

1. **Debouncing**: 300ms prevents request flooding
2. **Loading states**: Show spinner while fetching (UX feels faster)
3. **Memoization**: `useMemo()` for expensive filter validations
4. **Lazy pagination**: Don't load all 1000 products at once; use offset/limit

### 4.3 Caching Strategy (Future Phase 3)

Current plan: No caching in Phase 2. Each request hits the database.
Future: Add Redis caching for popular searches (e.g., "pasta" returns same results for 1 hour).

---

## 5. Error Handling & Edge Cases

### 5.1 Empty Results

**Scenario**: User searches for "spaghetti" but no products match.

**Handling**:
- Backend returns 200 OK with empty `items` array
- Frontend displays "No products found. Try different filters."
- Suggests clearing filters: "Showing 0 results. [Clear filters?]"

### 5.2 Malformed Queries

**Scenario**: User types special FTS characters: `"| & ! ( )"` or extremely long strings.

**Handling**:
- `plainto_tsquery('english', q)` strips special chars automatically
- If `q` is > 500 chars, reject with 400 Bad Request
- Log malformed queries for analytics (future)

### 5.3 Invalid Filters

**Scenario**: `min_price=100&max_price=10` (backwards range).

**Handling**:
- Backend validates: `min_price <= max_price`
- If violated, return 400 Bad Request with error message
- Frontend prevents this with form validation

### 5.4 Race Conditions

**Scenario**: User changes filters rapidly. Request #2 arrives after Request #3.

**Handling**:
- React automatically uses latest state (no stale renders)
- Cancel in-flight requests if filters change (use AbortController)
- Display latest results, ignore older responses

---

## 6. Testing Strategy

### Backend Tests

**Search Endpoint** (`backend/tests/test_search.py`):
- ✅ Test FTS query with various keywords
- ✅ Test filter combinations (category + price range + in_stock)
- ✅ Test pagination (page 1, page 2, last page)
- ✅ Test sorting (by name, price, relevance)
- ✅ Test empty results
- ✅ Test malformed queries (special chars, long strings)
- ✅ Test invalid params (min_price > max_price)
- ✅ Test performance with EXPLAIN ANALYZE

**Filter Logic** (`backend/tests/test_filters.py`):
- ✅ Test each filter in isolation
- ✅ Test filter combinations (AND logic)
- ✅ Test edge cases (price = 0, category_id = -1)
- ✅ Test N+1 prevention (count DB queries)

### Frontend Tests

**SearchBar** (`frontend/src/__tests__/SearchBar.test.tsx`):
- ✅ Test onChange event with debounce
- ✅ Test clear button
- ✅ Test loading state spinner

**FilterPanel** (`frontend/src/__tests__/FilterPanel.test.tsx`):
- ✅ Test filter inputs (category, price, stock)
- ✅ Test Apply and Reset buttons
- ✅ Test validation (min_price <= max_price)

**Search Hook** (`frontend/src/__tests__/useSearch.test.ts`):
- ✅ Test URL sync (state → URL → state)
- ✅ Test fetch on filter change
- ✅ Test pagination state

**Integration Test** (`frontend/src/__tests__/ProductsPage.integration.test.tsx`):
- ✅ User types in search bar → results update
- ✅ User selects filter → results update
- ✅ User navigates pages → URL updates
- ✅ User shares URL → same results load

---

## 7. Security Considerations

### 7.1 Input Validation

- ✅ `plainto_tsquery()` prevents FTS injection
- ✅ Query params validated with Pydantic schemas
- ✅ Category IDs checked against database (no fake IDs)
- ✅ Price ranges validated (min <= max)

### 7.2 Rate Limiting

Future (Phase 3): Add rate limiting per IP to prevent search spam.
Current: No rate limiting (rely on debouncing for UX).

### 7.3 Data Exposure

- ✅ Only return products with `is_available = true` (unless explicitly requested)
- ✅ Don't expose internal product IDs in URLs (already avoided)
- ✅ Don't expose database errors to frontend (catch and return 500)

---

## 8. Migration Path

**Phase 1**: Create FTS index (Alembic migration)
**Phase 2**: Implement backend search endpoint (new route)
**Phase 3**: Add frontend components (SearchBar, FilterPanel)
**Phase 4**: Integrate and test end-to-end
**Phase 5**: Deploy and monitor performance

---

## 9. Deployment Checklist

- [ ] Run Alembic migration to add FTS index
- [ ] VACUUM ANALYZE on products table (recalculate statistics)
- [ ] Run EXPLAIN ANALYZE on sample search queries
- [ ] Verify p99 query time < 200ms
- [ ] Deploy backend changes (search endpoint)
- [ ] Deploy frontend changes (SearchBar, FilterPanel)
- [ ] Smoke test: search for "pasta", apply filters, check results
- [ ] Monitor logs for errors over 24 hours
- [ ] A/B test: measure click-through rate on search results

---

**Next Step**: Proceed to detailed specs (search-backend-api.md, filtering-logic.md, search-ui-components.md).
