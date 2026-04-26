# Adding a Backend Route

Step-by-step guide to adding a new API endpoint to the Food Store backend.

## Example: Add a "Featured Products" Endpoint

### Step 1: Create the Route Handler

**File**: `backend/app/routes/products.py`

```python
from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/featured")
async def get_featured_products(limit: int = 5):
    """Get featured products for homepage."""
    return {
        "products": [
            {
                "id": "1",
                "name": "Deluxe Pizza",
                "price": 15.99,
                "featured": True
            },
            # ... more products
        ]
    }
```

### Step 2: Register Route in Main App

**File**: `backend/app/main.py`

```python
from app.routes.products import router as products_router

# Include router
app.include_router(products_router)
```

### Step 3: Test the Endpoint

```bash
# Start server
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload

# Test in another terminal
curl http://localhost:8000/products/featured

# Or visit: http://localhost:8000/docs
# (interactive API documentation)
```

### Step 4: Add Error Handling

```python
from fastapi import HTTPException

@router.get("/featured")
async def get_featured_products(limit: int = 5):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be 1-100")
    
    return {"products": []}
```

### Step 5: Use Pydantic Models

```python
from pydantic import BaseModel

class Product(BaseModel):
    id: str
    name: str
    price: float
    featured: bool

class FeaturedProductsResponse(BaseModel):
    products: list[Product]

@router.get("/featured", response_model=FeaturedProductsResponse)
async def get_featured_products(limit: int = 5):
    return FeaturedProductsResponse(products=[])
```

### Step 6: Write Tests

**File**: `backend/tests/test_products.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_featured_products():
    response = client.get("/products/featured")
    assert response.status_code == 200
    assert "products" in response.json()

def test_featured_products_limit_validation():
    response = client.get("/products/featured?limit=101")
    assert response.status_code == 400
```

### Step 7: Format & Lint

```bash
cd backend
black .                    # Format
ruff check . --fix        # Lint & fix
python -m pytest          # Test
```

## Route Best Practices

1. **Naming**: Use descriptive, action-oriented names
   - ✅ GET `/products/featured`
   - ✅ POST `/orders/`
   - ❌ GET `/get_all_products`

2. **Methods**:
   - GET: Retrieve data (no side effects)
   - POST: Create new resources
   - PUT/PATCH: Update resources
   - DELETE: Remove resources

3. **Status Codes**:
   - 200: Success
   - 201: Created
   - 400: Bad request
   - 404: Not found
   - 500: Server error

4. **Response Format**:
   ```json
   {
     "data": [...],
     "meta": {
       "page": 1,
       "total": 100
     }
   }
   ```

5. **Error Handling**:
   ```python
   from fastapi import HTTPException
   
   raise HTTPException(status_code=400, detail="Invalid input")
   ```

## Common Patterns

### Pagination

```python
@router.get("/products")
async def list_products(skip: int = 0, limit: int = 10):
    if limit > 100:
        limit = 100
    return {
        "products": [],
        "pagination": {
            "skip": skip,
            "limit": limit,
            "total": 1000
        }
    }
```

### Filtering

```python
@router.get("/products")
async def list_products(category: str = None, min_price: float = 0):
    # Build query based on filters
    return {"products": []}
```

### Creating Resources

```python
from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    price: float
    description: str = ""

@router.post("/products", status_code=201)
async def create_product(product: ProductCreate):
    # Save to database (Phase 2)
    return {
        "id": "new-id",
        **product.dict()
    }
```

### Authentication (Phase 2)

```python
from fastapi import Depends, HTTPException
from app.security import verify_token

@router.post("/orders")
async def create_order(order: OrderCreate, user_id: str = Depends(verify_token)):
    return {"order_id": "123", "user_id": user_id}
```

## Checklist

- [ ] Created route in appropriate file
- [ ] Registered router in `main.py`
- [ ] Added Pydantic request/response models
- [ ] Added docstring to endpoint
- [ ] Added error handling with proper status codes
- [ ] Formatted with `black`
- [ ] Linted with `ruff`
- [ ] Wrote tests
- [ ] All tests pass
- [ ] Tested with curl or Swagger UI
