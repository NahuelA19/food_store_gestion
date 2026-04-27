# Backend — Agent Instructions

> Scoped instructions for any agent working inside the `backend/` directory.
> These complement (and never replace) the root `AGENTS.md`.

---

## What this is

FastAPI Python backend for the Food Store e-commerce platform.

- **Entrypoint**: `app/main.py`
- **Routes**: `app/routes/` — one file per resource
- **Models**: `app/models/` — Pydantic v2 request/response schemas
- **Tests**: `tests/` — pytest test suite

---

## MANDATORY: Load these skills before writing any code

### When working on routes, models, dependencies, or `main.py`

→ Load `.agents/skills/fastapi-python/SKILL.md`

Rules that MUST be followed:
- `async def` for every route handler — NEVER `def` for I/O operations
- Type-hint every function signature
- Use `Pydantic BaseModel` for all input/output — never raw `dict`
- Use `HTTPException` for expected errors (4xx/5xx)
- Register new routers in `main.py` via `app.include_router(router, prefix="/api/v1")`
- Follow RORO: receive a typed object, return a typed object

### When writing tests in `tests/`

→ Load `.agents/skills/pytest/SKILL.md`

Rules that MUST be followed:
- Every route MUST have at least one happy-path test and one error-path test
- Use `@pytest.fixture` for reusable setup (DB session, test client)
- Use `TestClient(app)` from `starlette.testclient` for HTTP-level tests
- Use `@pytest.mark.asyncio` for async functions
- Use `@pytest.mark.parametrize` for validation edge cases

### When working with database schemas or SQL

→ Load `.agents/skills/postgresql-database-engineering/SKILL.md`

Rules that MUST be followed:
- Use `EXPLAIN ANALYZE` before claiming a query is efficient
- Never `SELECT *` — always name columns explicitly
- Choose the correct index type for the access pattern
- Use `STRING_AGG` for concatenating related rows (products → categories/ingredients)

---

## Route file structure (template)

```python
# app/routes/products.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[ProductResponse])
async def list_products() -> list[ProductResponse]:
    """List all products."""
    ...


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(body: ProductCreate) -> ProductResponse:
    """Create a new product."""
    ...
```

---

## Running locally

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# API → http://localhost:8000
# Swagger → http://localhost:8000/docs
```

## Running tests

```bash
cd backend
source venv/bin/activate
python -m pytest                    # all tests
python -m pytest -v --tb=short      # verbose
python -m pytest --cov=app          # with coverage report
```

## Code quality

```bash
ruff check .          # lint
black .               # format
mypy app/             # type check
```
