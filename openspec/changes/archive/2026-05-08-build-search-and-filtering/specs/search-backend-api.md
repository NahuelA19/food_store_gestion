# Spec: Search Backend API

## Endpoint: GET /api/v1/products/search

### Summary

Full-text search and advanced filtering for products with pagination and sorting.

### Request

#### Query Parameters

All parameters are optional except `limit` which has a default.

| Parameter | Type | Default | Valid Range | Description |
|-----------|------|---------|-------------|-------------|
| `q` | string | null | 1–500 chars | Full-text search query (e.g., "organic pasta") |
| `category_id` | integer | null | > 0 | Filter by category ID (must exist in DB) |
| `min_price` | decimal | null | >= 0 | Minimum price filter |
| `max_price` | decimal | null | >= 0 | Maximum price filter |
| `in_stock` | boolean | null | true/false | Availability filter (is_available) |
| `min_stock` | integer | null | > 0 | Minimum inventory quantity filter |
| `page` | integer | 1 | >= 1 | Page number for pagination |
| `limit` | integer | 20 | 1–100 | Items per page |
| `sort_by` | string | "relevance" | relevance, name, price, created_at | Sort field |
| `order` | string | "asc" | asc, desc | Sort direction |

#### Example Requests

```
GET /api/v1/products/search?q=pasta&page=1&limit=20

GET /api/v1/products/search?category_id=3&min_price=2.50&max_price=10.00&in_stock=true

GET /api/v1/products/search?q=organic&sort_by=price&order=desc

GET /api/v1/products/search?min_stock=5
```

#### Parameter Validation Rules

1. **`q` (search query)**
   - Must be 1–500 characters
   - Special FTS chars (`|`, `&`, `!`, `(`, `)`) are stripped by `plainto_tsquery()`
   - If missing, no FTS search applied (but filters still apply)

2. **`category_id`**
   - Must be a positive integer
   - Must exist in `categories` table (if provided)
   - If category doesn't exist, return 400 Bad Request

3. **`min_price` and `max_price`**
   - Must be non-negative decimals
   - If `min_price > max_price`, return 400 Bad Request
   - Prices are exact match against `products.price` column (Numeric(10, 2))

4. **`in_stock`**
   - Boolean: filters on `products.is_available = true/false`

5. **`min_stock`**
   - Positive integer
   - Filters on `inventory.stock_quantity >= min_stock`

6. **`page` and `limit`**
   - `page` must be >= 1
   - `limit` must be 1–100 (max 100 to prevent resource exhaustion)
   - If `limit > 100`, return 400 Bad Request

7. **`sort_by` and `order`**
   - `sort_by` must be one of: `relevance`, `name`, `price`, `created_at`
   - `order` must be `asc` or `desc`
   - If `sort_by=relevance` and no `q` provided, default to `sort_by=created_at`
   - If invalid, return 400 Bad Request

---

### Response

#### Success (200 OK)

```json
{
  "items": [
    {
      "id": 1,
      "name": "Organic Pasta Penne",
      "description": "Made from durum wheat, gluten-free",
      "price": "5.99",
      "category_id": 3,
      "category": {
        "id": 3,
        "name": "Grains & Pasta",
        "description": "...",
        "created_at": "2026-01-15T08:00:00Z",
        "updated_at": "2026-01-15T08:00:00Z"
      },
      "is_available": true,
      "inventory": {
        "id": 1,
        "product_id": 1,
        "stock_quantity": 50,
        "reserved_quantity": 5,
        "available_quantity": 45,
        "low_stock_threshold": 10,
        "created_at": "2026-01-15T08:00:00Z",
        "updated_at": "2026-05-06T15:30:00Z"
      },
      "created_at": "2026-01-15T08:00:00Z",
      "updated_at": "2026-05-06T15:30:00Z"
    },
    { ... }
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

**Response Schema** (Pydantic):
```python
class SearchResponse(BaseModel):
    items: list[ProductDetailResponse]
    pagination: PaginationInfo

class PaginationInfo(BaseModel):
    total: int  # Total matching items
    page: int  # Current page
    limit: int  # Items per page
    total_pages: int  # ceil(total / limit)
    has_next: bool  # page < total_pages
    has_previous: bool  # page > 1
```

**HTTP Status**: 200 OK

---

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Invalid param (limit > 100, page < 1, etc.) | `{"detail": "Invalid limit: must be 1-100"}` |
| 400 | `min_price > max_price` | `{"detail": "min_price must be <= max_price"}` |
| 400 | `category_id` doesn't exist | `{"detail": "Category with id 999 not found"}` |
| 400 | Invalid `sort_by` | `{"detail": "Invalid sort_by: must be relevance, name, price, or created_at"}` |
| 500 | Database error | `{"detail": "Internal server error"}` |

**Example Error**:
```json
{
  "detail": "Invalid limit: must be between 1 and 100"
}
```

---

### Implementation Notes

#### FTS Query Execution

```python
# SQLAlchemy ORM query
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

query = select(Product).options(
    selectinload(Product.category),
    selectinload(Product.inventory),
)

# Build filters list
filters = []

if q:
    filters.append(
        Product.search_vector.match(
            func.plainto_tsquery('english', q)
        )
    )

if category_id:
    filters.append(Product.category_id == category_id)

# ... apply all filters

if filters:
    query = query.where(and_(*filters))
```

**Why `plainto_tsquery()`**?
- Sanitizes user input (strips `|`, `&`, `!`, parens)
- Prevents FTS injection attacks
- Handles typos gracefully (searches for whole words, not parts)

#### Performance Guarantee

**Database indexes required**:
- ✅ GIN index on `products.search_vector` (FTS)
- ✅ B-tree index on `products.category_id`
- ✅ B-tree index on `products.price`
- ✅ B-tree index on `products.is_available`

**Expected performance** (with 100+ products):
- FTS query: 40–100ms
- Filter query: 10–50ms
- Eager load relations: 10–30ms
- Total: < 200ms p99

**EXPLAIN ANALYZE example** (should achieve this):
```
Bitmap Index Scan on idx_products_search_vector  (cost=10..50)
  Index Cond: (search_vector @@ plainto_tsquery(...))
  Bitmap Heap Scan on products  (cost=50..150)
    Filter: (is_available = true AND price >= 2.50 AND price <= 10.00)
    InitPlan 1
      -> Aggregate (cost=0..10)
Total: ~150ms estimate, actual 45ms
```

#### N+1 Prevention

**Critical**: Use `selectinload()` to load relations eagerly.

Without `selectinload()`:
1. Query products (1 query)
2. For each product, query category (N queries)
3. For each product, query inventory (N queries)
4. **Total: 1 + N + N = 2N + 1 queries** (bad!)

With `selectinload()`:
1. Query products + category + inventory (3 queries total)
2. **Total: 3 queries** (good!)

---

### API Contract Examples

#### Example 1: Simple keyword search
```
GET /api/v1/products/search?q=pasta&limit=10

Response:
{
  "items": [
    { "id": 1, "name": "Organic Pasta", ... },
    { "id": 2, "name": "Whole Wheat Pasta", ... },
    ...
  ],
  "pagination": { "total": 42, "page": 1, ... }
}
```

#### Example 2: Advanced filtering with search
```
GET /api/v1/products/search?q=organic&category_id=3&min_price=2.00&max_price=15.00&in_stock=true&sort_by=price&order=asc

Response:
{
  "items": [
    { "id": 5, "name": "Organic Rice", "price": "2.50", ... },
    { "id": 1, "name": "Organic Pasta", "price": "5.99", ... },
    ...
  ],
  "pagination": { "total": 12, "page": 1, ... }
}
```

#### Example 3: Pagination
```
GET /api/v1/products/search?q=pasta&page=2&limit=20

Response:
{
  "items": [ ... 20 items ... ],
  "pagination": { "total": 42, "page": 2, "limit": 20, "total_pages": 3, "has_next": true, "has_previous": true }
}
```

#### Example 4: No results
```
GET /api/v1/products/search?q=xyzabc123

Response:
{
  "items": [],
  "pagination": { "total": 0, "page": 1, "limit": 20, "total_pages": 0, "has_next": false, "has_previous": false }
}
```

---

### Changelog

| Date | Change |
|------|--------|
| 2026-05-07 | Initial spec for search endpoint |

