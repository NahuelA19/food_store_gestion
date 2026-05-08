# Engram Team Memory Export — Food Store Project

**Exported**: 2026-05-08 13:17:00  
**Project**: food_store_gestion  
**Scope**: Project-level decisions, architecture, discoveries, and session summaries  

---

## PostgreSQL Setup: Configuration & Permissions

- **Type**: config
- **Date**: 2026-05-06

**What**: Configured PostgreSQL 18.3 with food_store database, food_store_user with proper permissions, and Alembic migration tracking

**Why**: PostgreSQL was installed but not configured for the project; .env had hardcoded wrong credentials; Alembic needed to track migrations

**Where**:
- `backend/.env` — DATABASE_URL fixed with correct credentials
- Alembic migration tracking in PostgreSQL (alembic_version table)
- `backend/tests/conftest.py` — PostgreSQL connection for test fixtures

**Learned**: Must verify both production and test database names exist and user has correct role grants (CONNECT, CREATE)

---

## OPSX Change 2 COMPLETE: add-database-layer Fully Implemented

- **Type**: architecture
- **Topic Key**: opsx/add-database-layer/complete
- **Date**: 2026-05-06

**What**: Completed full implementation of OPSX Change 2 (add-database-layer) — all 48 tasks done, code committed

**Why**: Change 2 establishes the database foundation needed to unblock Change 3 (authentication) and all Phase 2 features. Was required before any data-driven functionality could be implemented

**Where**:
- Backend: backend/database/, backend/app/models/ (5 ORM entities), backend/alembic/
- Tests: backend/tests/conftest.py, backend/tests/test_database.py
- Docs: docs/DATABASE.md, docs/DATABASE_SETUP.md
- Commits: 5f1d749, b957ded

**Key Implementation Details**:
- SQLAlchemy v2 with async/await (asyncpg driver, NullPool)
- 5 core ORM entities: User, Category, Product, Order, OrderItem (all with Mapped[] type hints)
- Alembic auto-generated initial schema with 3 migrations
- FastAPI async session injection via Depends(get_db_session)
- Database health endpoint: GET /health/db
- Test fixtures with transaction rollback per test for isolation
- PostgreSQL 15 service in GitHub Actions workflow

**Learned**: Module-level engine initialization causes import issues — needed lazy loading. Alembic requires explicit async context in env.py. ORM models separate from Pydantic schemas prevents architecture pollution.

---

## Change 3 Migration Bug: Duplicate CREATE TYPE Orderstatus

- **Type**: bugfix
- **Date**: 2026-05-07

**What**: Fixed migration initial_schema.py which was creating ENUM orderstatus twice — once with op.execute() and once implicitly via sa.Enum()

**Why**: The duplicate CREATE TYPE statement caused DuplicateObjectError on clean databases, blocking migration execution

**Where**: backend/alembic/versions/1c78cfd1cfce_initial_schema.py

**Learned**: SQLAlchemy's sa.Enum() automatically creates the type if it doesn't exist. Never manually execute CREATE TYPE when using sa.Enum() — the ORM handles it. httpx 0.28.1 requires ASGITransport instead of deprecated AsyncClient(app=...).

---

## Change 4 (create-user-service): PostgreSQL Migration Complete

- **Type**: architecture
- **Date**: 2026-05-07

**What**: Completed PostgreSQL migration setup for Change 4 — all 3 migrations applied successfully (initial_schema → add_user_profiles → add_role_column). Database verified with 12 tables: users, user_preferences, products, categories, orders, etc.

**Why**: Change 4 requires a fully functional PostgreSQL schema to support user management features. Previous run had duplicate CREATE TYPE bug blocking execution.

**Where**:
- backend/alembic/versions/ — 3 migrations applied
- Backend database: food_store (12 tables verified)
- backend/tests/conftest.py — Fixed for httpx 0.28.1 with ASGITransport
- Commit: ae2205f

**Learned**: 
- 49 tests pass but 48 tests fail with ScopeMismatch on async fixtures (pytest-asyncio + Python 3.13 issue)
- Pytest.ini needs `asyncio_default_fixture_loop_scope = session` to work
- May need per-fixture loop_scope configuration for full compatibility

---

## Pulled Teammate Changes: Changes 5 & 6 Archived

- **Type**: discovery
- **Date**: 2026-05-08

**What**: Synced local repo with teammate's pushed changes — Changes 5 (create-product-service, 260 tasks) and 6 (build-search-and-filtering, 330 tasks) both archived with full implementation

**Why**: Teammate advanced significantly ahead; code was pushed and ready to sync locally

**Where**: 76 files changed across:
- Backend: backend/app/routes/products.py, backend/app/routes/categories.py, backend/app/routes/inventory.py, backend/app/routes/search.py
- Frontend: frontend/src/api/productApi.ts, frontend/src/components/* (ProductCard, ProductGrid, FilterPanel, SearchBar, SearchResults, etc.)
- Database: backend/alembic/versions/20260507131242_add_inventory_table_and_indexes.py, 20260508003720_add_fts_search_index.py
- Docker: docker-compose.yml, .dockerignore, backend/.env.docker-example, docker/init-db.sql
- Docs: docs/DOCKER-SETUP.md, scripts/setup-dev.sh
- OPSX archives: openspec/changes/archive/2026-05-07-create-product-service/, openspec/changes/archive/2026-05-08-build-search-and-filtering/

**Learned**: 
- Change 5 includes backend (products, categories, inventory CRUD endpoints) + frontend UI + 260 implementation tasks
- Change 6 includes FTS search with database indexes + React UI components (SearchBar, SearchResults, Pagination) + filtering logic + 330 implementation tasks
- Docker Compose setup available for local dev (PostgreSQL on port 5433)
- Scripts/setup-dev.sh for automated environment setup

---

## OPSX Workflow & Phase Progress

- **Type**: architecture
- **Topic Key**: opsx/workflow-status
- **Date**: 2026-05-08

**What**: Food Store is following OPSX (OpenSpec) change management workflow. Completed Changes: 1 (foundation), 2 (database), 3 (authentication), 4 (user-service), 5 (product-service), 6 (search-filtering). Currently all archived — ready for Change 7 or next phase.

**Why**: OPSX provides fluid, CLI-driven artifact management. Each Change has proposal → design → specs → tasks → implementation → archive lifecycle.

**Where**: openspec/changes/, openspec/specs/

**Learned**:
- OPSX CLI (openspec status, openspec list, openspec new change, etc.) is the source of truth
- All changes are proposable, designable, appliable, and archivable at any time (no rigid phase gates)
- Each change is 50-330 tasks depending on scope
- Finished changes move to openspec/changes/archive/YYYY-MM-DD-<name>/

---

## Key Technologies & Architecture

- **Type**: architecture
- **Topic Key**: architecture/tech-stack
- **Date**: 2026-05-08

**Stack**:
- Backend: FastAPI (Python 3.10+), SQLAlchemy v2 (async), Pydantic v2, Alembic (migrations), pytest + pytest-asyncio (testing)
- Frontend: React 18, TypeScript, Vite, Vitest
- Database: PostgreSQL 16 (asyncpg driver)
- Infrastructure: Docker Compose, GitHub Actions (CI/CD)
- Monorepo: npm workspaces + Husky + commitlint

**Key Patterns**:
- FastAPI: async-first, all routes use `async def`, Pydantic models for validation, HTTPException for errors
- Frontend: functional components, TypeScript strict mode, custom hooks (useFilters, useProducts, useSearch), container/presentational split
- Database: SQLAlchemy ORM with Mapped[] type hints, Alembic for versioning, NullPool for test isolation
- Testing: pytest fixtures with transaction rollback, Vitest for React components
- Commits: Conventional Commits enforced (feat, fix, docs, test, etc.)

---

## Next Steps & Open Items

- **Type**: discovery
- **Date**: 2026-05-08

**Current Status**:
- ✅ Changes 1-6 all archived (foundation → DB → auth → users → products → search/filtering)
- ⏳ 48 async fixture tests failing on Change 4 due to pytest-asyncio + Python 3.13 compatibility
- 📋 Next: Propose and implement Change 7 or fix remaining test issues

**Known Issues**:
- pytest-asyncio ScopeMismatch errors need fixture refactoring (per-fixture loop_scope)
- httpx 0.28.1 requires ASGITransport (deprecation handled)
- Docker Compose available but not yet verified in CI/CD

**Recommended Next Actions**:
1. Fix async fixture issues in backend/tests/conftest.py (affects all 4+ DB tests)
2. Verify docker-compose.yml works end-to-end
3. Consider next change: more admin features, reporting, or scaling optimizations
4. Export this memory periodically to keep team context in sync

---

*Last updated: 2026-05-08 | Exported by OPSX Orchestrator*
