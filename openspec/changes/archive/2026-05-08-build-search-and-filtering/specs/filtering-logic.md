# Spec: Filtering Logic

## Overview

Advanced filtering allows users to combine multiple criteria to narrow down products. All filters use **AND logic** — only products matching ALL active filters are returned.

---

## Filter Types

### 1. Category Filter

**Type**: Single-select or multi-select dropdown

**Parameters**:
- `category_id: int | null`

**Behavior**:
- User selects one category (or multiple if multi-select supported)
- Backend filters: `WHERE products.category_id IN (selected_ids)`
- If no category selected, filter is skipped
- Frontend loads category list from `GET /api/v1/categories`

**Validation**:
- Category ID must exist in database
- If invalid category provided, return 400 Bad Request (backend validates)

**Frontend UI**:
```typescript
<select value={selectedCategoryId} onChange={...}>
  <option value="">All Categories</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>
```

**URL Format**:
```
?category_id=3
?category_id=3&category_id=5  // if multi-select supported
```

**Database Implementation**:
```python
if category_id:
    query = query.where(Product.category_id == category_id)
```

---

### 2. Price Range Filter

**Type**: Dual input fields (min/max) or range slider

**Parameters**:
- `min_price: Decimal | null` (default: null, no lower bound)
- `max_price: Decimal | null` (default: null, no upper bound)

**Behavior**:
- User enters min price and/or max price
- Backend filters: `WHERE products.price >= min_price AND products.price <= max_price`
- Prices are Numeric(10, 2) in database, so precision to cents
- If only min provided, no upper limit
- If only max provided, no lower limit

**Validation Rules**:
- Both must be non-negative decimals
- `min_price <= max_price` (if both provided)
- If `min_price > max_price`, return 400 Bad Request

**Frontend UI**:
```typescript
<div className="price-range">
  <input 
    type="number" 
    placeholder="Min" 
    value={minPrice} 
    onChange={e => setMinPrice(parseFloat(e.target.value))}
    step="0.01"
    min="0"
  />
  <span> — </span>
  <input 
    type="number" 
    placeholder="Max" 
    value={maxPrice} 
    onChange={e => setMaxPrice(parseFloat(e.target.value))}
    step="0.01"
    min="0"
  />
</div>
```

**URL Format**:
```
?min_price=2.50
?max_price=15.00
?min_price=2.50&max_price=15.00
```

**Database Implementation**:
```python
if min_price is not None:
    query = query.where(Product.price >= min_price)
if max_price is not None:
    query = query.where(Product.price <= max_price)
```

**Example Query**:
```sql
SELECT * FROM products 
WHERE price >= 2.50 AND price <= 15.00
```

---

### 3. Availability Filter

**Type**: Toggle checkbox or boolean select

**Parameters**:
- `in_stock: bool | null` (default: null, show all products)

**Behavior**:
- `true`: Show only available products (`is_available = true`)
- `false`: Show only unavailable products (`is_available = false`)
- `null`: Don't filter by availability (show both)

**Validation**:
- Must be boolean (true/false) or null

**Frontend UI**:
```typescript
<div className="availability-filter">
  <label>
    <input 
      type="checkbox" 
      checked={inStock} 
      onChange={e => setInStock(e.target.checked || null)}
    />
    In Stock Only
  </label>
</div>
```

**URL Format**:
```
?in_stock=true   // Only available products
?in_stock=false  // Only unavailable products
```

**Database Implementation**:
```python
if in_stock is not None:
    query = query.where(Product.is_available == in_stock)
```

---

### 4. Stock Quantity Filter

**Type**: Number input with minimum threshold

**Parameters**:
- `min_stock: int | null` (default: null, no minimum)

**Behavior**:
- User specifies minimum available inventory
- Backend filters: `WHERE inventory.stock_quantity >= min_stock`
- Useful for wholesale buyers or low-stock warnings
- Requires JOIN to `inventory` table

**Validation**:
- Must be positive integer or null
- If `min_stock <= 0`, treat as null (no filter)

**Frontend UI**:
```typescript
<div className="stock-filter">
  <label>
    Minimum Stock:
    <input 
      type="number" 
      value={minStock} 
      onChange={e => setMinStock(parseInt(e.target.value) || null)}
      min="1"
      placeholder="Any"
    />
  </label>
</div>
```

**URL Format**:
```
?min_stock=5   // Products with at least 5 in stock
?min_stock=10
```

**Database Implementation**:
```python
if min_stock:
    query = query.where(Inventory.stock_quantity >= min_stock)
```

---

## Filter Combinations

### Logic: AND (all filters must match)

When multiple filters are active, only products matching **ALL** criteria are returned.

**Example 1**: Category = 3 AND Price between $2.50–$10.00
```sql
SELECT * FROM products 
WHERE category_id = 3 
  AND price >= 2.50 
  AND price <= 10.00
```

**Example 2**: Category = 3 AND Price >= $5.00 AND Available = true AND Stock >= 10
```sql
SELECT * FROM products p
JOIN inventory i ON p.id = i.product_id
WHERE p.category_id = 3 
  AND p.price >= 5.00 
  AND p.is_available = true
  AND i.stock_quantity >= 10
```

**Example 3**: Full-text search AND price range AND availability
```sql
SELECT * FROM products 
WHERE search_vector @@ plainto_tsquery('english', 'pasta')
  AND price >= 2.50 
  AND price <= 10.00
  AND is_available = true
LIMIT 20
```

### Invalid Combinations

| Scenario | Behavior |
|----------|----------|
| `min_price > max_price` | Return 400 Bad Request |
| `min_stock = 0` | Treat as null (no filter) |
| `category_id = 999` (doesn't exist) | Return 400 Bad Request |
| No filters active | Return all products (with pagination) |
| No results match | Return 200 OK with empty items array |

---

## Filter State Management (Frontend)

### Filter Object Structure

```typescript
interface Filters {
  category_id: number | null;
  min_price: number | null;
  max_price: number | null;
  in_stock: boolean | null;
  min_stock: number | null;
}
```

### State Initialization

```typescript
// From URL params or defaults
const defaultFilters: Filters = {
  category_id: null,
  min_price: null,
  max_price: null,
  in_stock: null,
  min_stock: null,
};
```

### Filter Application

```typescript
function applyFilters(filters: Filters) {
  // 1. Validate
  if (filters.min_price && filters.max_price && filters.min_price > filters.max_price) {
    throw new Error("min_price must be <= max_price");
  }

  // 2. Build query params
  const params = new URLSearchParams();
  if (filters.category_id) params.set("category_id", filters.category_id);
  if (filters.min_price) params.set("min_price", filters.min_price);
  if (filters.max_price) params.set("max_price", filters.max_price);
  if (filters.in_stock !== null) params.set("in_stock", filters.in_stock);
  if (filters.min_stock) params.set("min_stock", filters.min_stock);

  // 3. Navigate with new params
  navigate(`/products?${params.toString()}`);

  // 4. Hook fetches results automatically (useEffect listens to URL)
}
```

### Reset Filters

```typescript
function resetFilters() {
  const emptyFilters: Filters = {
    category_id: null,
    min_price: null,
    max_price: null,
    in_stock: null,
    min_stock: null,
  };
  applyFilters(emptyFilters);
}
```

---

## Backend Filter Query Builder

### Implementation Pattern

```python
from sqlalchemy import and_, select

def build_search_query(
    db_session,
    category_id: int | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock: bool | None = None,
    min_stock: int | None = None,
):
    """Build WHERE clause from filters."""
    filters = []
    
    if category_id:
        filters.append(Product.category_id == category_id)
    
    if min_price is not None:
        filters.append(Product.price >= min_price)
    
    if max_price is not None:
        filters.append(Product.price <= max_price)
    
    if in_stock is not None:
        filters.append(Product.is_available == in_stock)
    
    if min_stock:
        filters.append(Inventory.stock_quantity >= min_stock)
    
    # Combine with AND logic
    query = select(Product)
    if filters:
        query = query.where(and_(*filters))
    
    return query
```

### Validation Before Query

```python
# In FastAPI route handler
if min_price is not None and max_price is not None:
    if min_price > max_price:
        raise HTTPException(
            status_code=400,
            detail="min_price must be <= max_price"
        )

if category_id and category_id > 0:
    # Check category exists
    cat = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    if not cat.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Category with id {category_id} not found"
        )
```

---

## Performance Considerations

### Index Strategy

| Filter | Column | Index Type | Reason |
|--------|--------|-----------|--------|
| Category | `products.category_id` | B-tree | Foreign key lookup |
| Price | `products.price` | B-tree | Range queries |
| Availability | `products.is_available` | B-tree | Boolean filter |
| Stock | `inventory.stock_quantity` | B-tree | Range queries |

All indexes already exist from Change 5.

### Query Optimization

1. **Eager load relations**: Use `selectinload()` to prevent N+1
2. **Limit result set**: Never fetch > 100 items (enforce in limit param)
3. **Use indexes**: Filters on indexed columns are fast
4. **Count optimization**: Single COUNT query, not fetching all rows then len()

---

## Examples

### Example 1: Filter by category and price

User selects:
- Category: "Pasta & Grains" (id=3)
- Price: $2.50–$10.00

**URL**: `?category_id=3&min_price=2.50&max_price=10.00`

**Query**: 
```sql
SELECT * FROM products 
WHERE category_id = 3 AND price >= 2.50 AND price <= 10.00
LIMIT 20
```

### Example 2: Filter by availability and stock

User selects:
- Available: ✓ (checked)
- Min stock: 5

**URL**: `?in_stock=true&min_stock=5`

**Query**:
```sql
SELECT p.* FROM products p
JOIN inventory i ON p.id = i.product_id
WHERE p.is_available = true AND i.stock_quantity >= 5
LIMIT 20
```

### Example 3: Complex filter with search

User enters:
- Search: "organic"
- Category: 3
- Price: $0–$15
- Available: true

**URL**: `?q=organic&category_id=3&min_price=0&max_price=15&in_stock=true`

**Query**:
```sql
SELECT * FROM products 
WHERE search_vector @@ plainto_tsquery('english', 'organic')
  AND category_id = 3 
  AND price >= 0 
  AND price <= 15
  AND is_available = true
LIMIT 20
```

