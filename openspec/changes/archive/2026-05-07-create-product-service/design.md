# Change 5: Product Service — Technical Design

**Date**: May 2026  
**Version**: 1.0  
**Status**: Draft

---

## Architecture Overview

The Product Service is a layered backend architecture with corresponding React UI:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                      │
│  ProductGrid → ProductCard → ProductDetail, CategoryFilter  │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────────┐
│                   FastAPI Routes Layer                      │
│  /api/categories, /api/products, /api/inventory            │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│             Pydantic Validation Layer                        │
│  Request/Response schemas, business logic validation        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│            SQLAlchemy ORM Layer (async)                     │
│  Models: Product, Category, Inventory, ProductCategory     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│            PostgreSQL Database                              │
│  Tables: products, categories, inventory, product_categories│
└─────────────────────────────────────────────────────────────┘
```

---

## Database Layer

### Schema Design

#### `categories` Table (Already exists from Change 2)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_categories_name ON categories(name);
```

#### `products` Table (Already exists from Change 2)
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_price ON products(price);
```

#### `inventory` Table (New for Change 5)
```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_stock_quantity ON inventory(stock_quantity);
```

#### `product_categories` Table (Rename from polymorphic to explicit)
```sql
-- Join table for many-to-many relationship (optional, for future)
-- For now, products.category_id provides one-to-many relationship
-- This table is prepared for future multi-category support
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    UNIQUE(product_id, category_id)
);

CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);
```

### Query Performance Strategy

**Indexes**:
- `categories(name)` — Fast category lookups for filtering
- `products(category_id, is_available)` — Composite index for category + availability filtering
- `products(price)` — Price range filtering
- `products(name)` — Full-text search preparation
- `inventory(product_id)` — Stock lookups

**N+1 Prevention**:
- All product queries **eagerly load** category relationships
- Use `selectinload()` for relationships: `SELECT products JOIN categories`
- Pagination limits query size (default 20 per page)

**Query Examples**:
```python
# ✅ Good — single query with relationship loaded
async def get_products_by_category(category_id: int):
    return await session.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.category_id == category_id)
        .limit(20)
        .offset(0)
    )

# ❌ Bad — N+1 if category is accessed in loop
for product in products:
    category_name = product.category.name  # Triggers N queries
```

---

## ORM Models

### Product Model (Enhanced)
```python
# app/models/product.py
class Product(Base, TimestampMixin):
    __tablename__ = "products"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    
    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    inventory: Mapped["Inventory"] = relationship(
        "Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan"
    )
```

### Category Model (Already exists)
```python
# app/models/category.py
class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", lazy="selectin"
    )
```

### Inventory Model (New)
```python
# app/models/inventory.py
class Inventory(Base, TimestampMixin):
    __tablename__ = "inventory"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    stock_quantity: Mapped[int] = mapped_column(default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(default=10, nullable=False)
    reserved_quantity: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="inventory")
    
    @property
    def available_quantity(self) -> int:
        """Calculate available quantity after reservations."""
        return max(0, self.stock_quantity - self.reserved_quantity)
```

---

## Backend API Routes

### Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/categories` | List all categories | Public |
| GET | `/api/categories/{id}` | Get category with products | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/{id}` | Update category | Admin |
| DELETE | `/api/categories/{id}` | Delete category | Admin |
| GET | `/api/products` | List products with filters | Public |
| GET | `/api/products/{id}` | Get product details | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/{id}` | Update product | Admin |
| DELETE | `/api/products/{id}` | Delete product | Admin |
| GET | `/api/inventory/{product_id}` | Get stock levels | Public |
| PUT | `/api/inventory/{product_id}` | Update stock (admin) | Admin |
| POST | `/api/inventory/{product_id}/reserve` | Reserve stock | Auth |

### Request/Response Models (Pydantic v2)

```python
# Request models (for POST/PUT)
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    price: Decimal = Field(..., gt=Decimal("0"), max_digits=10, decimal_places=2)
    category_id: int = Field(..., gt=0)
    is_available: bool = Field(default=True)

class InventoryUpdate(BaseModel):
    stock_quantity: int = Field(..., ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)

# Response models (for GET/POST/PUT)
class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal
    category_id: int
    category: CategoryResponse  # Nested
    is_available: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class InventoryResponse(BaseModel):
    id: int
    product_id: int
    stock_quantity: int
    reserved_quantity: int
    available_quantity: int  # Calculated
    low_stock_threshold: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProductDetailResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal
    category: CategoryResponse
    is_available: bool
    inventory: InventoryResponse  # Include stock info
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

### Error Handling

**HTTP Status Codes**:
- `200 OK` — Successful GET/PUT
- `201 Created` — Successful POST
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Invalid input (validation error)
- `401 Unauthorized` — Missing authentication
- `403 Forbidden` — Insufficient permissions (non-admin tries POST/PUT/DELETE)
- `404 Not Found` — Resource doesn't exist
- `409 Conflict` — Business logic violation (e.g., category already exists, insufficient stock)
- `500 Internal Server Error` — Unhandled exception

**Error Response Format**:
```json
{
    "detail": "Product not found",
    "error_code": "PRODUCT_NOT_FOUND",
    "status_code": 404
}
```

---

## Frontend Components

### Component Hierarchy

```
App
├── pages/ProductsPage
│   ├── CategoryFilter
│   ├── SearchInput
│   ├── ProductGrid
│   │   └── ProductCard (×20 per page)
│   │       └── AddToCartButton
│   └── Pagination
└── pages/ProductDetailPage
    ├── ProductDetail
    │   ├── ProductImage (placeholder)
    │   ├── ProductInfo
    │   ├── StockStatus
    │   └── AddToCartButton
    └── RelatedProducts
        └── ProductCard (×4)
```

### Component Specs

#### ProductGrid
- Displays paginated product list (default 20 per page)
- Props: `products: Product[]`, `isLoading: boolean`, `onPageChange: (page: number) => void`
- Renders `ProductCard` components in a grid layout
- Shows loading skeleton while fetching

#### ProductCard
- Shows product image (placeholder), name, price, category badge, stock status
- Props: `product: Product`, `onAddToCart: () => void`
- Clickable to navigate to ProductDetailPage
- "Add to Cart" button (disabled if out of stock)

#### ProductDetail
- Full product information: name, description, price, images, category
- Stock status (in stock / low stock / out of stock)
- Add to cart with quantity selector
- Props: `product: Product`

#### CategoryFilter
- Dropdown or multi-select filter
- Props: `categories: Category[]`, `onFilterChange: (categoryId: int | null) => void`
- "All Categories" option
- Shows product count per category

#### SearchInput
- Real-time search (debounced, 300ms)
- Props: `onSearch: (query: string) => void`
- Placeholder: "Search products..."

### State Management

Use React hooks (no Redux needed initially):

```typescript
// hooks/useProducts.ts
export function useProducts(page = 1, categoryId?: number, searchQuery = "") {
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        fetchProducts(page, categoryId, searchQuery)
            .then(data => {
                setProducts(data.items);
                setTotal(data.total);
            })
            .catch(err => setError(err.message));
    }, [page, categoryId, searchQuery]);
    
    return { products, total, isLoading, error };
}

// hooks/useFilters.ts
export function useFilters() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    return { selectedCategory, setSelectedCategory, searchQuery, setSearchQuery };
}
```

---

## Performance Considerations

### Database
- **Index Strategy**: B-tree indexes on frequently filtered columns (category_id, is_available, price)
- **Query Optimization**: `EXPLAIN ANALYZE` for all queries before merge
- **Pagination**: Always use LIMIT/OFFSET; default page size 20

### API
- **Response Caching**: Use HTTP ETag headers for GET requests
- **Compression**: Enable gzip middleware
- **Rate Limiting**: Prepare for future rate limiting (placeholder in middleware)

### Frontend
- **Component Memoization**: Use `React.memo()` for ProductCard to prevent re-renders
- **Query String Caching**: Store filters in URL (e.g., `?category=1&page=2`) for browser back button
- **Lazy Loading**: Pagination prevents loading all products at once
- **API Call Debouncing**: Search input debounced to 300ms to reduce requests

---

## Error Handling & Validation

### Backend Validation
- **Request Validation**: Pydantic schemas validate types, lengths, ranges
- **Business Logic**: Check category exists before creating product
- **Stock Integrity**: Cannot reserve more than available
- **Duplicate Prevention**: Category names must be unique

### Frontend Validation
- **Input Fields**: Required field checks, max length warnings
- **API Error Display**: Toast notifications for errors
- **Fallback UI**: Show error message if products fail to load
- **Retry Logic**: Expose "retry" button on API errors

---

## Migration Strategy

**Alembic Migration for Inventory Table**:
```python
# backend/alembic/versions/xxx_add_inventory_table.py
def upgrade():
    op.create_table(
        'inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reserved_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('low_stock_threshold', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id')
    )
    op.create_index('idx_inventory_product_id', 'inventory', ['product_id'])
    op.create_index('idx_inventory_stock_quantity', 'inventory', ['stock_quantity'])
```

---

## Testing Strategy

### Backend Tests (pytest)
- **Unit Tests**: Pydantic schema validation, model methods
- **Route Tests**: Each endpoint with happy path + error cases
- **Integration Tests**: Database operations with real session
- **Fixtures**: Test data (categories, products, inventory)

### Frontend Tests (Vitest + @testing-library/react)
- **Component Tests**: ProductCard, ProductGrid, CategoryFilter rendering
- **Hook Tests**: useProducts, useFilters behavior
- **API Mocking**: Mock fetch calls with MSW (Mock Service Worker)
- **Accessibility**: a11y checks for interactive elements

---

## Deployment & Rollout

1. **Database Migration**: Run Alembic migration on staging/prod
2. **Backend Deployment**: Deploy API routes (backward compatible)
3. **Frontend Deployment**: Deploy React components (safe to update)
4. **Monitoring**: Track API response times, error rates, inventory queries

---

## Future Enhancements (Out of Scope)

- **Multi-category Products**: Use product_categories join table (prepared schema)
- **Product Images**: File upload to S3/CDN
- **Full-Text Search**: PostgreSQL `tsvector` or Elasticsearch integration
- **Bulk Operations**: Batch create/update/delete via CSV
- **Product Variants**: Size, color, etc. (separate models)
- **Recommendations**: ML-based similar products, frequently bought together
