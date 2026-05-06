# Database Layer — Food Store API

This document covers the PostgreSQL database layer implementation for Food Store, including connection management, ORM models, and migration strategies.

## Quick Start

### Environment Setup

```bash
# Create a PostgreSQL database
createdb food_store

# Set environment variable
export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/food_store"

# Run migrations
cd backend
alembic upgrade head
```

### Connection String

The connection string uses SQLAlchemy's async dialect with asyncpg:

```
postgresql+asyncpg://user:password@host:port/database
```

Components:
- `user`: PostgreSQL username
- `password`: PostgreSQL user password
- `host`: Database server hostname (default: localhost)
- `port`: Database server port (default: 5432)
- `database`: Database name

## Architecture

### Connection Pool

Food Store uses a **context-dependent pooling strategy**:

- **Production** (`ENVIRONMENT=production`): `QueuePool` with 20 connections, 10 overflow
- **Development/Test** (`ENVIRONMENT=test`): `AsyncNullPool` (no pooling, test isolation)

Pool configuration in `backend/database/client.py`:

```python
poolclass = AsyncNullPool if environment == "test" else QueuePool
```

### Async-First Design

All database operations are **100% async**:
- Engine: `create_async_engine()` from SQLAlchemy
- Session: `AsyncSession` with `async_sessionmaker`
- Queries: `await session.execute()`
- Lifespan: `engine.dispose()` on shutdown

### ORM Models

SQLAlchemy v2 with `Mapped[]` type hints. All models inherit from `Base`:

```python
class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime]  # from TimestampMixin
```

## Models

### User

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INT PRIMARY KEY` | Auto-incremented |
| `email` | `VARCHAR(255) UNIQUE` | Indexed, required |
| `hashed_password` | `VARCHAR(255)` | Bcrypt hash |
| `is_active` | `BOOLEAN DEFAULT true` | Indexed |
| `created_at` | `TIMESTAMP WITH TZ` | Auto-set UTC now |
| `updated_at` | `TIMESTAMP WITH TZ` | Auto-updated |

### Category

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INT PRIMARY KEY` | Auto-incremented |
| `name` | `VARCHAR(255) UNIQUE` | Product category name |
| `description` | `VARCHAR(1000)` | Optional |
| `created_at` | `TIMESTAMP WITH TZ` | Auto-set UTC now |

### Product

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INT PRIMARY KEY` | Auto-incremented |
| `name` | `VARCHAR(255)` | Indexed |
| `description` | `VARCHAR(2000)` | Optional |
| `price` | `NUMERIC(10,2)` | Currency with 2 decimals |
| `category_id` | `INT FK` | Foreign key to categories, RESTRICT delete |
| `is_available` | `BOOLEAN DEFAULT true` | Indexed |
| `created_at` | `TIMESTAMP WITH TZ` | Auto-set UTC now |
| `updated_at` | `TIMESTAMP WITH TZ` | Auto-updated |

### Order

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INT PRIMARY KEY` | Auto-incremented |
| `user_id` | `INT FK` | Foreign key to users, RESTRICT delete |
| `status` | `ENUM` | pending, confirmed, shipped, delivered, cancelled |
| `total_amount` | `NUMERIC(12,2)` | Order total |
| `created_at` | `TIMESTAMP WITH TZ` | Auto-set UTC now |
| `updated_at` | `TIMESTAMP WITH TZ` | Auto-updated |

### OrderItem

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INT PRIMARY KEY` | Auto-incremented |
| `order_id` | `INT FK` | Foreign key to orders, CASCADE delete |
| `product_id` | `INT FK` | Foreign key to products, RESTRICT delete |
| `quantity` | `INT` | Items in this line |
| `unit_price` | `NUMERIC(10,2)` | Price at time of order |

## Migrations

### Generate Migration

```bash
cd backend
alembic revision --autogenerate -m "Description"
```

### Apply Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply specific revision
alembic upgrade <revision_id>

# Check current revision
alembic current

# View migration history
alembic history --verbose
```

### Rollback

```bash
# Rollback one step
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>
```

### Migration Location

Migrations live in `backend/alembic/versions/`. Each file contains:
- `upgrade()`: DDL to apply
- `downgrade()`: DDL to reverse

**Example migration**:

```python
def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )

def downgrade() -> None:
    op.drop_table('users')
```

## Dependency Injection

Use the `get_db_session` dependency in FastAPI routes:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.session import get_db_session

router = APIRouter()

@router.get("/products")
async def list_products(session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(Product))
    return result.scalars().all()
```

## Entity Relationship Diagram (ERD)

```
┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ hashed_password  │
│ is_active        │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         │
    ┌────▼──────────┐
    │    orders      │
    ├────────────────┤
    │ id (PK)        │
    │ user_id (FK)   │
    │ status (ENUM)  │
    │ total_amount   │
    │ created_at     │
    │ updated_at     │
    └───┬──────────┬─┘
        │ 1:N      │
        │          │
   ┌────▼────┐  ┌─┴─────────────────┐
   │order_    │  │    categories     │
   │items     │  ├───────────────────┤
   ├──────────┤  │ id (PK)           │
   │ id (PK)  │  │ name (UNIQUE)     │
   │order_id  │  │ description       │
   │product_id   │ created_at        │
   │quantity  │  └────────┬──────────┘
   │unit_price   │        │
   └──────────┬──┘        │ N:1
              │           │
              │      ┌────▼──────────┐
              │      │   products    │
              │      ├───────────────┤
              └─────→│ id (PK)       │
                     │ name          │
                     │ description   │
                     │ price         │
                     │category_id(FK)│
                     │ is_available  │
                     │ created_at    │
                     │ updated_at    │
                     └───────────────┘
```

## Constraints

### Foreign Keys

- `products.category_id` → `categories.id` (RESTRICT on delete)
- `orders.user_id` → `users.id` (RESTRICT on delete)
- `order_items.order_id` → `orders.id` (CASCADE on delete)
- `order_items.product_id` → `products.id` (RESTRICT on delete)

### Unique Constraints

- `users.email` (case-sensitive)
- `categories.name` (case-sensitive)

### Check Constraints (application-enforced)

- `product.price > 0`
- `order_item.quantity >= 1`

## Testing

### Test Database

Tests use a separate test database with `AsyncNullPool`:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost/food_store_test pytest
```

### Test Fixtures

See `backend/tests/conftest.py`:

```python
@pytest.fixture
async def get_test_db_session():
    """Isolated database session for each test."""
    # Creates fresh tables, yields session, rolls back
```

### Smoke Tests

Run `backend/tests/test_database.py`:

```bash
pytest backend/tests/test_database.py -v
```

Tests verify:
1. Database connectivity
2. User CRUD operations
3. Transaction isolation
4. Unique constraint enforcement

## Performance Tuning

### Indexes

Indexes are created on frequently-queried columns:

```sql
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_orders_user_id ON orders (user_id);
```

All foreign keys are automatically indexed.

### Connection Pooling

- **Pool size**: 20 connections (production)
- **Max overflow**: 10 additional connections
- **Timeout**: Default 30 seconds
- **Recycle**: Connections recycled after 3600 seconds

### Query Optimization

1. Always use prepared statements (SQLAlchemy does this automatically)
2. Avoid `SELECT *` — name columns explicitly
3. Use JOINs instead of N+1 queries
4. Leverage `STRING_AGG` for aggregations

## Troubleshooting

### Connection Refused

```
asyncpg.exceptions.ClientError: could not connect to the server
```

**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.

```bash
psql -U user -h localhost -c "SELECT 1"
```

### Authentication Failed

```
asyncpg.exceptions.InvalidPasswordError: password authentication failed
```

**Solution**: Check credentials in `DATABASE_URL`.

### Unique Constraint Violation

```
sqlalchemy.exc.IntegrityError: ...duplicate key value violates unique constraint
```

**Solution**: Ensure unique fields (email, category name) don't already exist.

---

**Last Updated**: 2026-05-06  
**Author**: Food Store Development Team  
**Version**: 1.0.0
