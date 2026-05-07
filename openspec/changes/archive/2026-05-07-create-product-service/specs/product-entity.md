# Spec: Product Entity Model

**Status**: Approved  
**Version**: 1.0  
**Owner**: Backend Team

---

## Overview

The Product entity represents a catalog item in the Food Store. Products are associated with a Category, have pricing information, availability status, and inventory tracking.

---

## Product Model

### Database Table: `products`

| Column | Type | Constraints | Index | Purpose |
|--------|------|-------------|-------|---------|
| `id` | `SERIAL` | PRIMARY KEY | Yes | Unique identifier |
| `name` | `VARCHAR(255)` | NOT NULL | Yes | Product name (searchable) |
| `description` | `VARCHAR(2000)` | Nullable | No | Long-form product description |
| `price` | `NUMERIC(10,2)` | NOT NULL | Yes | Price in USD with 2 decimals |
| `category_id` | `INTEGER` | FK → categories.id | Yes | Foreign key to category |
| `is_available` | `BOOLEAN` | DEFAULT true | Yes | Availability flag |
| `created_at` | `TIMESTAMP TZ` | NOT NULL | No | Creation timestamp |
| `updated_at` | `TIMESTAMP TZ` | NOT NULL | No | Last update timestamp |

### Indexes

```sql
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_price ON products(price);
```

### SQLAlchemy ORM Model

```python
# app/models/product.py
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Product(Base, TimestampMixin):
    """Product model for the e-commerce catalog."""
    
    __tablename__ = "products"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    
    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    inventory: Mapped["Inventory"] = relationship(
        "Inventory",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
```

---

## Pydantic Validation Schemas

### ProductCreate (Request Model)

```python
# app/models/product.py
from pydantic import BaseModel, Field
from decimal import Decimal

class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Product name (required, 1-255 characters)"
    )
    description: str | None = Field(
        None,
        max_length=2000,
        description="Optional product description (max 2000 characters)"
    )
    price: Decimal = Field(
        ...,
        gt=Decimal("0"),
        max_digits=10,
        decimal_places=2,
        description="Price in USD (must be > 0, max 2 decimal places)"
    )
    category_id: int = Field(
        ...,
        gt=0,
        description="Category ID (must exist in categories table)"
    )
    is_available: bool = Field(
        True,
        description="Availability flag (defaults to true)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Organic Tomatoes",
                "description": "Fresh organic tomatoes from local farm",
                "price": "4.99",
                "category_id": 1,
                "is_available": True
            }
        }
    )
```

### ProductUpdate (Request Model)

```python
class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    
    name: str | None = Field(
        None,
        min_length=1,
        max_length=255,
        description="Product name (optional)"
    )
    description: str | None = Field(
        None,
        max_length=2000,
        description="Product description (optional)"
    )
    price: Decimal | None = Field(
        None,
        gt=Decimal("0"),
        max_digits=10,
        decimal_places=2,
        description="Price in USD (optional)"
    )
    category_id: int | None = Field(
        None,
        gt=0,
        description="Category ID (optional)"
    )
    is_available: bool | None = Field(
        None,
        description="Availability flag (optional)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "price": "5.99",
                "is_available": False
            }
        }
    )
```

### ProductResponse (Response Model)

```python
from datetime import datetime

class CategoryResponse(BaseModel):
    """Nested category in product response."""
    id: int
    name: str
    description: str | None
    
    model_config = ConfigDict(from_attributes=True)

class InventoryResponse(BaseModel):
    """Nested inventory in product response."""
    id: int
    stock_quantity: int
    available_quantity: int
    low_stock_threshold: int
    reserved_quantity: int
    
    model_config = ConfigDict(from_attributes=True)

class ProductResponse(BaseModel):
    """Schema for GET product response."""
    
    id: int
    name: str
    description: str | None
    price: Decimal
    category: CategoryResponse
    is_available: bool
    inventory: InventoryResponse | None = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Organic Tomatoes",
                "description": "Fresh organic tomatoes from local farm",
                "price": "4.99",
                "category": {
                    "id": 1,
                    "name": "Vegetables",
                    "description": "Fresh vegetables"
                },
                "is_available": True,
                "inventory": {
                    "id": 1,
                    "stock_quantity": 50,
                    "available_quantity": 45,
                    "low_stock_threshold": 10,
                    "reserved_quantity": 5
                },
                "created_at": "2026-05-07T12:00:00Z",
                "updated_at": "2026-05-07T12:00:00Z"
            }
        }
    )
```

---

## Validation Rules

### Field Validations

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Min 1, max 255 chars | "Name must be 1-255 characters" |
| `description` | Max 2000 chars (nullable) | "Description must not exceed 2000 characters" |
| `price` | Must be > 0, 2 decimals | "Price must be positive and have max 2 decimal places" |
| `category_id` | Must reference existing category | "Category not found" |
| `is_available` | Boolean | "Must be true or false" |

### Business Logic Validations

1. **Category Must Exist**: When creating/updating a product, the `category_id` must reference an existing category. If not, return `400 Bad Request` with message: "Category with ID {id} not found"

2. **Unique Constraint**: Product names do NOT need to be unique (multiple products can have same name but different categories)

3. **Price Precision**: Price must have exactly 2 decimal places. Database enforces this via `NUMERIC(10, 2)`.

4. **Availability Flag**: Can be toggled independently of inventory. A product can be `is_available=false` even if stock exists (e.g., temporarily out of stock for quality issues).

---

## Relationships

### Product → Category (Many-to-One)

- **Cardinality**: Many products belong to one category
- **Constraint**: `ForeignKey("categories.id", ondelete="RESTRICT")`
- **Lazy Loading**: `selectinload` (eager load category with product)
- **Behavior**: Cannot delete a category if products reference it (RESTRICT)

### Product → Inventory (One-to-One)

- **Cardinality**: Each product has exactly one inventory record
- **Constraint**: `ForeignKey("inventory.product_id", ondelete="CASCADE")`
- **Lazy Loading**: `selectinload` (eager load inventory with product)
- **Behavior**: When product is deleted, inventory is automatically deleted (CASCADE)
- **Creation**: An inventory record is automatically created when a product is created

---

## API Endpoints

### GET /api/products (List Products)

**Query Parameters**:
- `category_id` (optional): Filter by category ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by product name
- `min_price` (optional): Filter by minimum price
- `max_price` (optional): Filter by maximum price
- `in_stock` (optional): Filter available products only (true/false)

**Response** (200 OK):
```json
{
    "items": [
        {
            "id": 1,
            "name": "Organic Tomatoes",
            "price": "4.99",
            "category": { "id": 1, "name": "Vegetables" },
            "is_available": true,
            "inventory": { "stock_quantity": 50, "available_quantity": 45 },
            "created_at": "2026-05-07T12:00:00Z",
            "updated_at": "2026-05-07T12:00:00Z"
        }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3
}
```

### GET /api/products/{id} (Get Product)

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes from local farm",
    "price": "4.99",
    "category": {
        "id": 1,
        "name": "Vegetables",
        "description": "Fresh vegetables"
    },
    "is_available": true,
    "inventory": {
        "id": 1,
        "stock_quantity": 50,
        "available_quantity": 45,
        "low_stock_threshold": 10,
        "reserved_quantity": 5
    },
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

**Error Response** (404 Not Found):
```json
{
    "detail": "Product not found",
    "error_code": "PRODUCT_NOT_FOUND",
    "status_code": 404
}
```

### POST /api/products (Create Product)

**Request Body**:
```json
{
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes from local farm",
    "price": "4.99",
    "category_id": 1,
    "is_available": true
}
```

**Response** (201 Created):
```json
{
    "id": 1,
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes from local farm",
    "price": "4.99",
    "category": { "id": 1, "name": "Vegetables" },
    "is_available": true,
    "inventory": {
        "id": 1,
        "stock_quantity": 0,
        "available_quantity": 0,
        "low_stock_threshold": 10,
        "reserved_quantity": 0
    },
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

### PUT /api/products/{id} (Update Product)

**Request Body**:
```json
{
    "price": "5.99",
    "is_available": false
}
```

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Organic Tomatoes",
    "price": "5.99",
    "is_available": false,
    ...
}
```

### DELETE /api/products/{id} (Delete Product)

**Response** (204 No Content)

---

## Type Safety & Serialization

All Pydantic models use:
- `model_config = ConfigDict(from_attributes=True)` for ORM serialization
- Explicit type hints (no `Any`)
- Field descriptions for API documentation

---

## Testing Checklist

- [ ] Create product with all fields
- [ ] Create product with minimal fields (description optional)
- [ ] Reject product with missing required fields
- [ ] Reject product with invalid price (negative, >2 decimals)
- [ ] Reject product with non-existent category
- [ ] Update product with subset of fields
- [ ] Update product with invalid category (should fail)
- [ ] Delete product and verify inventory is deleted
- [ ] Verify timestamps are set correctly on create/update
- [ ] Verify relationship eager loading (category included without extra query)
