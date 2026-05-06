## ADDED Requirements

### Requirement: PostgreSQL connection pooling with asyncpg driver
The system SHALL establish and maintain a pool of asynchronous connections to PostgreSQL using the asyncpg driver. Connection pooling SHALL reduce overhead by reusing connections across requests rather than creating new connections on each request.

#### Scenario: Successful connection establishment
- **WHEN** FastAPI application starts
- **THEN** system creates a connection pool with default size of 10 connections (configurable)
- **AND** system logs successful pool initialization

#### Scenario: Connection reuse across requests
- **WHEN** two HTTP requests arrive sequentially
- **THEN** both requests use connections from the same pool
- **AND** no new connections are created if pool has available capacity

#### Scenario: Connection timeout handling
- **WHEN** a database query times out after configured threshold (default 30 seconds)
- **THEN** system raises a timeout exception
- **AND** the connection is returned to the pool for reuse

#### Scenario: Connection pool exhaustion
- **WHEN** pool reaches maximum capacity and new request arrives
- **THEN** request waits for available connection (default queue timeout 5 seconds)
- **AND** if no connection available after timeout, system raises pool exhaustion error

---

### Requirement: Configurable database connection string via environment variables
The system SHALL support database connection configuration through environment variables to enable different configurations for development, test, and production environments.

#### Scenario: Development database connection
- **WHEN** application runs with `ENVIRONMENT=development` and `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/food_store_dev`
- **THEN** system connects to local PostgreSQL development database

#### Scenario: Test database isolation
- **WHEN** tests run with `ENVIRONMENT=test` and `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/food_store_test`
- **THEN** system connects to isolated test database (not affecting development data)

#### Scenario: Production database with pooling
- **WHEN** application runs in production with `DATABASE_URL` pointing to RDS or managed PostgreSQL
- **THEN** system uses QueuePool with `pool_size=20` (production default)
- **AND** system enables SSL connections if URL specifies `sslmode=require`

#### Scenario: Invalid database URL handling
- **WHEN** `DATABASE_URL` is malformed or missing required components
- **THEN** system raises configuration error on startup with helpful error message
- **AND** application does not start until configuration is fixed

---

### Requirement: Application startup initialization of database
The system SHALL initialize the database connection pool during FastAPI application startup and gracefully close connections on shutdown.

#### Scenario: Startup event creates pool
- **WHEN** FastAPI app starts (lifespan event)
- **THEN** system creates async engine with configured connection pool
- **AND** system verifies database connectivity with test query

#### Scenario: Shutdown event closes pool
- **WHEN** FastAPI app shuts down (lifespan event)
- **THEN** system closes all connections in pool
- **AND** system waits for in-flight queries to complete (5-second grace period)

#### Scenario: Dependency injection of database session
- **WHEN** a route handler declares `db: AsyncSession = Depends(get_db_session)`
- **THEN** system injects an async database session for that request
- **AND** session is automatically closed after request completes

---

### Requirement: Connection health checking
The system SHALL periodically verify database connections are healthy and replace failed connections.

#### Scenario: Stale connection detection
- **WHEN** a connection in the pool has been idle for > 1 hour
- **THEN** system performs a test query (`SELECT 1`)
- **AND** if test fails, connection is discarded and replaced with new connection

#### Scenario: Connection error recovery
- **WHEN** a query fails with connection error (e.g., network timeout)
- **THEN** system returns the failed connection to pool for eventual cleanup
- **AND** system retries the query with a fresh connection

#### Scenario: Pool monitoring and metrics
- **WHEN** application is running in debug mode
- **THEN** system logs pool statistics (checked out, checked in, overflow) every 60 seconds
