# PostgreSQL Database Setup — Food Store

Complete guide to setting up PostgreSQL for local development and production.

## Local Development Setup

### macOS (Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start the service
brew services start postgresql@15

# Verify installation
psql --version
```

### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql

# Verify installation
psql --version
```

### Docker (Recommended for Clean Environment)

```bash
# Pull PostgreSQL image
docker pull postgres:15-alpine

# Run container
docker run --name food_store_db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=food_store \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running
docker ps | grep food_store_db
```

## User and Database Creation

### Using psql CLI

```bash
# Connect to PostgreSQL as default user
psql -U postgres

# Create user (in psql)
CREATE USER user WITH PASSWORD 'password';

# Create database owned by user
CREATE DATABASE food_store OWNER user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE food_store TO user;

# Verify
\l                          # List databases
\du                         # List users
\q                          # Quit psql
```

### Using shell script

```bash
#!/bin/bash
psql -U postgres <<EOF
CREATE USER user WITH PASSWORD 'password';
CREATE DATABASE food_store OWNER user;
GRANT ALL PRIVILEGES ON DATABASE food_store TO user;
EOF
```

### Docker approach

```bash
# If using Docker container from above:
docker exec food_store_db psql -U postgres -c "CREATE USER user WITH PASSWORD 'password';"
docker exec food_store_db psql -U postgres -c "CREATE DATABASE food_store OWNER user;"
```

## Environment Variables

### Development

Create `backend/.env`:

```bash
# Server
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/food_store
DATABASE_ECHO=False

# Security
SECRET_KEY=your-dev-secret-key-123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logging
LOG_LEVEL=INFO

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Testing

```bash
# Set test database URL
export TEST_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/food_store_test
export ENVIRONMENT=test

# Run tests
cd backend
python -m pytest
```

### Production

```bash
# Use environment variables (never commit .env to git)
export ENVIRONMENT=production
export DEBUG=False
export DATABASE_URL=postgresql+asyncpg://user:password@prod-host:5432/food_store
export SECRET_KEY=<strong-secret-key>
```

**Never commit production credentials to git!**

## Database Initialization

### Initial Migration

After setting up the database and environment variables:

```bash
cd backend

# Upgrade to latest migration
alembic upgrade head

# Verify current state
alembic current
alembic history
```

### Create Test Database

```bash
# Create test database (once)
psql -U postgres -c "CREATE DATABASE food_store_test OWNER user;"

# Now tests can use TEST_DATABASE_URL
```

## Verification

### Check Connection

```bash
# Using psql
psql -U user -h localhost -d food_store -c "SELECT 1"

# Using Python
python -c "
import asyncpg
import asyncio

async def test():
    conn = await asyncpg.connect('postgresql://user:password@localhost/food_store')
    result = await conn.fetchval('SELECT 1')
    print(f'Connection successful: {result}')
    await conn.close()

asyncio.run(test())
"
```

### Check Tables

```bash
psql -U user -h localhost -d food_store

# In psql:
\dt                    # List tables
\d users               # Describe users table
SELECT COUNT(*) FROM users;  # Row count
```

## Common Tasks

### Reset Database (Development)

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE food_store;"
psql -U postgres -c "CREATE DATABASE food_store OWNER user;"

# Re-run migrations
cd backend
alembic upgrade head
```

### Backup Database

```bash
# Full backup
pg_dump -U user -h localhost food_store > backup.sql

# With Docker
docker exec food_store_db pg_dump -U user food_store > backup.sql
```

### Restore Database

```bash
# From backup
psql -U user -h localhost food_store < backup.sql

# With Docker
docker exec -i food_store_db psql -U user food_store < backup.sql
```

### View Logs

```bash
# Using Docker
docker logs food_store_db

# Using Homebrew on macOS
tail -f /usr/local/var/log/postgres.log
```

## Connection String Reference

### Format
```
postgresql+asyncpg://user:password@host:port/database
```

### Components

| Component | Default | Example |
|-----------|---------|---------|
| `user` | postgres | user |
| `password` | (none) | password |
| `host` | localhost | localhost |
| `port` | 5432 | 5432 |
| `database` | (none) | food_store |

### Examples

```bash
# Local development
postgresql+asyncpg://user:password@localhost:5432/food_store

# Docker container
postgresql+asyncpg://user:password@host.docker.internal:5432/food_store

# Production AWS RDS
postgresql+asyncpg://admin:secure_pass@food-store-db.c7ufq.us-east-1.rds.amazonaws.com:5432/food_store

# Production with SSL
postgresql+asyncpg://admin:secure_pass@host:5432/food_store?ssl=require
```

## Troubleshooting

### "Connection refused"

```
asyncpg.exceptions.ClientError: could not connect to the server
```

**Check**:
1. PostgreSQL is running: `pg_isready -U user`
2. HOST/PORT correct in DATABASE_URL
3. Firewall not blocking port 5432

**Fix**:
```bash
# Ensure service is running
brew services start postgresql@15    # macOS
sudo systemctl start postgresql      # Linux
docker start food_store_db           # Docker
```

### "password authentication failed"

```
asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "user"
```

**Check**:
1. Username matches
2. Password matches
3. User has database privileges

**Fix**:
```bash
# Recreate user with correct password
psql -U postgres
DROP USER IF EXISTS user;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE food_store TO user;
```

### "database does not exist"

```
sqlalchemy.exc.OperationalError: (asyncpg.exceptions.InvalidCatalogNameError)...
```

**Fix**:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE food_store OWNER user;"
```

### "permission denied"

```
sqlalchemy.exc.OperationalError: permission denied for schema public
```

**Fix**:
```bash
# Grant schema privileges
psql -U postgres -d food_store <<EOF
GRANT USAGE ON SCHEMA public TO user;
GRANT CREATE ON SCHEMA public TO user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO user;
EOF
```

## Performance Tuning

### Connection Pool Settings

In `backend/database/client.py`, adjust for your environment:

```python
# Development: Small pool
pool_size=5
max_overflow=5

# Production: Larger pool
pool_size=20
max_overflow=10
```

### PostgreSQL Configuration

Edit `postgresql.conf` (usually in `/usr/local/var/postgres/` or `/etc/postgresql/`):

```
# Connection limits
max_connections = 200
shared_buffers = 256MB

# Performance
effective_cache_size = 1GB
work_mem = 4MB
```

Restart PostgreSQL after changes.

## Security Best Practices

1. **Never commit `.env` files**: Add to `.gitignore`
2. **Use strong passwords**: Generate with `openssl rand -base64 32`
3. **Use environment variables in production**: Deploy via CI/CD secrets
4. **Restrict database access**: Firewall rules, VPC isolation
5. **Enable SSL for remote connections**: `sslmode=require`
6. **Rotate credentials regularly**: Change passwords every 90 days
7. **Monitor database logs**: Set up alerts for failed connections

---

**Last Updated**: 2026-05-06  
**Author**: Food Store Development Team  
**Version**: 1.0.0
