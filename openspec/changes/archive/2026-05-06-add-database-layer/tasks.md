## 1. Dependencies & Environment Setup

- [x] 1.1 Add SQLAlchemy, asyncpg, Alembic to `backend/requirements.txt`
- [x] 1.2 Create `.env.example` template with `DATABASE_URL` placeholder
- [x] 1.3 Install dependencies: `pip install -r backend/requirements.txt`
- [x] 1.4 Verify asyncpg and SQLAlchemy installations with `python -c "import sqlalchemy; import asyncpg; print('OK')"`

## 2. Database Connection Infrastructure

- [x] 2.1 Create `backend/database/` directory with `__init__.py`
- [x] 2.2 Create `backend/database/client.py` with async engine creation function
  - Implement `create_async_engine()` with SQLAlchemy async mode
  - Configure connection pooling (QueuePool for prod, AsyncNullPool for test)
  - Handle `DATABASE_URL` from environment variables with fallback defaults
- [x] 2.3 Create `backend/database/session.py` with `AsyncSessionLocal` factory
  - Define `get_db_session()` dependency for FastAPI route injection
  - Implement proper session lifecycle (create, commit/rollback, close)
- [x] 2.4 Implement database startup/shutdown hooks in `backend/app/main.py`
  - Add async `lifespan` context manager
  - Initialize engine and test connection on startup
  - Close engine on shutdown

## 3. ORM Base Model & Core Entity Models

- [x] 3.1 Create `backend/app/models/` directory with `__init__.py`
- [x] 3.2 Create `backend/app/models/base.py` with declarative base
  - Define `Base` class for all ORM models
  - Add timestamps mixin (`created_at`, `updated_at` with server defaults)
- [x] 3.3 Create `backend/app/models/user.py` with User ORM model
  - Fields: `id`, `email`, `hashed_password`, `is_active`, `created_at`, `updated_at`
  - Unique constraint on `email`
  - Type hints with SQLAlchemy `Mapped[]` syntax
- [x] 3.4 Create `backend/app/models/category.py` with Category ORM model
  - Fields: `id`, `name`, `description`, `created_at`
  - Unique constraint on `name`
- [x] 3.5 Create `backend/app/models/product.py` with Product ORM model
  - Fields: `id`, `name`, `description`, `price` (DECIMAL), `category_id`, `is_available`, `created_at`, `updated_at`
  - Foreign key to Category
  - Price validation (DECIMAL(10, 2))
- [x] 3.6 Create `backend/app/models/order.py` with Order ORM model
  - Fields: `id`, `user_id`, `status` (enum), `total_amount` (DECIMAL), `created_at`, `updated_at`
  - Foreign key to User
  - Enum for status: pending, confirmed, shipped, delivered, cancelled
- [x] 3.7 Create `backend/app/models/order_item.py` with OrderItem ORM model
  - Fields: `id`, `order_id`, `product_id`, `quantity`, `unit_price` (DECIMAL)
  - Foreign keys to Order and Product
  - Cascade delete from Order
  - Quantity validation (>= 1)
- [x] 3.8 Export all models from `backend/app/models/__init__.py`

## 4. Alembic Migration Setup

- [x] 4.1 Initialize Alembic: `alembic init backend/alembic`
- [x] 4.2 Configure `backend/alembic/env.py`
  - Set `sqlalchemy.url` to use `DATABASE_URL` from environment
  - Configure async support with `sqlalchemy.ext.asyncio`
  - Import `Base.metadata` from ORM models
- [x] 4.3 Update `backend/alembic.ini`
  - Set `sqlalchemy.url = sqlite:///./test.db` (placeholder for env var override)
  - Configure logging level
- [x] 4.4 Create initial migration: `alembic revision --autogenerate -m "Initial schema"`
  - Verify migration file includes all tables (users, categories, products, orders, order_items)
  - Check for proper CREATE TABLE with constraints, indexes, foreign keys
- [x] 4.5 Test initial migration forward: `alembic upgrade head` (verify tables created)
- [x] 4.6 Test migration rollback: `alembic downgrade -1` (verify DROP TABLE works)
- [x] 4.7 Run upgrade again: `alembic upgrade head` (verify idempotency)

## 5. FastAPI Integration & Dependency Injection

- [x] 5.1 Register database session dependency in `backend/app/main.py`
  - Import `get_db_session` from `backend/database/session.py`
  - Define Depends for route handlers to inject session
- [x] 5.2 Create test endpoint to verify database connectivity
  - Route: `GET /api/health/db`
  - Returns: `{"status": "connected", "database": "PostgreSQL", "pool_size": N}`
- [x] 5.3 Test endpoint manually with `curl http://localhost:8000/api/health/db`
- [x] 5.4 Update `backend/app/main.py` documentation/README with database setup instructions

## 6. Test Database Setup & Fixtures

- [x] 6.1 Create `backend/tests/conftest.py` with pytest fixtures
  - `pytest_configure` hook to run migrations on test database
  - `db_session` fixture providing AsyncSession for each test
  - Transaction rollback after each test for isolation
- [x] 6.2 Implement `get_test_db_session()` that overrides production session
  - Use test `DATABASE_URL` (e.g., `food_store_test`)
  - Configure to use transactions for rollback per test
- [x] 6.3 Create `backend/tests/test_database.py` with smoke tests
  - Test 1: Database connection succeeds on app startup
  - Test 2: Session can execute simple query (SELECT 1)
  - Test 3: Transaction rollback isolates test data
  - Test 4: Duplicate insert violates unique constraint (expected behavior)

## 7. GitHub Actions CI/CD Update

- [x] 7.1 Update `.github/workflows/test.yml` to spin up PostgreSQL service container
  - Image: `postgres:15-alpine`
  - Environment: `POSTGRES_PASSWORD=test`, `POSTGRES_DB=food_store_test`
  - Port mapping: 5432
- [x] 7.2 Update test step to set `DATABASE_URL` environment variable in workflow
  - `DATABASE_URL=postgresql+asyncpg://postgres:test@localhost:5432/food_store_test`
- [x] 7.3 Update backend tests to run with `python -m pytest backend/tests/`
- [x] 7.4 Verify GitHub Actions workflow passes with all tests green

## 8. Documentation & Examples

- [x] 8.1 Create `docs/DATABASE.md` with:
  - Connection string format and examples
  - How to run migrations (`alembic upgrade head`)
  - How to create new migrations (`alembic revision --autogenerate -m "message"`)
  - Entity relationship diagram (ER diagram in text or Mermaid)
  - ORM model examples (how to query, insert, update)
- [x] 8.2 Create `docs/DATABASE_SETUP.md` with local development setup
  - PostgreSQL installation instructions
  - Database and user creation
  - Environment variable setup
  - How to run initial schema setup
- [x] 8.3 Add example route using database session in `backend/app/routes/health.py`
  - Query user count from database
  - Handle database errors gracefully
- [x] 8.4 Update root `README.md` with link to DATABASE.md

## 9. Verification & Quality Assurance

- [x] 9.1 Run full test suite: `python -m pytest backend/tests/ -v`
  - All tests pass
  - No warnings or errors
- [x] 9.2 Check code style: `ruff check backend/`
- [x] 9.3 Check type hints: `mypy backend/`
  - No type errors
- [x] 9.4 Manual verification:
  - Start backend: `uvicorn backend.app.main:app --reload`
  - Call health endpoint: `curl http://localhost:8000/api/health/db`
  - Verify response includes database info
- [x] 9.5 Verify migrations are properly tracked:
  - Run `alembic history --verbose`
  - Confirm "Initial schema" migration is listed
  - Confirm `alembic current` shows correct revision
- [x] 9.6 Test edge cases:
  - Duplicate email insertion (should fail with unique constraint)
  - Orphaned product insertion (missing category_id, should fail)
  - Order with invalid status (should fail with enum constraint)

## 10. Git & Commit

- [x] 10.1 Add all files to staging: `git add backend/ .github/ docs/`
- [x] 10.2 Create commit with conventional commit message:
  - Message: `feat(database): add PostgreSQL ORM with SQLAlchemy and Alembic migrations`
- [x] 10.3 Verify commit: `git log -1 --oneline`
- [x] 10.4 Push to repository (or create PR if on feature branch)

---

## Summary

This change establishes the complete database foundation for Food Store:
- **Connection**: PostgreSQL async connection pooling with asyncpg
- **ORM**: SQLAlchemy v2 models for 5 core entities (User, Category, Product, Order, OrderItem)
- **Migrations**: Alembic framework for version-controlled schema changes
- **Testing**: pytest fixtures with transaction rollback for test isolation
- **CI/CD**: GitHub Actions with PostgreSQL service container

**Total Tasks**: 37 (organized across 10 sections)
**Estimated Duration**: 3-5 days (depending on team experience with async Python + SQLAlchemy)
**Blocks**: Change 3 (authentication) and all Phase 2 features requiring data persistence
