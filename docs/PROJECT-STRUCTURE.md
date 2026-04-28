# 📁 Estructura del Proyecto — Food Store

## Visión General

**Food Store** es un monorepo Node + Python que combina:
- **Frontend**: React 18 + TypeScript (npm workspace)
- **Backend**: FastAPI + Pydantic (Python separado)
- **Shared Packages**: @foodstore/core, @foodstore/ui (npm workspaces)
- **Infrastructure**: CI/CD, git hooks, dev tools compartidas

```
foodstore/
├── node_modules/          (153 MB) — Herramientas compartidas de npm
├── backend/               (79 MB) — FastAPI backend + venv Python
├── frontend/              (23 MB) — React app + node_modules
├── packages/              (16 KB) — Shared npm packages
├── docs/                  — Documentación
├── openspec/              — OPSX change artifacts
├── .github/               — GitHub Actions workflows
├── .husky/                — Git hooks (commitlint, lint, format)
├── .agents/               — Agent AI skills & instructions
├── AGENTS.md              — Configuración de agentes IA
├── package.json           — Root workspace config
├── package-lock.json      — Lock file para deps
└── .gitignore             — Ignora node_modules, venv, .env, etc.
```

---

## 1. Root `node_modules/` (153 MB) — ✅ NECESARIO

### Por qué existe
npm workspaces requieren dependencias compartidas en la raíz. Estas son herramientas de desarrollo compartidas por TODO el monorepo.

### Contenido
```
node_modules/
├── @commitlint/config-conventional@20.5.0   — Formato de commits
├── commitlint@18.6.1                        — Validador de commits
├── eslint@8.57.1                            — Linter JavaScript/TypeScript
├── prettier@3.0.0                           — Code formatter
├── husky@8.0.0                              — Git hooks
└── [399 paquetes totales]                   — Transitive deps
```

### ¿Cuándo se crea/actualiza?
```bash
npm install              # En raíz del proyecto
cd backend && pip install -r requirements.txt  # Backend separado
```

---

## 2. `backend/` (79 MB) — ✅ NECESARIO

### Estructura
```
backend/
├── app/
│   ├── main.py           — FastAPI app instance
│   ├── routes/           — API endpoints (products.py, users.py, etc.)
│   ├── models/           — Pydantic schemas (request/response)
│   ├── services/         — Business logic
│   └── dependencies.py   — Dependency injection
├── tests/
│   ├── conftest.py       — pytest fixtures
│   ├── test_health.py    — Health endpoint tests
│   └── [test files]
├── venv/                 (79 MB) — Python virtual environment
├── requirements.txt      — Runtime dependencies
├── pyproject.toml        — Python tooling (pytest, ruff, black, mypy)
└── pytest.ini            — pytest configuration
```

### Por qué `venv/` es grande
- FastAPI + Uvicorn
- Pydantic v2
- asyncpg (async PostgreSQL driver)
- pytest + fixtures
- Transitive dependencies (~50 paquetes)

### ¿Cuándo se crea/actualiza?
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

---

## 3. `frontend/` (23 MB) — ✅ NECESARIO

### Estructura
```
frontend/
├── src/
│   ├── main.tsx          — React entry point
│   ├── App.tsx           — Root component
│   ├── components/       — Reusable presentational components
│   ├── pages/            — Route-level page components
│   ├── hooks/            — Custom React hooks
│   └── __tests__/        — Vitest test files
├── node_modules/         — React dependencies
├── public/               — Static assets
├── index.html            — HTML template
├── package.json          — Workspace config
├── tsconfig.json         — TypeScript config
├── vite.config.ts        — Vite build config
├── vitest.config.ts      — Vitest test config
└── .env.example          — Environment template
```

### Por qué tiene su propio `node_modules/`
- Frontend es un npm workspace independiente
- npm instala dependencies de `package.json` localmente
- npm deduplicará automáticamente con raíz donde sea posible

### Contenido de `frontend/node_modules/`
```
frontend/node_modules/
├── react@18.3.1
├── react-dom@18.3.1
├── typescript@5.0+
├── @vitejs/plugin-react
├── vitest@latest
├── @testing-library/react
└── [30+ paquetes directos]
```

### ¿Cuándo se crea/actualiza?
```bash
npm install              # En raíz (crea frontend/node_modules)
npm install --workspace frontend  # Si necesitas solo frontend
```

---

## 4. `packages/` — Shared npm Packages

### Estructura
```
packages/
├── core/                 — @foodstore/core package
│   └── package.json      — Define nombre, version, exports
├── ui/                   — @foodstore/ui package
│   └── package.json      — Define nombre, version, exports
└── (frontend/ fue eliminado — era residuo)
```

### Propósito
- **@foodstore/core**: Shared utilities, types, constants
- **@foodstore/ui**: Shared React components, design system

### Cómo se usan
```typescript
// En frontend/src/App.tsx
import { Button } from '@foodstore/ui';
import { API_URL } from '@foodstore/core';
```

### ¿Por qué no tienen `node_modules/`?
- Son workspaces que usan las dependencias de raíz (hoisting)
- npm automáticamente las resuelve en `../../node_modules/`

---

## 5. `.gitignore` — Lo que NO se versionea

```
# IGNORADO (no commitear):
node_modules/           — Generado por npm install
backend/venv/           — Generado por python -m venv
.env                    — Secretos y credenciales
package-lock.json       — (Debería versionarse, pero está en gitignore por error previo)

# VERSIONADO (commitear):
.agents/                — AI agent skills
openspec/               — OPSX change artifacts
docs/                   — Documentación
.github/                — CI/CD workflows
AGENTS.md               — Configuración de agentes
.husky/                 — Git hooks
pyproject.toml          — Python tooling config
frontend/package.json   — Frontend dependencies list
backend/requirements.txt — Backend dependencies list
```

---

## 6. Tamaños de Directorio

| Directorio | Tamaño | Por qué | Necesario |
|-----------|--------|--------|----------|
| `node_modules/` | 153 MB | Deps compartidas (ESLint, Prettier, Husky, etc.) | ✅ SÍ |
| `backend/venv/` | ~79 MB | Python packages (FastAPI, Pydantic, pytest, etc.) | ✅ SÍ |
| `frontend/node_modules/` | ~20-25 MB | React, TypeScript, Vite, Testing Library | ✅ SÍ |
| `backend/app/` + tests/ | <1 MB | Código Python | ✅ SÍ |
| `frontend/src/` | <1 MB | Código React/TypeScript | ✅ SÍ |
| `docs/` | ~332 KB | Documentación | ✅ SÍ |
| `packages/` | ~16 KB | Shared packages (casi vacío) | ✅ SÍ |
| **TOTAL** | ~**252 MB** | Esperado para Node+Python e-commerce | ✅ |

---

## 7. ¿Cuándo ejecutar `npm install` / `pip install`?

### npm
```bash
# Primera vez o agregar dependencias
npm install

# Frontend solo
npm install --workspace frontend

# Limpiar y reinstalar
rm -rf node_modules frontend/node_modules package-lock.json
npm install
```

### pip (Backend)
```bash
cd backend

# Primera vez o cambios en requirements.txt
pip install -r requirements.txt

# Agregar nuevo paquete
pip install <package-name>
pip freeze > requirements.txt

# Limpiar y reinstalar
rm -rf venv
python -m venv venv
source venv/bin/activate  # macOS/Linux, o venv\Scripts\activate en Windows
pip install -r requirements.txt
```

---

## 8. Dev Workflow

### 1. Instalar dependencias (primera vez)
```bash
npm install              # Root + workspaces
cd backend && pip install -r requirements.txt
```

### 2. Ejecutar dev servers
```bash
npm run dev              # Frontend en :5173, backend en :8000
```

### 3. Pre-commit checks
```bash
# Husky automáticamente valida:
# 1. ESLint (frontend)
# 2. Prettier (format)
# 3. Ruff (backend lint)
# 4. Black (backend format)
# 5. commitlint (commit message format)
```

### 4. Run tests
```bash
npm run test             # Vitest (frontend) + pytest (backend)
npm run test:frontend    # Frontend solo
npm run test:backend     # Backend solo
```

### 5. Build
```bash
npm run build            # Frontend Vite build
```

---

## 9. Decisiones Arquitectónicas

| Decisión | Razón |
|----------|-------|
| **npm workspaces** | Manage frontend + shared packages con un PM único |
| **Python venv separado** | Backend es independiente; pip ≠ npm |
| **Shared tools en root** | ESLint, Prettier, Husky para TODO el monorepo |
| **Husky hooks unificados** | Un solo pre-commit hook que valida Node + Python |
| **node_modules en raíz** | npm workspaces deduplicación automática |
| **No `.env` en git** | Secretos deben estar en `.env.local` o CI/CD |
| **.gitignore unificado** | Una sola fuente de verdad para qué ignorar |

---

## 10. Troubleshooting

### ❌ "npm install falla"
```bash
# Solución: Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### ❌ "frontend/node_modules desaparece"
```bash
# npm workspaces a veces hace symlinks
# Solución: reinstalar
npm install --workspace frontend
```

### ❌ "venv Python falla"
```bash
# Solución: recrear
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### ❌ "Husky hooks no validan"
```bash
# Solución: reinstalar hooks
npx husky install
```

---

## Referencias

- **AGENTS.md** — Configuración de agentes IA
- **GETTING-STARTED.md** — Guía de inicio rápido
- **package.json** — Root workspace config
- **backend/requirements.txt** — Python dependencies
- **frontend/package.json** — Frontend workspace config
