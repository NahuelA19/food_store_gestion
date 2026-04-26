# Development Setup Guide

Complete instructions for setting up a local development environment for Food Store.

## Prerequisites

### Required
- **Node.js**: 18.x or later ([download](https://nodejs.org/))
- **npm**: 9.x or later (comes with Node.js)
- **Python**: 3.10+ ([download](https://www.python.org/))
- **Git**: Latest version ([download](https://git-scm.com/))
- **Git Bash** (Windows only): For better shell compatibility

### Recommended
- **Visual Studio Code** with extensions:
  - ES7+ React/Redux/React-Native snippets
  - ESLint
  - Prettier
  - Python
  - Pylance
  - Ruff
  - Thunder Client (or Postman for API testing)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/foodstore.git
cd foodstore
```

### 2. Install Frontend & Root Dependencies

```bash
npm install
```

This installs:
- Root workspace dependencies (husky, commitlint, prettier)
- Frontend workspace (React, Vite, TypeScript, ESLint)
- Shared packages (@foodstore/core, @foodstore/ui)

**Expected output:**
```
added XXX packages, and audited XXX packages in XXs
✓ All packages installed successfully
```

### 3. Set Up Python Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install development tools
pip install black ruff pytest pytest-asyncio pytest-cov
```

**Verify installation:**
```bash
python -c "from fastapi import FastAPI; print('✓ FastAPI installed')"
```

### 4. Set Up Environment Variables

**Frontend:**
```bash
# Frontend/.env.local (copy from template)
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_ENV=development
```

**Backend:**
```bash
# backend/.env (copy from template)
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### 5. Initialize Git Hooks

```bash
# From root directory
npx husky install

# Verify hooks are installed
ls -la .husky/
# Should show: pre-commit, commit-msg
```

## Running the Application

### Start Frontend (Terminal 1)

```bash
npm run dev --workspace frontend
```

Output:
```
  VITE v4.5.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

### Start Backend (Terminal 2)

```bash
cd backend
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
python -m uvicorn app.main:app --reload
```

Output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started server process
```

**Test the API:**
- Open browser: http://localhost:8000/docs (interactive API docs)
- Or use curl: `curl http://localhost:8000/health`

### Verify Both Are Running

In a third terminal:
```bash
# Test frontend
curl http://localhost:5173/

# Test backend
curl http://localhost:8000/health
# Should return: {"status":"ok","service":"food-store-api"}
```

## Development Commands

### Code Quality (Before Every Commit)

```bash
# Lint all code
npm run lint

# Format all code
npm run format

# Run tests
npm run test

# Full check (lint + test + build)
npm run check:all
```

### Frontend Development

```bash
cd frontend (implied with workspace)

npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview build locally
npm run test             # Run tests
npm run test:ui          # Run tests with UI
npm run lint             # Lint code
npm run format           # Format code
npm run type-check       # Check TypeScript types
```

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run server (auto-reload on changes)
python -m uvicorn app.main:app --reload

# Run tests
python -m pytest

# Run tests with coverage
python -m pytest --cov=app --cov-report=html

# Lint code
ruff check .
black --check .

# Format code
black .
ruff check . --fix

# Type check (if mypy installed)
mypy app/
```

### Full Monorepo Commands

```bash
# Development mode (all packages)
npm run dev

# Build everything
npm run build

# Test everything
npm run test

# Lint everything
npm run lint

# Format everything
npm run format

# Complete check
npm run check:all
```

## Making Changes

### Creating a Component (Frontend)

1. Create file: `frontend/src/components/MyComponent.tsx`
```tsx
export interface MyComponentProps {
  title: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};
```

2. Create test: `frontend/src/components/MyComponent.test.tsx`
3. Format and lint: `npm run format && npm run lint`

### Creating an API Endpoint (Backend)

1. Create file: `backend/app/routes/products.py`
```python
from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
async def list_products():
    return {"products": []}
```

2. Import in `backend/app/main.py`:
```python
from app.routes.products import router as products_router
app.include_router(products_router)
```

3. Format and lint: `cd backend && black . && ruff check . --fix`

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/my-feature

# Make changes, add files
git add .

# Commit (hooks will run)
git commit -m "feat: add my feature"
# Pre-commit hooks will:
# - Lint your code
# - Check TypeScript types
# - Validate commit message

# Push and create pull request
git push origin feat/my-feature
# GitHub Actions will:
# - Run full test suite
# - Check linting
# - Build verification
```

## Troubleshooting

### Issue: `npm install` fails with peer dependency warnings

**Solution:**
```bash
npm install --legacy-peer-deps
```

### Issue: `venv activate` doesn't work on Windows

**Solution:**
```bash
# Use batch file instead
venv\Scripts\activate.bat

# Or for PowerShell:
venv\Scripts\Activate.ps1
```

### Issue: `pip install` fails with compilation errors

**Solution:**
```bash
# Make sure you have build tools
# macOS:
xcode-select --install

# Windows:
# Install Visual C++ Build Tools
```

### Issue: Port 5173 or 8000 already in use

**Solution:**
```bash
# Frontend on different port:
npm run dev -- --port 3001

# Backend on different port:
python -m uvicorn app.main:app --port 8001 --reload
```

### Issue: Git hooks not running

**Solution:**
```bash
# Reinstall Husky
npx husky install

# Make hooks executable (macOS/Linux)
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

## Database Setup (When Ready)

When you're ready to add a database:

1. Create database connection module: `backend/app/database.py`
2. Add connection string to `.env`
3. Create migrations: `alembic init -t async migrations`
4. See [Architecture](./ARCHITECTURE.md) for more details

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Getting Help

- Check [Troubleshooting](#troubleshooting) section
- Review [GitHub Issues](https://github.com/yourusername/foodstore/issues)
- Start a [GitHub Discussion](https://github.com/yourusername/foodstore/discussions)
