# API Documentation Template

Template and guidelines for documenting Food Store API endpoints.

## Endpoint Documentation Format

### GET /products

**Description**: Retrieve a list of products with optional filtering and pagination.

**Path Parameters**: None

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Number of products to skip (pagination) |
| limit | integer | 10 | Maximum products to return (1-100) |
| category | string | null | Filter by product category |
| min_price | number | 0 | Minimum product price |
| max_price | number | null | Maximum product price |
| search | string | null | Search term for product name |

**Request Headers**: None

**Request Body**: N/A

**Response Code**: 200 OK

**Response Content-Type**: application/json

**Response Body**:
```json
{
  "products": [
    {
      "id": "123",
      "name": "Deluxe Pizza",
      "price": 15.99,
      "category": "Pizza",
      "description": "Topped with premium ingredients",
      "image_url": "https://example.com/pizza.jpg",
      "in_stock": true
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 10,
    "total": 150
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid query parameters
  ```json
  { "detail": "Limit must be between 1 and 100" }
  ```
- 500 Internal Server Error: Server error

**Example Requests**:

cURL:
```bash
curl -X GET 'http://localhost:8000/products?category=Pizza&min_price=10&limit=5'
```

JavaScript:
```javascript
const response = await fetch(
  '/api/products?category=Pizza&min_price=10&limit=5'
);
const data = await response.json();
console.log(data.products);
```

Python:
```python
import requests

response = requests.get('/products', params={
    'category': 'Pizza',
    'min_price': 10,
    'limit': 5
})
products = response.json()['products']
```

---

### POST /products

**Description**: Create a new product (admin only).

**Path Parameters**: None

**Query Parameters**: None

**Request Headers**:
| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Content-Type | application/json | Yes | Request body format |
| Authorization | Bearer <token> | Yes | JWT authentication token |

**Request Body**:
```json
{
  "name": "Deluxe Pizza",
  "price": 15.99,
  "category": "Pizza",
  "description": "Topped with premium ingredients",
  "image_url": "https://example.com/pizza.jpg",
  "stock_quantity": 50
}
```

**Response Code**: 201 Created

**Response Body**:
```json
{
  "id": "new-product-id-123",
  "name": "Deluxe Pizza",
  "price": 15.99,
  "category": "Pizza",
  "description": "Topped with premium ingredients",
  "image_url": "https://example.com/pizza.jpg",
  "stock_quantity": 50,
  "created_at": "2024-04-26T12:34:56Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid input
  ```json
  {
    "detail": [
      { "loc": ["name"], "msg": "Name is required" }
    ]
  }
  ```
- 401 Unauthorized: Invalid or missing token
- 403 Forbidden: User doesn't have admin role
- 409 Conflict: Product already exists

**Example Requests**:

cURL:
```bash
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Deluxe Pizza",
    "price": 15.99,
    "category": "Pizza"
  }'
```

JavaScript:
```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Deluxe Pizza',
    price: 15.99,
    category: 'Pizza'
  })
});

const newProduct = await response.json();
console.log(newProduct.id);
```

---

### GET /products/{id}

**Description**: Retrieve a specific product by ID.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Unique product identifier |

**Query Parameters**: None

**Response Code**: 200 OK

**Response Body**:
```json
{
  "id": "123",
  "name": "Deluxe Pizza",
  "price": 15.99,
  "category": "Pizza",
  "description": "Topped with premium ingredients",
  "image_url": "https://example.com/pizza.jpg",
  "in_stock": true,
  "reviews": [
    {
      "user_id": "user-123",
      "rating": 5,
      "comment": "Excellent!",
      "created_at": "2024-04-20T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- 404 Not Found: Product doesn't exist
  ```json
  { "detail": "Product not found" }
  ```

**Example Requests**:

cURL:
```bash
curl -X GET http://localhost:8000/products/123
```

---

### DELETE /products/{id}

**Description**: Delete a product (admin only).

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product ID to delete |

**Request Headers**:
| Header | Required |
|--------|----------|
| Authorization | Yes |

**Response Code**: 204 No Content

**Example Requests**:

cURL:
```bash
curl -X DELETE http://localhost:8000/products/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Authentication

All endpoints requiring authentication use JWT tokens in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**To get a token**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "detail": "Error message or array of validation errors"
}
```

**Status Codes**:
- 200: Success
- 201: Created
- 204: No content (success, no response body)
- 400: Bad request (validation error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (permission denied)
- 404: Not found
- 409: Conflict (duplicate resource)
- 500: Internal server error

---

## Pagination

For endpoints returning lists, use this format:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "total_pages": 50
  }
}
```

Query parameters:
- `page` (integer): Page number (1-indexed)
- `limit` (integer): Items per page (default 10, max 100)

---

## Rate Limiting

API rate limits (Phase 2):
- 1000 requests per hour per API key
- Rate limit headers:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1682503200
  ```

---

## API Base URL

- **Development**: `http://localhost:8000`
- **Staging**: `https://api-staging.foodstore.com`
- **Production**: `https://api.foodstore.com`

---

## Versions

**Current Version**: v1

API versioning is done via URL prefix: `/api/v1/`

---

## Documentation Template Checklist

For each endpoint, document:
- [ ] Endpoint URL and HTTP method
- [ ] Description
- [ ] Path parameters
- [ ] Query parameters
- [ ] Request headers
- [ ] Request body (with example JSON)
- [ ] Response status codes
- [ ] Response body (with example JSON)
- [ ] Error responses
- [ ] Example cURL request
- [ ] Example JavaScript/Python request
- [ ] Authentication requirements
- [ ] Rate limit info

---

## Interactive API Documentation

Access interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Changelog

### v1.0.0 (2024-04-26)
- Initial API release
- Products endpoints
- Health check endpoint

### v1.1.0 (Planned)
- User authentication
- Orders endpoints
- Payments integration
