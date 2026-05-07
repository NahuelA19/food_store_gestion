# Spec: Category Management

**Status**: Approved  
**Version**: 1.0  
**Owner**: Backend Team

---

## Overview

Category management provides CRUD operations for product categories and includes the relationships between categories and products.

---

## Category Model

### Database Table: `categories`

| Column | Type | Constraints | Index | Purpose |
|--------|------|-------------|-------|---------|
| `id` | `SERIAL` | PRIMARY KEY | Yes | Unique identifier |
| `name` | `VARCHAR(255)` | UNIQUE, NOT NULL | Yes | Category name (unique) |
| `description` | `VARCHAR(1000)` | Nullable | No | Category description |
| `created_at` | `TIMESTAMP TZ` | NOT NULL | No | Creation timestamp |
| `updated_at` | `TIMESTAMP TZ` | NOT NULL | No | Last update timestamp |

### SQLAlchemy ORM Model

```python
# app/models/category.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Category(Base, TimestampMixin):
    """Product category model."""
    
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="category",
        lazy="selectin",
        cascade="all, delete-orphan"  # Optional: prevents soft orphans
    )
    
    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name})>"
```

---

## Pydantic Validation Schemas

### CategoryCreate (Request Model)

```python
# app/models/category.py
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

class CategoryCreate(BaseModel):
    """Schema for creating a new category."""
    
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Category name (required, 1-255 characters, must be unique)"
    )
    description: str | None = Field(
        None,
        max_length=1000,
        description="Optional category description (max 1000 characters)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Vegetables",
                "description": "Fresh vegetables from local farms"
            }
        }
    )
```

### CategoryUpdate (Request Model)

```python
class CategoryUpdate(BaseModel):
    """Schema for updating an existing category."""
    
    name: str | None = Field(
        None,
        min_length=1,
        max_length=255,
        description="Category name (optional, must be unique if provided)"
    )
    description: str | None = Field(
        None,
        max_length=1000,
        description="Category description (optional)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "description": "Updated category description"
            }
        }
    )
```

### CategoryResponse (Response Model)

```python
from datetime import datetime

class CategoryResponse(BaseModel):
    """Schema for category responses."""
    
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Vegetables",
                "description": "Fresh vegetables from local farms",
                "created_at": "2026-05-07T12:00:00Z",
                "updated_at": "2026-05-07T12:00:00Z"
            }
        }
    )
```

### CategoryWithProductsResponse (Response Model)

```python
from app.models.product import ProductResponse

class CategoryWithProductsResponse(BaseModel):
    """Category response including products count."""
    
    id: int
    name: str
    description: str | None
    product_count: int  # Computed
    products: list[ProductResponse] | None = None  # Optional, for GET /{id}
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

---

## Validation Rules

### Field Validations

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Min 1, max 255 chars, unique | "Name must be 1-255 characters and be unique" |
| `description` | Max 1000 chars (nullable) | "Description must not exceed 1000 characters" |

### Business Logic Validations

1. **Unique Category Name**: Category names must be unique. Attempting to create/update with existing name returns:
```json
{
    "detail": "Category with name 'Vegetables' already exists",
    "error_code": "CATEGORY_NAME_DUPLICATE",
    "status_code": 409
}
```

2. **Cannot Delete Category with Products**: If attempting to delete a category with products:
```json
{
    "detail": "Cannot delete category with 5 products. Delete products first or reassign them.",
    "error_code": "CATEGORY_HAS_PRODUCTS",
    "status_code": 409
}
```

---

## API Endpoints

### GET /api/categories — List Categories

**Purpose**: Retrieve all categories with product counts

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_products` | boolean | false | Include product list in response |
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page (1-100) |

**Request Example**:
```
GET /api/categories?include_products=false&limit=50
```

**Response** (200 OK):
```json
{
    "items": [
        {
            "id": 1,
            "name": "Vegetables",
            "description": "Fresh vegetables from local farms",
            "product_count": 42,
            "created_at": "2026-05-07T12:00:00Z",
            "updated_at": "2026-05-07T12:00:00Z"
        },
        {
            "id": 2,
            "name": "Fruits",
            "description": "Fresh seasonal fruits",
            "product_count": 28,
            "created_at": "2026-05-07T12:00:00Z",
            "updated_at": "2026-05-07T12:00:00Z"
        }
    ],
    "total": 2,
    "page": 1,
    "limit": 50
}
```

---

### GET /api/categories/{id} — Get Category

**Purpose**: Retrieve single category with products

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Category ID |

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `product_limit` | int | 20 | Max products to return |

**Request Example**:
```
GET /api/categories/1?product_limit=20
```

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Vegetables",
    "description": "Fresh vegetables from local farms",
    "product_count": 42,
    "products": [
        {
            "id": 1,
            "name": "Organic Tomatoes",
            "price": "4.99",
            "is_available": true,
            "inventory": { "stock_quantity": 50 }
        },
        {
            "id": 2,
            "name": "Bell Peppers",
            "price": "3.49",
            "is_available": true,
            "inventory": { "stock_quantity": 100 }
        }
    ],
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

**Error Response** (404 Not Found):
```json
{
    "detail": "Category not found",
    "error_code": "CATEGORY_NOT_FOUND",
    "status_code": 404
}
```

---

### POST /api/categories — Create Category

**Purpose**: Create a new category (admin only)

**Authentication**: Required (admin role)

**Request Body**:
```json
{
    "name": "Vegetables",
    "description": "Fresh vegetables from local farms"
}
```

**Response** (201 Created):
```json
{
    "id": 1,
    "name": "Vegetables",
    "description": "Fresh vegetables from local farms",
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

**Error Responses**:

(409 Conflict) — Name already exists:
```json
{
    "detail": "Category with name 'Vegetables' already exists",
    "error_code": "CATEGORY_NAME_DUPLICATE",
    "status_code": 409
}
```

(400 Bad Request) — Validation error:
```json
{
    "detail": "Name must be 1-255 characters",
    "error_code": "VALIDATION_ERROR",
    "status_code": 400
}
```

---

### PUT /api/categories/{id} — Update Category

**Purpose**: Update category fields (admin only)

**Authentication**: Required (admin role)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Category ID |

**Request Body** (all fields optional):
```json
{
    "name": "Fresh Vegetables",
    "description": "Updated description"
}
```

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Fresh Vegetables",
    "description": "Updated description",
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

**Error Responses**:

(404 Not Found):
```json
{
    "detail": "Category not found",
    "error_code": "CATEGORY_NOT_FOUND",
    "status_code": 404
}
```

(409 Conflict) — Duplicate name:
```json
{
    "detail": "Category with name 'Vegetables' already exists",
    "error_code": "CATEGORY_NAME_DUPLICATE",
    "status_code": 409
}
```

---

### DELETE /api/categories/{id} — Delete Category

**Purpose**: Delete category (admin only, no products must exist)

**Authentication**: Required (admin role)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Category ID |

**Request Example**:
```
DELETE /api/categories/1
```

**Response** (204 No Content)

**Error Responses**:

(404 Not Found):
```json
{
    "detail": "Category not found",
    "error_code": "CATEGORY_NOT_FOUND",
    "status_code": 404
}
```

(409 Conflict) — Has products:
```json
{
    "detail": "Cannot delete category with 5 products. Delete products first or reassign them.",
    "error_code": "CATEGORY_HAS_PRODUCTS",
    "status_code": 409
}
```

---

## Relationships

### Category ← → Product (One-to-Many)

- **Cardinality**: One category has many products
- **Lazy Loading**: `selectinload` (eager load)
- **Cascade**: Delete category → doesn't delete products (RESTRICT prevents deletion if products exist)
- **Constraint**: `ForeignKey("categories.id", ondelete="RESTRICT")`

**Query Pattern** (prevent N+1):
```python
# ✅ Good — category with products loaded in single query
stmt = select(Category).options(selectinload(Category.products))

# ❌ Bad — N+1 if accessing products in loop
for category in categories:
    print(category.products)  # Triggers N queries
```

---

## Testing Checklist

- [ ] Create category with all fields
- [ ] Create category with minimal fields (description optional)
- [ ] Reject duplicate category name
- [ ] Reject category name too short (<1 char)
- [ ] Reject category name too long (>255 chars)
- [ ] List categories with product counts
- [ ] Get single category with products
- [ ] Update category name
- [ ] Update category description
- [ ] Reject duplicate name on update
- [ ] Delete empty category (no products)
- [ ] Cannot delete category with products
- [ ] Verify timestamps set on create/update
- [ ] Verify eager loading (products included without extra queries)
