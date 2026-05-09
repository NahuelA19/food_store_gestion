-- ============================================================================
-- Food Store Database Initialization Script
-- Executed automatically when PostgreSQL container starts
-- ============================================================================

-- Create application-specific user (not using root postgres user)
CREATE USER food_store_user WITH PASSWORD 'root';

-- Note: food_store database is created by POSTGRES_DB env var automatically.
-- We only create the test database here.

-- Create test database (for pytest)
CREATE DATABASE food_store_test OWNER food_store_user;

-- Grant all privileges to application user on both databases
GRANT ALL PRIVILEGES ON DATABASE food_store TO food_store_user;
GRANT ALL PRIVILEGES ON DATABASE food_store_test TO food_store_user;

-- Enable UUID extension on both databases
\c food_store
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT USAGE ON SCHEMA public TO food_store_user;
GRANT CREATE ON SCHEMA public TO food_store_user;

\c food_store_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT USAGE ON SCHEMA public TO food_store_user;
GRANT CREATE ON SCHEMA public TO food_store_user;

-- ============================================================================
-- Summary
-- ============================================================================
-- Root user: postgres / postgres (or custom via env vars)
-- App user: food_store_user / root
-- Development DB: food_store
-- Test DB: food_store_test
-- Connection string: postgresql+asyncpg://food_store_user:root@localhost:5432/food_store
-- Test connection: postgresql+asyncpg://food_store_user:root@localhost:5432/food_store_test
-- ============================================================================
