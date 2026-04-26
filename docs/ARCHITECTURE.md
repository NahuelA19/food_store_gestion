# System Architecture

Overview of Food Store's layered architecture and design decisions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│  React SPA (TypeScript, Vite, ESLint, Prettier)         │
│  - Components: atomic, container-presentational pattern │
│  - State: Redux/Context (TBD)                          │
│  - Routing: React Router (TBD)                         │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────────┐
│                   API LAYER                            │
│  FastAPI (Python, async/await, OpenAPI)                │
│  - Request validation: Pydantic models                  │
│  - Response serialization: JSON                         │
│  - Authentication: JWT (TBD)                            │
│  - Rate limiting: (TBD)                                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 BUSINESS LOGIC LAYER                    │
│  Services, validators, use cases                        │
│  - Product service                                      │
│  - Order service                                        │
│  - User service                                         │
│  - Payment service                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              PERSISTENCE LAYER                          │
│  Database models, queries, migrations                   │
│  - ORM: SQLAlchemy (TBD)                               │
│  - Database: PostgreSQL (Phase 2)                       │
│  - Migrations: Alembic (TBD)                           │
└────────────────────────────────────────────────────────┘
```

## Layered Architecture Principles

### 1. **Presentation Layer** (Frontend)

**Technology**: React + TypeScript

**Responsibilities**:
- Render user interface
- Handle user interactions
- Display data from backend
- Manage local UI state

**Structure**:
```
frontend/src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Form.tsx
│   └── ...
├── pages/              # Page-level components
│   ├── HomePage.tsx
│   ├── ProductPage.tsx
│   ├── CheckoutPage.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useApi.ts
│   ├── usePagination.ts
│   └── ...
├── services/           # API communication
│   ├── apiClient.ts
│   ├── productService.ts
│   └── ...
└── App.tsx            # Root component
```

**Patterns**:
- **Container/Presentational**: Smart components handle logic, dumb components handle UI
- **Atomic Design**: Build from atoms → molecules → organisms
- **Hooks**: Use custom hooks for reusable logic
- **Error Boundaries**: Catch React errors gracefully

### 2. **API Layer** (Backend)

**Technology**: FastAPI (Python)

**Responsibilities**:
- Accept HTTP requests
- Validate input with Pydantic
- Route requests to services
- Serialize responses to JSON
- Handle authentication/authorization
- Log requests

**Structure**:
```
backend/
├── app/
│   ├── main.py                 # FastAPI app, routes
│   ├── routes/                 # Endpoint definitions
│   │   ├── health.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   └── users.py
│   ├── models/                 # Pydantic request/response models
│   │   ├── product.py
│   │   ├── order.py
│   │   └── user.py
│   ├── services/               # Business logic
│   │   ├── product_service.py
│   │   ├── order_service.py
│   │   └── user_service.py
│   └── database/               # ORM, models, queries (Phase 2)
│       ├── models.py
│       ├── session.py
│       └── repositories.py
└── tests/                      # API tests with pytest
```

**Request Flow**:
```
HTTP Request
    ↓
FastAPI Router (main.py)
    ↓
Route Handler (routes/*.py)
    ↓
Pydantic Validation
    ↓
Service Logic (services/*.py)
    ↓
Database Query (database/*.py) [Phase 2]
    ↓
Pydantic Response Model
    ↓
HTTP Response (JSON)
```

### 3. **Business Logic Layer** (Services)

**Responsibilities**:
- Implement domain rules
- Perform calculations
- Coordinate between repositories
- Handle transactions
- Validate business constraints

**Example Service**:
```python
# backend/app/services/product_service.py
class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository
    
    async def get_products(self, skip: int = 0, limit: int = 10):
        # Business logic: filtering, sorting, pagination
        return await self.repository.find_all(skip, limit)
    
    async def create_product(self, product: ProductCreate):
        # Validation: check stock, pricing, etc
        if product.price < 0:
            raise ValueError("Price must be positive")
        return await self.repository.create(product)
```

### 4. **Persistence Layer** (Database)

**Technology**: PostgreSQL + SQLAlchemy (Phase 2)

**Responsibilities**:
- Define data models
- Execute queries
- Handle transactions
- Create migrations
- Connection pooling

**Will Include**:
```
backend/app/database/
├── models.py           # SQLAlchemy ORM models
├── session.py          # Database connection
├── repositories.py     # Query builders
└── migrations/         # Alembic version control
```

## Request-Response Cycle

### Example: Get Products

```
1. FRONTEND REQUEST
   GET /api/products?skip=0&limit=10
   
2. API RECEIVES REQUEST
   FastAPI validates query parameters
   
3. ROUTE HANDLER
   @app.get("/products")
   async def list_products(skip: int = 0, limit: int = 10):
   
4. SERVICE LAYER
   products = await product_service.get_products(skip, limit)
   - Apply business rules
   - Calculate derived fields
   
5. PERSISTENCE LAYER (Phase 2)
   SELECT * FROM products LIMIT 10 OFFSET 0
   
6. PYDANTIC RESPONSE MODEL
   ProductListResponse(
     products=[Product(...), ...],
     total=100
   )
   
7. API RESPONDS
   HTTP 200 OK
   {
     "products": [...],
     "total": 100
   }
   
8. FRONTEND RECEIVES
   - Parse JSON
   - Update component state
   - Re-render UI
```

## Data Models

### Phase 1 (Current)
- Basic request/response validation with Pydantic
- No persistent database

### Phase 2 (Planned)
```python
# SQLAlchemy ORM Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    price = Column(Float)
    category = Column(String)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
```

## Error Handling

### Frontend
```tsx
// Use error boundaries
<ErrorBoundary>
  <ProductList />
</ErrorBoundary>

// Handle API errors
try {
  const products = await productService.getProducts();
} catch (error) {
  if (error instanceof ApiError) {
    showErrorNotification(error.message);
  }
}
```

### Backend
```python
from fastapi import HTTPException

@app.get("/products/{id}")
async def get_product(id: int):
    product = await service.get_product(id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
```

## Authentication & Authorization (Phase 2)

```
Login Flow:
1. Frontend: POST /auth/login with credentials
2. Backend: Verify password, generate JWT token
3. Frontend: Store token in secure cookie
4. Frontend: Include token in Authorization header
5. Backend: Verify token on each request
6. Backend: Grant/deny access based on user role
```

## State Management (Phase 2)

**Frontend State Levels**:
1. **Local Component State** (useState)
2. **Form State** (React Hook Form)
3. **Global App State** (Redux or Context)
4. **Server State** (React Query - cache API responses)

## Performance Considerations

### Frontend
- Code splitting with Vite dynamic imports
- Lazy loading of routes
- Memoization of expensive components
- Virtual scrolling for long lists
- Image optimization

### Backend
- Async/await for I/O operations
- Connection pooling for database
- Caching layer (Redis - Phase 3)
- Pagination for large datasets
- Database indexing strategy

### API Response
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

## Testing Strategy

### Frontend
- Unit tests: Components, hooks, utilities
- Integration tests: User workflows
- E2E tests: Full application flow (Phase 2)

### Backend
- Unit tests: Services, validators
- Integration tests: API endpoints
- Load tests: Performance benchmarks (Phase 3)

## Deployment Architecture (Phase 2)

```
┌─────────────────────────────────┐
│     Vercel / Netlify            │
│  Frontend (React + Vite build)  │
└────────────┬────────────────────┘
             │ REST API
┌────────────▼────────────────────┐
│     Heroku / Railway            │
│  Backend (FastAPI + Uvicorn)    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│     AWS RDS / Vercel Postgres   │
│  Database (PostgreSQL)          │
└─────────────────────────────────┘
```

## Code Organization Principles

1. **Single Responsibility**: Each file/module has one job
2. **DRY (Don't Repeat Yourself)**: Reusable components and utilities
3. **Separation of Concerns**: Clear boundaries between layers
4. **Testability**: Easy to write tests
5. **Scalability**: Structure supports growth

## Next Steps

1. **Phase 2**: Add PostgreSQL database layer
2. **Phase 2**: Implement authentication (JWT)
3. **Phase 2**: Add caching layer (Redis)
4. **Phase 3**: Performance optimization
5. **Phase 3**: Monitoring & logging
