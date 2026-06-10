# Design: ETL Commodities Pipeline

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      APScheduler (diario)                     │
│                        8:00 AM                               │
└──────────┬───────────────────────────────────────────────────┘
           │ trigger
           ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  CommoditiesAPI   │───▶│  CommodityETL     │───▶│  CommodityRepo    │
│  Client           │    │  Service          │    │  (via UoW)       │
│  (httpx)          │    │  fetch→transform  │    │                   │
└──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                         │
                                                         ▼
                                                ┌──────────────────┐
                                                │  PostgreSQL       │
                                                │  commodity_prices │
                                                └──────────────────┘

            ┌──────────────────────────────────────────────┐
            │           REST API Router                     │
            │  GET /api/v1/commodities                      │
            │  GET /api/v1/commodities/latest               │
            │  POST /api/v1/commodities/fetch               │
            └──────────────────────────────────────────────┘
```

## 1. Database Model

### New Table: `commodity_prices`

```sql
CREATE TABLE commodity_prices (
    id              BIGSERIAL PRIMARY KEY,
    symbol          VARCHAR(20)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    price           DECIMAL(14,4) NOT NULL CHECK (price >= 0),
    unit            VARCHAR(50),
    base_currency   VARCHAR(3)   NOT NULL DEFAULT 'USD',
    fetched_at      TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    
    -- One price per symbol per day
    CONSTRAINT uq_commodity_price_date UNIQUE (symbol, (fetched_at::date))
);

-- Index for common query patterns
CREATE INDEX idx_commodity_prices_symbol ON commodity_prices(symbol);
CREATE INDEX idx_commodity_prices_fetched_at ON commodity_prices(fetched_at DESC);
CREATE INDEX idx_commodity_prices_symbol_date ON commodity_prices(symbol, fetched_at DESC);
```

### Migration
- New Alembic revision: `XXXX_add_commodity_prices.py`

## 2. SQLAlchemy Model

`backend/app/models/commodity_price.py`:
- SQLAlchemy `DeclarativeBase` model (consistent with existing models)
- Fields match table definition
- No SQLModel (project currently uses SQLAlchemy + Pydantic separately)

## 3. Pydantic Schemas

`backend/app/schemas/commodity_price.py`:
- `CommodityPriceResponse` — full record (id, symbol, name, price, unit, base_currency, fetched_at, created_at)
- `CommodityLatestResponse` — current price per symbol (same fields)
- `CommodityPriceListResponse` — paginated list
- `CommodityTriggerResponse` — ETL trigger result (symbols_fetched, records_inserted, fetched_at)

## 4. Repository

`backend/app/repositories/commodity_price_repository.py`:
- `get_by_symbol(symbol, skip, limit)` → paginated history
- `get_latest_by_symbol(symbol)` → last record for symbol
- `get_all_latest()` → latest price for every symbol (using DISTINCT ON)
- `get_by_date_range(symbol, from_date, to_date)`
- `bulk_create(prices)` → efficient batch insert
- `exists_by_date(symbol, date)` → check if data already exists for date

Extends `BaseRepository[CommodityPrice]`.

## 5. Commodities API Client

`backend/app/services/commodities_api_client.py`:
- Async HTTP client using `httpx.AsyncClient` (already in dependencies)
- Single method: `fetch_latest_prices(symbols: list[str]) → dict`
- Base URL: `https://commodities-api.com/api/latest`
- API key from settings
- Error handling: retry on 5xx, raise on 4xx, timeout 30s
- Logging with structlog

## 6. ETL Service

`backend/app/services/commodity_etl_service.py`:
- `run_etl(uow)` → orchestrates the full pipeline
  1. Call `fetch_latest_prices()` → raw JSON
  2. Transform to `list[CommodityPrice]` models
  3. Filter: skip symbols already fetched today (check via repo)
  4. `bulk_create()` remaining records in DB
  5. Log summary (symbols fetched, new records, duplicates skipped)
  6. Return result summary

## 7. Scheduler Integration

`backend/app/core/scheduler.py`:
- Uses `APScheduler` with `AsyncIOScheduler`
- Job: `run_daily_etl()` → calls `commodity_etl_service.run_etl()`
- Trigger: `cron(hour=8, minute=0)` (configurable via settings)
- Started in FastAPI lifespan `startup` event
- Shutdown in lifespan `shutdown` event

## 8. Router / API Endpoints

`backend/app/routes/commodities.py` → router prefixed `/api/v1/commodities`:

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | List history by symbol (paginated, filterable by date) | Admin |
| GET | `/latest` | Latest price per symbol | Public |
| POST | `/fetch` | Trigger ETL manually | Admin |

## 9. Config / Settings

New env vars in `backend/.env` and `backend/app/config.py`:
- `COMMODITIES_API_KEY` — API key
- `COMMODITIES_SYMBOLS` — comma-separated (default: WHEAT,CORN,SOYBEAN,SUGAR,RICE)
- `COMMODITIES_FETCH_HOUR` — hour for daily fetch (default: 8)
- `COMMODITIES_API_BASE_URL` — base URL (default: https://commodities-api.com/api)

## 10. Dependencies

- Add `apscheduler>=3.10.4` to `requirements.txt`

## 11. Files Changed

```
NEW  backend/app/models/commodity_price.py
NEW  backend/app/schemas/commodity_price.py
NEW  backend/app/repositories/commodity_price_repository.py
NEW  backend/app/services/commodities_api_client.py
NEW  backend/app/services/commodity_etl_service.py
NEW  backend/app/core/scheduler.py
NEW  backend/app/routes/commodities.py
NEW  backend/alembic/versions/XXXX_add_commodity_prices.py
NEW  backend/tests/test_commodities_etl.py

MOD  backend/app/main.py              — register router + scheduler lifespan
MOD  backend/app/config.py            — add commodities settings
MOD  backend/requirements.txt         — add apscheduler
```

## 12. Testing Strategy

| Test | Type | What it validates |
|------|------|-------------------|
| `test_fetch_latest_success` | Unit (mock httpx) | API client parses response correctly |
| `test_fetch_latest_timeout` | Unit | HTTP timeout handled gracefully |
| `test_fetch_latest_http_error` | Unit | 4xx/5xx errors handled |
| `test_etl_run_full_pipeline` | Integration (mock API) | ETL creates records in DB via UoW |
| `test_etl_skip_duplicates` | Integration | Already-fetched symbols skipped |
| `test_repository_get_latest` | Integration | DISTINCT ON query works |
| `test_repository_bulk_create` | Integration | Bulk insert works and rolls back on error |
| `test_api_list_prices` | Integration | GET /commodities returns paginated data |
| `test_api_latest_prices` | Integration | GET /commodities/latest returns current |
| `test_api_trigger_etl` | Integration | POST /commodities/fetch triggers ETL |
