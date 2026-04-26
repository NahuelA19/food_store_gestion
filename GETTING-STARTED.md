# 🚀 Getting Started with Food Store

Your complete guide to starting development on the Food Store e-commerce platform in less than 5 minutes.

## Prerequisites Check

Before you start, verify you have:

```bash
# Node.js (18+)
node --version    # Should show v18.x or higher

# npm (9+)
npm --version     # Should show 9.x or higher

# Python (3.10+)
python --version  # Should show 3.10 or higher

# Git
git --version     # Should show git version
```

If any are missing, visit:
- [Node.js](https://nodejs.org/) - Download LTS
- [Python](https://www.python.org/downloads/)
- [Git](https://git-scm.com/download)

## 5-Minute Quick Start

### 1. Clone & Install (2 min)

```bash
git clone https://github.com/yourusername/foodstore.git
cd foodstore
npm install
```

### 2. Set Up Backend (2 min)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install black ruff pytest pytest-asyncio
```

### 3. Start Development Servers (1 min)

**Terminal 1 - Frontend:**
```bash
npm run dev --workspace frontend
# Open http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
# Visit http://localhost:8000/docs for API explorer
```

✅ **Done!** Both servers running. Continue to "Development" section below.

---

## Development Workflow

### Making Code Changes

```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes to files
# (code automatically lints & formats)

# 3. Commit with conventional message
git commit -m "feat(products): add search filter"

# 4. Push & create Pull Request
git push origin feat/my-feature
```

### Running Tests

```bash
# Frontend
npm run test --workspace frontend

# Backend
cd backend && python -m pytest

# Both
npm run test
```

### Code Quality Checks

```bash
# Check everything
npm run check:all

# Individual checks
npm run lint      # Lint all
npm run format    # Auto-format
npm run build     # Build all
```

---

## Common Tasks

### Adding a React Component

1. Create file: `frontend/src/components/MyComponent.tsx`
2. Add Prettier auto-format: `npm run format`
3. Test: Create `MyComponent.test.tsx`
4. Commit: `git commit -m "feat(components): add MyComponent"`

See [Creating a Component Guide](./docs/guides/creating-a-component.md)

### Adding an API Endpoint

1. Create file: `backend/app/routes/my_routes.py`
2. Register in `backend/app/main.py`
3. Test with: `python -m pytest`
4. Format: `black . && ruff check . --fix`
5. Commit: `git commit -m "feat(api): add new endpoint"`

See [Adding a Route Guide](./docs/guides/adding-a-route.md)

### Writing Tests

Frontend:
```bash
npm run test --workspace frontend -- --watch
```

Backend:
```bash
cd backend && python -m pytest --watch
```

See [Writing Tests Guide](./docs/guides/writing-tests.md)

---

## Troubleshooting

### "Port 5173 already in use"

```bash
# Run frontend on different port
npm run dev -- --port 3001
```

### "venv activate doesn't work on Windows"

```bash
# Use batch file instead
venv\Scripts\activate.bat

# Or PowerShell:
venv\Scripts\Activate.ps1
```

### "npm install fails with peer dependencies"

```bash
npm install --legacy-peer-deps
```

### "pip install fails with compiler errors"

```bash
# macOS - install build tools
xcode-select --install

# Windows - install Visual C++ Build Tools
# Visit: https://visualstudio.microsoft.com/downloads/
```

### "Git pre-commit hooks not running"

```bash
npx husky install
chmod +x .husky/pre-commit .husky/commit-msg
```

### "Tests fail with 'Cannot find module'"

```bash
# Reinstall dependencies
npm install
cd backend && pip install -r requirements.txt
```

### "Backend won't start - 'ModuleNotFoundError'"

```bash
# Activate venv
cd backend
source venv/bin/activate  # or venv\Scripts\activate

# Reinstall
pip install -r requirements.txt
```

### "API returning 404 for endpoints"

1. Verify backend is running: `curl http://localhost:8000/health`
2. Check route is registered in `backend/app/main.py`
3. Restart backend server

### "Frontend shows blank page"

1. Open browser console (F12) for errors
2. Check network tab for API calls
3. Verify backend is running
4. Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)

---

## File Structure Quick Reference

```
foodstore/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── main.py      # API routes
│   │   ├── routes/      # Endpoint modules
│   │   └── models/      # Data models
│   └── tests/           # API tests
│
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx      # Root component
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── __tests__/   # Tests
│   └── public/          # Static files
│
├── packages/            # Shared code
│   ├── core/           # Utilities
│   └── ui/             # Components
│
├── docs/               # Documentation
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── API.md
│   └── guides/
│
└── .github/workflows/  # CI/CD pipelines
```

---

## Next Steps

1. **[Full Setup Guide](./docs/SETUP.md)** - Detailed instructions
2. **[Architecture](./docs/ARCHITECTURE.md)** - Understand system design
3. **[Contributing](./docs/CONTRIBUTING.md)** - Git & code standards
4. **[API Docs](./docs/API.md)** - Backend endpoints

---

## Quick Links

| Resource | Link |
|----------|------|
| README | [README.md](./README.md) |
| Documentation | [docs/](./docs/) |
| Issues | [GitHub Issues](https://github.com/yourusername/foodstore/issues) |
| Discussions | [GitHub Discussions](https://github.com/yourusername/foodstore/discussions) |
| API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) (when running) |

---

## IDE Setup (Optional but Recommended)

### VS Code Extensions

1. ES7+ React/Redux/React-Native snippets
2. ESLint
3. Prettier - Code formatter
4. Python
5. Pylance
6. Ruff

### Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.formatOnSave": true
  }
}
```

---

## Having Issues?

1. ✅ Check this guide's **Troubleshooting** section
2. ✅ Read [Full Setup Guide](./docs/SETUP.md)
3. ✅ Check [GitHub Issues](https://github.com/yourusername/foodstore/issues) for similar problems
4. 💬 Ask in [GitHub Discussions](https://github.com/yourusername/foodstore/discussions)
5. 📧 Reach out on Discord/Slack (if available)

---

## Summary

You now have:
- ✅ Frontend running on `http://localhost:5173`
- ✅ Backend running on `http://localhost:8000`
- ✅ Pre-commit hooks validating code
- ✅ Tests ready to run
- ✅ Documentation to guide you

**Happy coding! 🍕**

---

**Last Updated**: 2026-04-26
