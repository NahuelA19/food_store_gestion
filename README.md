# 🍕 Food Store - Modern E-commerce Platform

A full-stack e-commerce platform built with modern web technologies. This monorepo contains both backend (FastAPI) and frontend (React) applications.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Validation**: Pydantic v2
- **Package Manager**: pip (with venv)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest
- **Linting**: ESLint
- **Formatting**: Prettier

### DevOps & Quality
- **Monorepo**: npm workspaces
- **Git Hooks**: Husky
- **Commit Linting**: commitlint (Conventional Commits)
- **CI/CD**: GitHub Actions
- **Code Formatting**: Black (Python), Prettier (JS/TS)
- **Linting**: Ruff (Python), ESLint (JS/TS)

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.10+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/foodstore.git
cd foodstore

# Install dependencies (frontend + root)
npm install

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Development

**Frontend:**
```bash
npm run dev --workspace frontend
# Open http://localhost:5173
```

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

**All scripts:**
```bash
npm run dev          # Start all dev servers
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all code
npm run format       # Format all code
npm run check:all    # Lint + test + build (local verification)
```

## Project Structure

```
foodstore/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── routes/         # API route modules
│   │   └── models/         # Pydantic models
│   ├── tests/              # Backend tests
│   ├── venv/               # Python virtual environment
│   ├── requirements.txt    # Python dependencies
│   ├── pyproject.toml      # Python project config
│   └── .env.example        # Environment variables template
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── main.tsx        # Entry point
│   │   ├── App.tsx         # Root component
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── .env.example    # Environment variables template
│   ├── public/             # Static assets
│   ├── package.json        # Frontend config
│   └── tsconfig.json       # TypeScript config
│
├── packages/               # Shared libraries
│   ├── core/              # Shared utilities
│   └── ui/                # Shared UI components
│
├── docs/                  # Documentation
│   ├── SETUP.md          # Setup instructions
│   ├── ARCHITECTURE.md   # System architecture
│   ├── CONTRIBUTING.md   # Contribution guidelines
│   ├── guides/           # How-to guides
│   ├── api/              # API documentation
│   └── architecture/     # Architecture diagrams
│
├── .github/workflows/     # CI/CD pipelines
├── .husky/               # Git hooks
├── package.json          # Root workspace config
├── .eslintrc.json        # ESLint config
├── .prettierrc.json      # Prettier config
├── commitlint.config.js  # Commit lint config
├── .editorconfig         # Editor settings
└── .gitignore            # Git ignore rules
```

## Documentation

- **[Setup Instructions](./docs/SETUP.md)** - Detailed development environment setup
- **[Database Layer](./docs/DATABASE.md)** - PostgreSQL ORM, migrations, and connection management
- **[Database Setup](./docs/DATABASE_SETUP.md)** - PostgreSQL installation and configuration
- **[Architecture](./docs/ARCHITECTURE.md)** - System design and layers
- **[Contributing](./docs/CONTRIBUTING.md)** - Git workflow and code standards
- **[API Documentation](./docs/API.md)** - Backend API endpoints
- **[Getting Started](./GETTING-STARTED.md)** - First-time developer guide
- **[Guides](./docs/guides/)** - How-to guides for common tasks

## Git Workflow

This project follows **Conventional Commits**. All commits must follow this format:

```
type(scope): subject

body
footer
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Example**:
```
feat(auth): add login endpoint

- Implement JWT-based authentication
- Add password hashing with bcrypt

Closes #42
```

Git hooks will validate commits automatically. See [Contributing Guidelines](./docs/CONTRIBUTING.md) for details.

## CI/CD Pipeline

Automated checks run on every pull request:

✅ **Linting** - ESLint (frontend), Ruff (backend)
✅ **Code Formatting** - Prettier (frontend), Black (backend)
✅ **Tests** - Vitest (frontend), pytest (backend)
✅ **Build** - Vite (frontend), syntax check (backend)
✅ **Security** - npm audit, Python dependency scanning

Branch protection rules require all checks to pass before merging.

## Testing

```bash
# Frontend tests
npm run test --workspace frontend
npm run test:ui --workspace frontend  # With UI

# Backend tests
cd backend && python -m pytest
cd backend && python -m pytest --cov=app  # With coverage

# Both
npm run test  # Runs all test workspaces
```

## Code Quality

```bash
# Lint all code
npm run lint

# Format all code (auto-fixes)
npm run format

# Type checking
npm run type-check --workspace frontend

# Full checks (before committing)
npm run check:all
```

## Environment Variables

### Frontend (`.env.local`)
```
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_ENV=development
VITE_DEBUG=true
```

### Backend (`.env`)
```
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
SECRET_KEY=your-secret-key-change-in-production
```

See `.env.example` files in each directory for all available variables.

## Troubleshooting

See [Getting Started](./GETTING-STARTED.md) for common issues and solutions.

## License

MIT

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/yourusername/foodstore/issues)
- 💬 [Discussions](https://github.com/yourusername/foodstore/discussions)
