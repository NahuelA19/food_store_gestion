## ADDED Requirements

### Requirement: Alembic migration framework initialization
The system SHALL provide a structured migration framework using Alembic for version-controlled schema changes.

#### Scenario: Alembic project initialization
- **WHEN** Alembic is set up
- **THEN** system creates `backend/alembic/` directory with standard structure:
  - `alembic/env.py` - migration environment configuration
  - `alembic/versions/` - directory for migration files
  - `alembic.ini` - configuration file

#### Scenario: Database URL configuration in Alembic
- **WHEN** Alembic migrations run
- **THEN** system reads `DATABASE_URL` from environment or `alembic.ini`
- **AND** migrations connect to correct database (dev/test/prod)

#### Scenario: Autogenerate initial migration
- **WHEN** developer runs `alembic revision --autogenerate -m "Initial schema"`
- **THEN** system compares current ORM models to database schema
- **AND** system generates migration file with CREATE TABLE statements for all models

#### Scenario: Named migrations for clarity
- **WHEN** migration file is generated
- **THEN** filename follows pattern: `<timestamp>_<description>.py` (e.g., `20240527_001_initial_schema.py`)
- **AND** description matches `-m` message from command

---

### Requirement: Forward migration (upgrade)
The system SHALL allow applying migrations to move database schema forward to a newer state.

#### Scenario: Apply all pending migrations
- **WHEN** developer runs `alembic upgrade head`
- **THEN** system applies all migrations in `versions/` that haven't been run
- **AND** system updates `alembic_version` table to track current version

#### Scenario: Apply specific number of migrations
- **WHEN** developer runs `alembic upgrade +2`
- **THEN** system applies next 2 pending migrations

#### Scenario: Migration verification
- **WHEN** migration completes
- **THEN** system verifies schema matches ORM model definitions
- **AND** system does NOT leave database in intermediate/broken state

#### Scenario: Production migration safety
- **WHEN** migrations run in production
- **THEN** system requires explicit confirmation flag (e.g., `--sql` to preview before applying)
- **AND** system maintains backup of schema before applying

---

### Requirement: Backward migration (downgrade)
The system SHALL allow reverting migrations to move database schema backward to an older state.

#### Scenario: Downgrade single migration
- **WHEN** developer runs `alembic downgrade -1`
- **THEN** system reverts the most recent migration
- **AND** system removes the migration's changes (DROP TABLE if table was created)
- **AND** `alembic_version` table is updated

#### Scenario: Downgrade to specific version
- **WHEN** developer runs `alembic downgrade <revision>`
- **THEN** system reverts all migrations back to specified revision (inclusive)

#### Scenario: Downgrade safety
- **WHEN** downgrade would cause data loss (e.g., DROP COLUMN with data)
- **THEN** system either prevents downgrade OR warns user explicitly
- **AND** developer must use `--force` flag to proceed with data-destructive downgrade

#### Scenario: Empty downgrade (idempotency)
- **WHEN** developer runs downgrade but all migrations are already reverted
- **THEN** system reports "no migrations to downgrade" (no error)

---

### Requirement: Migration history and status tracking
The system SHALL maintain clear history of applied migrations and current schema version.

#### Scenario: View migration history
- **WHEN** developer runs `alembic history --verbose`
- **THEN** system lists all migrations with:
  - Revision ID (hash)
  - Timestamp
  - Description
  - Whether it's been applied

#### Scenario: Check current schema version
- **WHEN** developer runs `alembic current`
- **THEN** system displays the current schema revision
- **AND** indicates whether there are pending migrations

#### Scenario: Migration branches handling
- **WHEN** two feature branches create migrations with different content
- **THEN** system detects branch/conflict on merge
- **AND** developer can view conflicting migrations with `alembic branches`

#### Scenario: Migration downtime tracking
- **WHEN** migration creates online schema change (e.g., ALTER TABLE)
- **THEN** migration file documents expected downtime (zero-downtime vs requires lock)

---

### Requirement: Test database schema management
The system SHALL automatically apply migrations to test database before running tests.

#### Scenario: Pytest fixture creates fresh test schema
- **WHEN** pytest starts
- **THEN** system runs `alembic upgrade head` against test database
- **AND** test database schema is current

#### Scenario: Transaction rollback between tests
- **WHEN** each test completes
- **THEN** test database transaction is rolled back
- **AND** next test starts with clean schema

#### Scenario: Test database isolation
- **WHEN** multiple test workers run in parallel
- **WHEN** each uses separate test database (e.g., `food_store_test_worker_1`)
- **THEN** tests do NOT interfere with each other

---

### Requirement: Migration validation and linting
The system SHALL validate migrations for common errors and best practices.

#### Scenario: Autogenerate detects schema mismatch
- **WHEN** developer runs `alembic revision --autogenerate`
- **THEN** system detects:
  - New tables (generates CREATE TABLE)
  - New columns (generates ALTER TABLE ADD COLUMN)
  - Deleted columns (generates ALTER TABLE DROP COLUMN)
  - Changed column types (generates ALTER TABLE)

#### Scenario: Prevent problematic SQL patterns
- **WHEN** migration file is reviewed
- **THEN** linter warns about:
  - Missing NOT NULL constraints on new columns
  - Dropping columns without DEFAULT on existing data
  - Creating non-indexed foreign keys

#### Scenario: Migration naming conventions
- **WHEN** migration is created
- **THEN** system enforces snake_case filenames
- **AND** description is meaningful (not generic like "update schema")
