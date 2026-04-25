# Food Store — Repositorio Base

Sistema de e-commerce de productos alimenticios desarrollado con **Spec-Driven Development (SDD)** usando OPSX y Claude Code.

---

## Documentación del sistema

Antes de escribir una línea de código, leé los tres documentos en `docs/`:

| Archivo | Contenido |
|---------|-----------|
| `docs/Descripcion.txt` | Visión general, actores del sistema y stack tecnológico |
| `docs/Integrador.txt` | Arquitectura en capas, ERD, API REST y patrones de diseño |
| `docs/Historias_de_usuario.txt` | US-000 a US-076 con criterios de aceptación y reglas de negocio |

Estos documentos son la fuente de verdad del sistema. El agente los lee antes de cada propuesta.

---

## Stack tecnológico

**Backend**: FastAPI · SQLModel · PostgreSQL · Alembic · bcrypt · python-jose · slowapi · MercadoPago SDK  
**Frontend**: React · TypeScript · Vite · TanStack Query · TanStack Form · Zustand · Axios · Tailwind CSS · Recharts

---

## Setup del entorno de desarrollo

### Requisitos previos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Claude Code: `npm install -g @anthropic-ai/claude-code`
- OpenSpec CLI: `npm install -g @fission-ai/openspec`

### 1. Clonar e inicializar

```bash
git clone <url-del-repo> food-store
cd food-store
```

### 2. Inicializar OpenSpec

```bash
npx @fission-ai/openspec@latest init
```

Esto genera la carpeta `openspec/` donde van a vivir todos los artefactos del proyecto.

### 3. Backend

```bash
cd backend
cp .env.example .env
# Completar las variables de entorno en .env

python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.venv\Scripts\activate      # Windows

pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000`  
Documentación Swagger en `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Completar VITE_API_URL=http://localhost:8000

npm install
npm run dev
```

App disponible en `http://localhost:5173`

---

## Flujo de desarrollo con OPSX

Todo cambio al sistema sigue este ciclo:

```
/opsx:explore   →  pensar antes de comprometerse (opcional)
/opsx:propose   →  generar propuesta + diseño + tareas
/opsx:apply     →  implementar tarea por tarea
/opsx:archive   →  sincronizar specs y cerrar el change
```

### Orden de implementación (23 changes, 2-3 meses)

**FASE 0 — Cimientos** (6-8 días):
```
1. infrastructure-setup          ← monorepo, FastAPI, React, patrones
2. database-domain-models        ← ERD, 18 entidades, Alembic
3. global-error-handling         ← RFC 7807, validaciones, rate limiting
```

**FASE 1 — Autenticación** (7 días, secuencial):
```
4. authentication-system         ← JWT, refresh tokens
5. rbac-authorization            ← roles, guards, ownership
6. user-management               ← CRUD usuarios
```

**FASE 2 — Catálogo** (5-6 días, parallelizable):
```
7. categories-hierarchy          ← CTE, validación ciclos
8. ingredients-allergen-system   ← ingredientes, alérgenos
9. products-catalog              ← CRUD, M2M, stock, snapshots
```

**FASE 3 — Cliente** (5-6 días, parallelizable):
```
10. client-addresses             ← CRUD direcciones
11. shopping-cart-ui             ← Zustand + localStorage
12. navigation-layout            ← header/sidebar, token refresh
```

**FASE 4 — Pedidos (CRÍTICA, 12-14 días, secuencial):**
```
13. order-creation-uow-atomic    ← UoW, snapshots, SELECT FOR UPDATE [PIVOT]
14. payment-mercadopago          ← Orders API, webhooks, idempotencia
15. order-fsm-state-machine      ← 6 estados, transiciones, historial
16. order-visualization          ← listado, detalle, tracking
17. payment-ui-feedback          ← modal confirmación, toasts
```

**FASE 5 — Admin** (5 días, parallelizable):
```
18. admin-dashboard-metrics      ← KPIs, gráficos
19. admin-catalog-management     ← CRUD avanzado
20. system-configuration         ← key-value store, auditoría
```

**FASE 6 — Refinamiento** (5-8 días):
```
21. testing-coverage-pytest      ← > 60% coverage [Bonus +10 pts]
22. deployment-railway           ← URL pública [Bonus +10 pts]
23. documentation                ← README, Swagger, arquitectura
```

**Punto crítico**: el change #13 (`order-creation-uow-atomic`) es el pivot arquitectónico — todo después depende de él.

---

## Variables de entorno

Crear `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/foodstore
SECRET_KEY=tu-clave-secreta-de-64-caracteres-minimo
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MP_ACCESS_TOKEN=TEST-tu-token-de-mercadopago
MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
CORS_ORIGINS=http://localhost:5173
```

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
```

---

## Convenciones de commits

```
feat(modulo): descripción del cambio
fix(modulo): descripción del bug corregido
refactor(modulo): descripción del refactor
test(modulo): descripción de los tests
docs(modulo): descripción del cambio en docs
```
