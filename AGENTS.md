# 🍕 Food Store — Agent Instructions

> This file is the single source of truth for any AI agent (OpenCode, Antigravity, etc.)
> working in this repository. Read it fully before writing any code.

---

## Project Overview

**Food Store** is a full-stack e-commerce monorepo for food products.

| Layer     | Technology                                      | Entry point                      |
|-----------|--------------------------------------------------|----------------------------------|
| Backend   | FastAPI (Python 3.10+), Pydantic v2, Uvicorn    | `backend/app/main.py`            |
| Frontend  | React 18, TypeScript, Vite, Vitest              | `frontend/src/main.tsx`          |
| Database  | PostgreSQL (asyncpg)                             | connection via env vars          |
| Monorepo  | npm workspaces + Husky + commitlint             | `package.json` (root)            |

---

## Repository Structure

```
foodstore/
├── backend/                   # FastAPI Python backend
│   ├── app/
│   │   ├── main.py            # App entrypoint — FastAPI instance, CORS, router registration
│   │   ├── routes/            # One file per resource (e.g. products.py, categories.py)
│   │   └── models/            # Pydantic v2 schemas (request + response models)
│   ├── tests/                 # pytest test suite
│   ├── pyproject.toml         # Python tooling config (ruff, black, mypy, pytest)
│   └── requirements.txt       # Runtime dependencies
│
├── frontend/                  # React + TypeScript frontend
│   └── src/
│       ├── App.tsx            # Root component
│       ├── components/        # Reusable presentational components
│       ├── pages/             # Route-level page components
│       └── hooks/             # Custom React hooks
│
├── packages/                  # Shared npm packages (core, ui)
├── docs/                      # Architecture docs, API docs, guides
├── openspec/                  # OPSX change management artifacts
├── .agents/skills/            # Installed agent skills (see below)
├── opencode.json              # OpenCode config (MCP filesystem server)
└── AGENTS.md                  # ← You are here
```

---

## Tech Conventions

### Backend (Python / FastAPI)

- **Always** use `async def` for route handlers. Never use blocking I/O.
- **Always** type-hint every function signature. Use Pydantic `BaseModel` for all request/response bodies — never raw `dict`.
- **Route naming**: lowercase with underscores. File per resource (e.g. `routes/products.py`).
- **Error handling**: use `HTTPException` for expected errors. Early returns / guard clauses at the top of functions.
- **Pattern**: RORO (Receive an Object, Return an Object).
- Register new routers in `backend/app/main.py` via `app.include_router(...)`.
- Do NOT use class-based views. Prefer plain async functions.

### Frontend (React / TypeScript)

- React 18 with **functional components only** — no class components.
- Custom hooks live in `frontend/src/hooks/`. Extract any stateful logic from components.
- Components in `frontend/src/components/` are **presentational** (no direct API calls).
- Pages in `frontend/src/pages/` are the **containers** (call hooks, pass props down).
- TypeScript strict mode is enabled. Never use `any`.
- State management: React built-in (`useState`, `useReducer`, custom hooks).

### Testing

- **Backend**: pytest with `pytest-asyncio`. Tests in `backend/tests/`. Run with `python -m pytest`.
- **Frontend**: Vitest + @testing-library/react. Tests in `frontend/src/__tests__/`. Run with `npm run test --workspace frontend`.
- Coverage is enforced. Do not write code without a corresponding test.

### Git & Commits

- Conventional Commits enforced by commitlint + Husky.
- Format: `type(scope): subject`
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`
- Example: `feat(products): add endpoint to list products with pagination`

---

## Installed Skills

Skills are in `.agents/skills/`. **Before writing any code, identify which skill applies and load its full SKILL.md.**

### Decision Map — which skill to load

| Situation | Skill to load |
|-----------|---------------|
| Creating or modifying **any** backend file (routes, models, main.py, deps) | `fastapi-python` |
| Writing or modifying **any** backend test file in `backend/tests/` | `pytest` |
| Working on **database schema**, writing SQL queries, optimizing queries, managing indexes | `postgresql-database-engineering` |
| Creating or modifying **any** frontend React component, hook, or page | `react` |
| User asks "is there a skill for X?", "can you do X?", or wants to extend agent capabilities | `find-skills` |

---

### `fastapi-python` — Backend Development

**Path**: `.agents/skills/fastapi-python/SKILL.md`

**Load when**:
- Adding a new route or router to `backend/app/routes/`
- Creating or updating Pydantic models in `backend/app/models/`
- Modifying `backend/app/main.py`
- Implementing dependency injection (`Depends`)
- Handling HTTP errors, middleware, CORS
- Writing async database calls

**Key rules from this skill**:
- Use `async def` always for route handlers
- Declare return types on every route
- Prefer Pydantic models over dicts
- Use `HTTPException` for expected errors
- Follow RORO pattern

---

### `pytest` — Backend Testing

**Path**: `.agents/skills/pytest/SKILL.md`

**Load when**:
- Writing new test files in `backend/tests/`
- Adding fixtures to `backend/tests/conftest.py`
- Mocking external services or database calls
- Using `@pytest.mark.asyncio` for async routes
- Running parametrized tests for validation logic

**Key rules from this skill**:
- Use `@pytest.fixture` for shared setup
- Use `with patch(...)` for mocking (not monkeypatch unless needed)
- Use `@pytest.mark.parametrize` for data-driven tests
- Run with `pytest -v --tb=short` locally

---

### `postgresql-database-engineering` — Database

**Path**: `.agents/skills/postgresql-database-engineering/SKILL.md`

**Load when**:
- Designing new tables or modifying existing schemas
- Writing raw SQL queries (especially with JOINs, aggregations, `STRING_AGG`)
- Creating or reviewing indexes
- Diagnosing slow queries (use `EXPLAIN ANALYZE`)
- Configuring connection pooling
- Planning migrations

**Key rules from this skill**:
- Always choose the correct index type for the access pattern (B-tree, GIN, BRIN, etc.)
- Use `EXPLAIN ANALYZE` before declaring a query correct
- Consider `SELECT *` an anti-pattern — select only needed columns
- Avoid N+1 patterns — use JOINs or batch queries

---

### `react` — Frontend Development

**Path**: `.agents/skills/react/SKILL.md`

**Load when**:
- Building new React components in `frontend/src/components/`
- Creating page-level components in `frontend/src/pages/`
- Adding or modifying custom hooks in `frontend/src/hooks/`
- Working with state, events, or form binding in the UI

**Important note**: This skill documents `@json-render/react`, a JSON-driven rendering system.
If the frontend does NOT use `@json-render/react`, apply only the **component architecture patterns**
(functional components, props, hooks) and ignore the JSON spec/catalog sections.

**Key rules from this skill**:
- Use functional components exclusively
- Use `useBoundProp` for two-way bindings (if using json-render)
- Emit events via `emit` — do not mix event dispatch with component state

---

### `find-skills` — Skill Discovery

**Path**: `.agents/skills/find-skills/SKILL.md`

**Load when**:
- User says: "is there a skill for X?", "find a skill for X", "can you do X with a skill?"
- User wants to extend the agent's capabilities for a domain not covered by installed skills
- A task is outside the scope of the 4 skills above

**What it does**:
- Searches `skills.sh` for installable skills
- Verifies quality (install count, source reputation) before recommending
- Provides the install command: `npx skills add <owner/repo@skill>`

---

## Development Commands

```bash
# Start all dev servers
npm run dev

# Frontend only
npm run dev --workspace frontend     # → http://localhost:5173

# Backend only
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
# → http://localhost:8000 | Swagger → http://localhost:8000/docs

# Run all tests
npm run test

# Backend tests only
cd backend && python -m pytest
cd backend && python -m pytest --cov=app   # with coverage

# Frontend tests only
npm run test --workspace frontend

# Lint + format + typecheck
npm run check:all
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_ENV=development
VITE_DEBUG=true
```

### Backend (`backend/.env`)
```
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/food_store
```

---

## CI/CD

GitHub Actions runs on every PR:

| Check       | Tool           | Scope    |
|-------------|----------------|----------|
| Lint        | Ruff + ESLint  | Both     |
| Format      | Black + Prettier | Both   |
| Tests       | pytest + Vitest | Both    |
| Type check  | mypy + tsc     | Both     |
| Build       | Vite           | Frontend |

**All checks must pass before merging.**

---

## Key Architectural Decisions

1. **Monorepo with npm workspaces** — allows shared tooling (lint, format, commit hooks) across Python backend and TypeScript frontend.
2. **FastAPI async-first** — every route handler is `async def`. Database calls use `asyncpg`.
3. **Pydantic v2 for validation** — request/response schemas defined as `BaseModel` classes, never as raw dicts.
4. **Container/Presentational split in React** — pages own state and API calls; components receive props only.
5. **Conventional Commits enforced** — commitlint + Husky block any non-standard commit message.

---

*Last updated: 2026-04-27 | Maintained by the Food Store team*
