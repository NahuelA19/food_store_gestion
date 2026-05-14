# Specification: Commodities ETL Pipeline

## ADDED Requirements

### Requirement: Fetch commodity prices from external API

The system SHALL fetch daily commodity prices from the commodities-api.com external API using an async HTTP client.

#### Scenario: Successful fetch returns parsed prices
- **WHEN** the ETL service calls `fetch_latest_prices()` with a list of symbols
- **THEN** the API client SHALL send a GET request to `https://commodities-api.com/api/latest` with the configured API key
- **THEN** the API client SHALL return a parsed dict with price data per symbol

#### Scenario: API returns HTTP error
- **WHEN** the commodities API returns a 4xx or 5xx status code
- **THEN** the API client SHALL raise an `HTTPError` with the status code and response body
- **THEN** the ETL service SHALL log the error and abort the current run

#### Scenario: API request times out
- **WHEN** the commodities API does not respond within 30 seconds
- **THEN** the API client SHALL raise a `TimeoutError`
- **THEN** the ETL service SHALL log the timeout and abort the current run

### Requirement: Persist commodity prices to database

The system SHALL persist fetched commodity prices in the `commodity_prices` table with deduplication by symbol and date.

#### Scenario: New prices are inserted
- **WHEN** the ETL service fetches prices for symbols that have no record for today's date
- **THEN** the system SHALL insert one row per symbol with symbol, name, price, unit, base_currency, and fetched_at
- **THEN** the system SHALL log how many new records were inserted

#### Scenario: Duplicate symbols on same day are skipped
- **WHEN** the ETL service fetches prices for a symbol that already has a record for today
- **THEN** the system SHALL skip the insert for that symbol
- **THEN** the system SHALL log how many duplicates were skipped

### Requirement: Scheduled daily execution

The system SHALL run the ETL pipeline automatically once per day via APScheduler.

#### Scenario: Daily job runs at configured hour
- **WHEN** the system clock reaches the configured `COMMODITIES_FETCH_HOUR` (default: 08:00)
- **THEN** the scheduler SHALL trigger the ETL service
- **THEN** the ETL SHALL fetch, transform, and persist commodity prices

#### Scenario: Scheduler starts with application
- **WHEN** the FastAPI application starts
- **THEN** the scheduler SHALL be initialized and the daily job SHALL be registered
- **THEN** the scheduler SHALL NOT run the job immediately (only on next cron trigger)

#### Scenario: Scheduler stops gracefully
- **WHEN** the FastAPI application shuts down
- **THEN** the scheduler SHALL shut down gracefully, waiting for any running job to complete

### Requirement: Query commodity prices via REST API

The system SHALL expose REST endpoints to query historical and latest commodity prices.

#### Scenario: Get paginated history by symbol
- **WHEN** a user sends GET `/api/v1/commodities?symbol=WHEAT&page=1&size=20`
- **THEN** the system SHALL return a paginated list of price records for WHEAT
- **THEN** the response SHALL include `items`, `total`, `page`, `size`, and `pages` fields

#### Scenario: Get latest price per symbol
- **WHEN** a user sends GET `/api/v1/commodities/latest`
- **THEN** the system SHALL return the most recent price record for each tracked symbol

#### Scenario: Manual ETL trigger (admin-only)
- **WHEN** an admin user sends POST `/api/v1/commodities/fetch`
- **THEN** the system SHALL execute the ETL pipeline immediately
- **THEN** the system SHALL return a summary with `symbols_fetched`, `records_inserted`, `duplicates_skipped`, and `fetched_at`

#### Scenario: Non-admin cannot trigger ETL
- **WHEN** a non-admin user sends POST `/api/v1/commodities/fetch`
- **THEN** the system SHALL return HTTP 403 Forbidden
