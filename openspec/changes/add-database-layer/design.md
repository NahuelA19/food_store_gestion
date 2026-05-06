## Context

Food Store is a monorepo with React frontend and FastAPI backend. The backend currently has project structure (routes, models directory structure) but no actual database connectivity. Authentication, product management, and order processing all require a robust, async-first data layer.

**Current State:**
- FastAPI app initialized in `backend/app/main.py`
- No ORM or database models
- No async database driver
- No migration system
- Test setup exists but no database fixtures

**Constraints:**
- Must use async/await throughout (FastAPI async-first principle)
- PostgreSQL required (existing infrastructure decision)
- Pydantic v2 already in use for request/response models
- No breaking changes to existing project structure
- Must support test isolation (separate test database or transactions)

## Goals / Non-Goals

**Goals:**
- Establish production-grade async database connectivity with connection pooling
- Define SQLAlchemy v2 ORM models for core entities (users, products, categories, orders)
- Implement Alembic migration framework for schema versioning
- Set up test database fixtures for pytest test isolation
- Configure environment-based database URLs (dev, test, prod)
- Document schema design and ORM usage patterns for future features

**Non-Goals:**
- Implement business logic or complete entity relationships (that's Phase 2)
- Set up caching layer (that's Change 17, Optimization phase)
- Create API endpoints (those come in Phase 2 with specific services)
- Optimize queries or add indexes (that's Change 18, Optimization phase)
- Deploy to production infrastructure (that's Phase 6)

## Decisions

### Decision 1: Use SQLAlchemy v2 with async support

**Why SQLAlchemy v2?**
- Industry standard for Python ORMs, excellent documentation
- Full async/await support via `asyncio` mode (required for FastAPI)
- Type-safe with Pydantic integration
- Easy to migrate from later (not vendor-locked)

**Why not alternatives?**
- **Tortoise ORM**: Simpler API but less mature ecosystem; harder to extend
- **Peewee**: Blocking I/O only, not suitable for async
- **Raw asyncpg**: More control but verbose, no schema abstraction

**Implementation:** Use `SQLAlchemy 2.0+` with `sqlalchemy.ext.asyncio` for async sessions. Store session factory in `backend/database/client.py`.

---

### Decision 2: Alembic for migrations (not SQLAlchemy Migrate)

**Why Alembic?**
- Gold standard for SQL migrations in Python
- Fine-grained control over schema changes
- Explicit migration files = easy code review and rollback

**Why not SQLAlchemy Migrate or no tool?**
- Without migrations, schema history is lost; no rollback strategy
- SQLAlchemy Migrate is less actively maintained

**Implementation:** Initialize Alembic in `backend/alembic/`. Each schema change requires explicit `alembic revision --autogenerate` to create migration files.

---

### Decision 3: Async connection pooling with asyncpg

**Why asyncpg?**
- Fastest async PostgreSQL driver for Python
- Fully async (no thread pool blocking)
- Direct integration with SQLAlchemy asyncio mode

**Connection pooling:**
- Use SQLAlchemy's `create_async_engine()` with `poolclass=AsyncNullPool` for test environment (no connection reuse)
- Use `poolclass=QueuePool` (default) for prod with configurable pool size (default 10 connections)

---

### Decision 4: Core entities as base models only (Phase 2 adds relationships)

**Why separate ORM models from Pydantic schemas?**
- ORM models (SQLAlchemy) describe database structure
- Pydantic models describe API contracts
- This separation allows flexible schema evolution

**Phase 1 (this change):**
- Define minimal user, product, category, order models
- Relationships NOT populated yet (that's Phase 2)

**Example:**
```python
# backend/app/models/user.py (SQLAlchemy ORM)
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]

# backend/app/schemas/user.py (Pydantic API schema)
class UserResponse(BaseModel):
    id: int
    email: str
    # No password in response
```

---

### Decision 5: Database fixture per test function (no shared state)

**Why?** Test isolation prevents flaky tests. Each test gets a clean database transaction that rolls back.

**Implementation:**
- Use `pytest` fixture with `async_session` factory
- Wrap each test in a transaction that rolls back after test completes
- `backend/tests/conftest.py` provides `db_session` fixture

---

### Decision 6: Environment-based database URLs

**Configuration hierarchy:**
1. `DATABASE_URL` environment variable (highest priority)
2. `.env` file for local dev (not committed)
3. Default fallback for CI/CD

**Structure:**
```
Development:    postgresql+asyncpg://user:password@localhost:5432/food_store_dev
Test:           postgresql+asyncpg://user:password@localhost:5432/food_store_test
Production:     postgresql+asyncpg://user:password@prod-host:5432/food_store
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Async ORM learning curve** | Medium | Team must understand async/await patterns; docs + examples provided |
| **Connection pool exhaustion** | High | Monitor pool size in production; use connection pooling library (pgBouncer if needed) |
| **Migration conflicts** | Medium | Branching strategy: each feature branch creates separate migration files; rebase squashes on main |
| **N+1 queries** | High | Design specs in Phase 2 enforce `SELECT` optimization; monitoring in Phase 5 |
| **Test database isolation failures** | Medium | Use transaction rollback strategy; PostgreSQL isolation level = READ_COMMITTED (default) |
| **Schema bloat** | Low | Regular audits; archive old migration files after year 1 |

## Migration Plan

**Deployment sequence:**
1. Create PostgreSQL database and user (CI/CD or manually)
2. Add `sqlalchemy`, `alembic`, `asyncpg` to `backend/requirements.txt`
3. Implement database connection logic in `backend/database/client.py`
4. Define ORM models in `backend/app/models/`
5. Create initial Alembic migration to set up schema
6. Add database initialization to FastAPI app startup in `backend/app/main.py`
7. Create pytest fixtures in `backend/tests/conftest.py`
8. Test end-to-end: spin up backend, verify connection + tables created

**Rollback strategy:**
- If migration fails: `alembic downgrade -1` reverts last migration
- If deployment fails: restore from backup, revert code changes

## Open Questions

1. **PostgreSQL version lock**: Should we pin PostgreSQL version (e.g., 15+) or support any 13+? Recommend: **Pin to 15+** (JSON features, performance)
2. **Soft deletes or hard deletes**: For future auditing, should we use soft deletes (deleted_at timestamp)? Recommend: **Defer to Phase 4** (adding audit log features)
3. **ORM logging**: Enable SQLAlchemy query logging in development? Recommend: **Yes, in DEBUG mode only** (helps diagnose slow queries)

---

**Related to**: `database-connection`, `orm-integration`, `database-migrations`, `core-entities` capabilities
