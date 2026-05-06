## Why

Food Store requires a robust, scalable data persistence layer. Currently, the monorepo has project structure and CI/CD in place, but no database schema or ORM integration. Without a production-grade database layer, we cannot implement any data-driven features (authentication, products, orders). This is a critical blocker for Phase 2 development.

## What Changes

- Add PostgreSQL database setup with async connection pooling (`asyncpg`)
- Implement SQLAlchemy v2 ORM with async support for schema definition
- Create Alembic migration system for version control of schema changes
- Configure database connection, transaction management, and error handling in FastAPI
- Define core entity schemas (users, products, categories, orders) as ORM models
- Set up database initialization and seed scripts
- Add environment-based database configuration (dev, test, prod)

## Capabilities

### New Capabilities

- `database-connection`: PostgreSQL connection pooling, async driver configuration, connection lifecycle management
- `orm-integration`: SQLAlchemy v2 async ORM, model definitions, relationships, type hints
- `database-migrations`: Alembic migration framework, schema versioning, rollback strategy
- `core-entities`: Data models for users, products, categories, orders (domain entities)

### Modified Capabilities

- None (no existing specs are changing in behavior)

## Impact

- **Backend**: `backend/app/main.py` modified to add database initialization; new `backend/app/models/` directory for ORM models; new `backend/database/` directory for connection/transaction logic
- **Database**: PostgreSQL required in dev/test/prod environments; connection string via `DATABASE_URL` env var
- **Dependencies**: SQLAlchemy v2, Alembic, asyncpg added to `backend/requirements.txt`
- **Testing**: Database fixtures required in `backend/tests/conftest.py` for test isolation
- **CI/CD**: GitHub Actions workflows updated to spin up PostgreSQL service container

---

**Related Changes**: Blocks `implement-authentication` (Change 3), `create-user-service` (Change 4), `create-product-service` (Change 5), and all Phase 2+ changes that require data persistence.
