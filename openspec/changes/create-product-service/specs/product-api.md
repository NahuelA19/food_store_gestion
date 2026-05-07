# Spec: Product API Endpoints

**Status**: Approved  
**Version**: 1.0  
**Owner**: Backend Team

---

## Overview

Complete REST API specification for product management. All endpoints follow REST conventions and return consistent response formats.

---

## Endpoint Summary

| # | Method | Path | Purpose | Auth | Status |
|---|--------|------|---------|------|--------|
| 1 | GET | `/api/products` | List products with filters & pagination | Public | 200 |
| 2 | GET | `/api/products/{id}` | Get single product details | Public | 200/404 |
| 3 | POST | `/api/products` | Create new product | Admin | 201/400 |
| 4 | PUT | `/api/products/{id}` | Update product | Admin | 200/400/404 |
| 5 | DELETE | `/api/products/{id}` | Delete product | Admin | 204/404 |
| 6 | GET | `/api/products/{id}/related` | Get related products (same category) | Public | 200 |
| 7 | GET | `/api/products/search` | Search products by name/description | Public | 200 |
| 8 | PUT | `/api/products/{id}/availability` | Toggle product availability | Admin | 200/404 |

---

## Detailed Endpoint Specifications

### 1. GET /api/products — List Products

**Purpose**: Retrieve paginated list of products with optional filters

**Query Parameters**:

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `page` | int | 1 | ≥1 | Page number for pagination |
| `limit` | int | 20 | 1-100 | Items per page |
| `category_id` | int | - | - | Filter by category ID |
| `search` | string | - | 1-255 chars | Search by product name |
| `min_price` | decimal | - | >0 | Filter by minimum price |
| `max_price` | decimal | - | >0 | Filter by maximum price |
| `in_stock` | boolean | - | - | Show only products with available inventory |
| `sort` | string | `name` | `name`, `price`, `created_at` | Sort field |
| `order` | string | `asc` | `asc`, `desc` | Sort order |

**Request Example**:
```
GET /api/products?page=2&limit=20&category_id=1&sort=price&order=asc
```

**Response** (200 OK):
```json
{
    "items": [
        {
            "id": 1,
            "name": "Organic Tomatoes",
            "description": "Fresh organic tomatoes",
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
        },
        {
            "id": 2,
            "name": "Bell Peppers",
            "description": "Colorful bell peppers",
            "price": "3.49",
            "category": {
                "id": 1,
                "name": "Vegetables"
            },
            "is_available": true,
            "inventory": {
                "id": 2,
                "stock_quantity": 100,
                "available_quantity": 95,
                "low_stock_threshold": 10,
                "reserved_quantity": 5
            },
            "created_at": "2026-05-07T12:00:00Z",
            "updated_at": "2026-05-07T12:00:00Z"
        }
    ],
    "total": 42,
    "page": 2,
    "limit": 20,
    "total_pages": 3,
    "has_next": true,
    "has_previous": true
}
```

**Error Response** (400 Bad Request):
```json
{
    "detail": "Invalid page number: must be >= 1",
    "error_code": "INVALID_PAGE",
    "status_code": 400
}
```

**Validation Rules**:
- `page` must be ≥ 1
- `limit` must be 1-100
- `category_id` must reference existing category
- `min_price` and `max_price` must be positive decimals
- `min_price` must be ≤ `max_price` if both provided

---

### 2. GET /api/products/{id} — Get Single Product

**Purpose**: Retrieve full details of a single product

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Product ID (required) |

**Request Example**:
```
GET /api/products/1
```

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes from local farm. Grown without pesticides.",
    "price": "4.99",
    "category": {
        "id": 1,
        "name": "Vegetables",
        "description": "Fresh vegetables from local farms"
    },
    "is_available": true,
    "inventory": {
        "id": 1,
        "product_id": 1,
        "stock_quantity": 50,
        "reserved_quantity": 5,
        "available_quantity": 45,
        "low_stock_threshold": 10,
        "created_at": "2026-05-07T12:00:00Z",
        "updated_at": "2026-05-07T12:00:00Z"
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

**Validation Rules**:
- `id` must be a positive integer
- Product must exist in database

---

### 3. POST /api/products — Create Product

**Purpose**: Create a new product (admin only)

**Authentication**: Required (must be admin role)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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
    "category": {
        "id": 1,
        "name": "Vegetables"
    },
    "is_available": true,
    "inventory": {
        "id": 1,
        "product_id": 1,
        "stock_quantity": 0,
        "reserved_quantity": 0,
        "available_quantity": 0,
        "low_stock_threshold": 10,
        "created_at": "2026-05-07T12:00:00Z",
        "updated_at": "2026-05-07T12:00:00Z"
    },
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

**Error Responses**:

(401 Unauthorized) — Missing/invalid JWT:
```json
{
    "detail": "Not authenticated",
    "error_code": "NOT_AUTHENTICATED",
    "status_code": 401
}
```

(403 Forbidden) — Insufficient permissions:
```json
{
    "detail": "Only admins can create products",
    "error_code": "INSUFFICIENT_PERMISSIONS",
    "status_code": 403
}
```

(400 Bad Request) — Validation error:
```json
{
    "detail": "Price must be positive and have max 2 decimal places",
    "error_code": "VALIDATION_ERROR",
    "status_code": 400
}
```

(400 Bad Request) — Category not found:
```json
{
    "detail": "Category with ID 999 not found",
    "error_code": "CATEGORY_NOT_FOUND",
    "status_code": 400
}
```

**Validation Rules**:
- `name`: required, 1-255 chars
- `description`: optional, max 2000 chars
- `price`: required, positive, max 2 decimal places
- `category_id`: required, must reference existing category
- `is_available`: optional, defaults to true
- User must be authenticated and have admin role

**Side Effects**:
- Creates inventory record for product with `stock_quantity=0`, `low_stock_threshold=10`
- Timestamps set to current time

---

### 4. PUT /api/products/{id} — Update Product

**Purpose**: Update product fields (admin only)

**Authentication**: Required (must be admin role)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Product ID |

**Request Body** (all fields optional):
```json
{
    "name": "Organic Tomatoes (Updated)",
    "description": "Updated description",
    "price": "5.99",
    "category_id": 2,
    "is_available": false
}
```

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Organic Tomatoes (Updated)",
    "description": "Updated description",
    "price": "5.99",
    "category": {
        "id": 2,
        "name": "Organic Produce"
    },
    "is_available": false,
    "inventory": { ... },
    "created_at": "2026-05-07T12:00:00Z",
    "updated_at": "2026-05-07T12:00:00Z"
}
```

**Error Responses**:

(404 Not Found):
```json
{
    "detail": "Product not found",
    "error_code": "PRODUCT_NOT_FOUND",
    "status_code": 404
}
```

(400 Bad Request) — Category doesn't exist:
```json
{
    "detail": "Category with ID 999 not found",
    "error_code": "CATEGORY_NOT_FOUND",
    "status_code": 400
}
```

**Validation Rules**:
- At least one field must be provided
- Same field validations as POST (if provided)
- Category must exist if category_id is provided

**Side Effects**:
- `updated_at` timestamp is set to current time
- Partial updates allowed (only provided fields are updated)

---

### 5. DELETE /api/products/{id} — Delete Product

**Purpose**: Delete a product and its associated inventory (admin only)

**Authentication**: Required (must be admin role)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Product ID |

**Request Example**:
```
DELETE /api/products/1
```

**Response** (204 No Content)

**Error Responses**:

(404 Not Found):
```json
{
    "detail": "Product not found",
    "error_code": "PRODUCT_NOT_FOUND",
    "status_code": 404
}
```

(403 Forbidden) — Insufficient permissions:
```json
{
    "detail": "Only admins can delete products",
    "error_code": "INSUFFICIENT_PERMISSIONS",
    "status_code": 403
}
```

**Side Effects**:
- Product is deleted from database
- Associated inventory record is deleted (cascade delete)
- Cannot be undone without backup

---

### 6. GET /api/products/{id}/related — Get Related Products

**Purpose**: Get products in the same category (for "similar products" section)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Product ID |

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 4 | Number of related products to return (max 20) |

**Request Example**:
```
GET /api/products/1/related?limit=4
```

**Response** (200 OK):
```json
{
    "current_product_id": 1,
    "category": "Vegetables",
    "related_products": [
        {
            "id": 2,
            "name": "Bell Peppers",
            "price": "3.49",
            ...
        },
        {
            "id": 3,
            "name": "Carrots",
            "price": "2.99",
            ...
        }
    ],
    "total_in_category": 15
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

**Validation Rules**:
- `limit` must be 1-20
- Excludes the requested product from results

---

### 7. GET /api/products/search — Search Products

**Purpose**: Full-text search products by name and description

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query (1-255 chars, required) |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (1-100) |

**Request Example**:
```
GET /api/products/search?q=organic+tomato&page=1&limit=20
```

**Response** (200 OK):
```json
{
    "query": "organic tomato",
    "items": [
        {
            "id": 1,
            "name": "Organic Tomatoes",
            "description": "Fresh organic tomatoes from local farm",
            "price": "4.99",
            ...
        }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "total_pages": 1
}
```

**Error Response** (400 Bad Request):
```json
{
    "detail": "Search query must be 1-255 characters",
    "error_code": "INVALID_SEARCH_QUERY",
    "status_code": 400
}
```

**Validation Rules**:
- `q` is required and must be 1-255 characters
- Searches product name and description (case-insensitive)
- Uses SQL LIKE pattern matching initially (full-text search can be future enhancement)

---

### 8. PUT /api/products/{id}/availability — Toggle Availability

**Purpose**: Toggle product availability flag without modifying other fields

**Authentication**: Required (must be admin role)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int | Product ID |

**Request Body**:
```json
{
    "is_available": false,
    "reason": "Out of stock for quality review"
}
```

**Response** (200 OK):
```json
{
    "id": 1,
    "name": "Organic Tomatoes",
    "is_available": false,
    "updated_at": "2026-05-07T12:30:00Z"
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

**Validation Rules**:
- `is_available` must be boolean
- Reason field is optional (for auditing purposes, optional)

---

## Error Response Format

All error responses follow this standard format:

```json
{
    "detail": "Human-readable error message",
    "error_code": "MACHINE_READABLE_CODE",
    "status_code": 400
}
```

**Common HTTP Status Codes**:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK (GET/PUT successful) | Resource returned or updated |
| 201 | Created (POST successful) | New product created with ID |
| 204 | No Content (DELETE successful) | Product deleted |
| 400 | Bad Request | Validation failed, missing required field |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business logic violation (e.g., category doesn't exist) |
| 500 | Internal Server Error | Unexpected error on server |

---

## Rate Limiting (Future)

Placeholder for rate limiting headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
```

---

## Testing Checklist

- [ ] GET /api/products returns paginated list
- [ ] GET /api/products with filters (category, price range)
- [ ] GET /api/products with search/sort/pagination
- [ ] GET /api/products/{id} returns full product details
- [ ] GET /api/products/{id} returns 404 for invalid ID
- [ ] POST /api/products creates product + inventory with 201
- [ ] POST /api/products requires admin authentication
- [ ] POST /api/products rejects invalid price/category
- [ ] PUT /api/products/{id} updates product fields
- [ ] PUT /api/products/{id} returns 404 for invalid ID
- [ ] DELETE /api/products/{id} removes product + inventory
- [ ] DELETE /api/products/{id} requires admin authentication
- [ ] GET /api/products/{id}/related returns similar products
- [ ] GET /api/products/search works with query string
- [ ] PUT /api/products/{id}/availability toggles availability
