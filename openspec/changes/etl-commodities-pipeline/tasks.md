## 1. Dependencies & Config

- [ ] 1.1 Add `apscheduler>=3.10.4` to `backend/requirements.txt`
- [ ] 1.2 Add commodities settings to `backend/app/config.py` (API_KEY, SYMBOLS, FETCH_HOUR, API_BASE_URL)

## 2. Database Layer

- [ ] 2.1 Create SQLAlchemy model `CommodityPrice` in `backend/app/models/commodity_price.py`
- [ ] 2.2 Create Alembic migration adding `commodity_prices` table with indexes and unique constraint
- [ ] 2.3 Create Pydantic schemas in `backend/app/schemas/commodity_price.py` (Response, LatestResponse, ListResponse, TriggerResponse)
- [ ] 2.4 Create `CommodityPriceRepository` in `backend/app/repositories/commodity_price_repository.py` extending `BaseRepository`
- [ ] 2.5 Register `commodity_prices` repository in `UnitOfWork` (`backend/app/core/uow.py`)

## 3. ETL Core

- [ ] 3.1 Create `CommoditiesAPIClient` in `backend/app/services/commodities_api_client.py` with `fetch_latest_prices()` using httpx
- [ ] 3.2 Create `CommodityETLService` in `backend/app/services/commodity_etl_service.py` with `run_etl()` orchestrating fetch → transform → persist
- [ ] 3.3 Implement duplicate detection: skip symbols already fetched today
- [ ] 3.4 Log ETL results with structlog (symbols_fetched, new_records, duplicates_skipped)

## 4. Scheduler

- [ ] 4.1 Create `backend/app/core/scheduler.py` with APScheduler `AsyncIOScheduler` setup
- [ ] 4.2 Wire scheduler lifecycle into FastAPI lifespan (start on startup, graceful shutdown)
- [ ] 4.3 Configure cron trigger daily at configurable hour (default 8:00 AM)

## 5. API Endpoints

- [ ] 5.1 Create `backend/app/routes/commodities.py` with GET `/api/v1/commodities` (paginated history)
- [ ] 5.2 Add GET `/api/v1/commodities/latest` (latest price per symbol)
- [ ] 5.3 Add POST `/api/v1/commodities/fetch` (manual ETL trigger, admin-only)
- [ ] 5.4 Register commodities router in `backend/app/main.py`

## 6. Tests

- [ ] 6.1 Unit test: commodities API client parses responses correctly (mock httpx)
- [ ] 6.2 Unit test: API client handles timeouts and HTTP errors
- [ ] 6.3 Integration test: ETL pipeline creates records in DB via UoW
- [ ] 6.4 Integration test: ETL skips duplicates when data already exists for today
- [ ] 6.5 Integration test: repository queries (get_latest, get_by_symbol, bulk_create)
- [ ] 6.6 Integration test: API endpoints return correct responses
- [ ] 6.7 Integration test: ETL trigger endpoint invokes the service
