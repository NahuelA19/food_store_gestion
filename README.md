<!-- 🍕 Food Store - Plataforma E-commerce de Gestión de Comida -->
<div align="center">

![Food Store Logo](img%20de%20foodStore%20de%20gestion/logo.png)

# 🍕 Food Store — Plataforma E-commerce de Gestión de Comida

> Una solución full-stack moderna, escalable y lista para producción para gestionar pedidos, cocina, pagos y clientes en tiempo real.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white&style=for-the-badge)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.2+-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white&style=for-the-badge)](https://www.docker.com/)
[![Node Version](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/)

**[🚀 Iniciar Rápido](#iniciar-rápido)** • **[📖 Documentación](#documentación)** • **[🎨 Demo](#demo)** • **[🤝 Contribuir](#contribuir)**

</div>

---

## 🎯 ¿Qué es Food Store?

Food Store es una **plataforma integral de gestión** diseñada para restaurantes, bares y tiendas de comida. Combina un **catálogo de productos elegante**, **carrito inteligente**, **sistema de pagos con MercadoPago**, **panel administrativo poderoso** y un **display de cocina en tiempo real** (KDS) que optimiza la producción.

**Todo en una única solución**, desplegable en minutos con Docker.

### 🌟 Características Principales

| Feature | Descripción |
|---------|------------|
| 🛍️ **Catálogo Dinámico** | Productos con categorías, búsqueda full-text, imágenes y stock en tiempo real |
| 🛒 **Carrito Inteligente** | Persistencia local, cálculo de totales, promociones y descuentos |
| 💳 **Pagos Integrados** | MercadoPago (Checkout Pro), efectivo, tarjeta directa — webhooks automáticos |
| 👨‍💼 **Panel Admin** | Dashboard, gestión de productos, órdenes, empleados, sucursales y reportes |
| 🍳 **Display de Cocina (KDS)** | Pantalla en tiempo real de órdenes, urgencia visual, sonido y notificaciones |
| 📱 **Mobile-First** | Responsive design optimizado para tablet y mobile en cocina |
| 🔐 **Autenticación Segura** | JWT, refresh tokens, roles (cliente, admin, chef) |
| 🗄️ **Base de Datos Robusta** | PostgreSQL async-first, migraciones automáticas, seeds iniciales |
| 🚀 **API RESTful** | Documentación OpenAPI (Swagger), CORS configurado, validación Pydantic |
| 📊 **Observabilidad** | Logs estructurados, tracing, health checks |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — framework async-first, validación automática, documentación OpenAPI
- **SQLAlchemy 2.0** — ORM moderno, querycompilación async con asyncpg
- **Pydantic v2** — validación de esquemas, serialización
- **Alembic** — migraciones de base de datos automáticas
- **Uvicorn** — servidor ASGI de alto rendimiento

### Frontend
- **React 18** — componentes funcionales, hooks, concurrent features
- **TypeScript** — tipado estático, safety
- **Vite** — bundler rápido, HMR instantáneo
- **TailwindCSS v4** — utility-first CSS, diseño responsive
- **Zustand** — state management minimalista
- **TanStack Query** — data fetching, caching, sincronización
- **React Router** — navegación declarativa

### Infraestructura
- **PostgreSQL 16** — base de datos relacional, async driver (asyncpg)
- **Docker + Docker Compose** — containerización, orquestación local
- **Alembic** — versionado de schema
- **ngrok** — tunneling para webhooks en desarrollo

### DevOps & Tooling
- **Husky + commitlint** — validación de commits convencionales
- **ESLint + Ruff** — linting automático
- **Prettier + Black** — formateo de código
- **pytest + Vitest** — testing (backend + frontend)
- **GitHub Actions** — CI/CD (lint, test, build)

---

## 🚀 Iniciar Rápido

### 📋 Requisitos Previos

- **Docker Desktop** (incluye Docker Compose) — [descargar aquí](https://www.docker.com/products/docker-desktop)
- **Git** — para clonar el repositorio
- *(Opcional)* **Node.js 20+** — si querés trabajar fuera de Docker

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/NahuelA19/food_store_gestion.git
cd food_store_gestion
```

### 2️⃣ Configurar Variables de Entorno

Crea un archivo `.env` en la **raíz del proyecto** (donde está `docker-compose.yml`):

```env
# ======= BASE DE DATOS =======
DB_USER=food_store_user
DB_PASSWORD=root
DB_NAME=food_store
DB_PORT=5433

# ======= SERVIDOR =======
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=change-this-insecure-dev-key-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

# ======= MERCADOPAGO (Sandbox) =======
# Obtené credenciales en: https://www.mercadopago.com.ar/developers/panel/app
MP_ACCESS_TOKEN=TEST-tu-access-token
MP_PUBLIC_KEY=TEST-tu-public-key
MP_WEBHOOK_SECRET=
MP_NOTIFICATION_URL=http://localhost:8000/api/v1/payments/webhook

# ======= FRONTEND =======
VITE_API_URL=http://localhost:8000/api/v1
VITE_MP_PUBLIC_KEY=TEST-tu-public-key

# ======= NGROK (Opcional) =======
# Solo si querés webhooks automáticos de MP en desarrollo
# NGROK_AUTHTOKEN=tu-token
```

> **⚠️ Importante:** El `.env` va en la **raíz del proyecto**, NO en `backend/`. Docker Compose lo lee desde ahí.

### 3️⃣ Iniciar Todo

```bash
docker compose up
```

**Eso es todo.** Docker:
- ✅ Construye las imágenes
- ✅ Inicia PostgreSQL, backend y frontend
- ✅ Corre migraciones automáticamente
- ✅ Siembra datos iniciales
- ✅ Activa hot reload en ambos servidores

### 📍 Accede a los servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🎨 Frontend | http://localhost:5173 | App React — catálogo, carrito, pedidos |
| 🔧 Backend | http://localhost:8000 | API FastAPI |
| 📚 Swagger | http://localhost:8000/docs | Documentación interactiva de endpoints |
| 🗄️ PostgreSQL | localhost:5433 | Base de datos (usuario: `food_store_user`, pwd: `root`) |

> La primera vez tarda **1-2 minutos** porque Docker construye las imágenes.

---

## 💳 Configurar Pagos con MercadoPago

Por defecto, **sin credenciales de MP, el botón "Pagar con MercadoPago" falla con 503**. Los métodos "Efectivo" y "Tarjeta Directa" funcionan sin configuración.

### Obtener Credenciales de Sandbox

1. 🌐 Entrá a [mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
2. 🏗️ Creá o seleccioná tu app
3. 🔑 Copiá el **Access Token** (`TEST-...`) y **Public Key** (`TEST-...`)
4. 📝 Pegálos en el `.env`:

```env
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx
MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxx
VITE_MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxx
```

5. 🔄 Reiniciá el backend:

```bash
docker compose up -d --force-recreate backend
```

### (Opcional) Configurar ngrok para Webhooks Automáticos

ngrok expone tu localhost públicamente para que MercadoPago notifique el resultado del pago.

**1. Creá una cuenta en [ngrok](https://dashboard.ngrok.com/) y obtené tu authtoken**

**2. Agregá el authtoken al `.env`:**

```env
NGROK_AUTHTOKEN=tu-token-aqui
```

**3. Inicia ngrok:**

```bash
docker compose --profile ngrok up -d ngrok
```

**4. Obtené la URL pública de ngrok:**

```bash
curl http://localhost:4040/api/tunnels
# Resultado: "public_url": "https://xxxx-xxxx-xxxx.ngrok-free.app"
```

**5. Actualiza el `.env` con esa URL:**

```env
BASE_URL=https://xxxx-xxxx-xxxx.ngrok-free.app
MP_NOTIFICATION_URL=https://xxxx-xxxx-xxxx.ngrok-free.app/api/v1/payments/webhook
```

**6. Reinicia el backend:**

```bash
docker compose up -d --force-recreate backend
```

> 📌 **Nota:** La URL de ngrok cambia cada reinicio. Repetí los pasos 4-6 en cada sesión.

---

## 📂 Estructura del Proyecto

```
food_store_gestion/
│
├── 🔧 Configuración
│   ├── .env                           # Variables de entorno (gitignore) ← RAÍZ
│   ├── docker-compose.yml             # Orquestación de servicios
│   ├── docker/                        # Dockerfile custom, scripts init
│   └── opencode.json                  # Config MCP & opencode
│
├── 🎛️ Backend (FastAPI)
│   └── backend/
│       ├── app/
│       │   ├── main.py                # Entry point, router registration, CORS
│       │   ├── config.py              # Pydantic settings, env vars
│       │   ├── dependencies.py        # Inyección de dependencias
│       │   ├── models/                # SQLAlchemy ORM models
│       │   ├── routes/                # Endpoints por dominio (products.py, orders.py, etc.)
│       │   ├── services/              # Lógica de negocio (order_service, payment_service, etc.)
│       │   ├── schemas/               # Pydantic request/response models
│       │   └── core/                  # Unit of Work, seguridad, excepciones
│       ├── database/
│       │   └── seeds.py               # Datos iniciales
│       ├── alembic/                   # Migraciones (Alembic + SQLAlchemy)
│       ├── tests/                     # pytest suite
│       ├── requirements.txt           # Python dependencies
│       └── pyproject.toml             # Black, ruff, mypy, pytest config
│
├── 🎨 Frontend (React + TS)
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx               # Entry point React
│       │   ├── App.tsx                # Router, layout principal
│       │   ├── api/                   # Clientes HTTP por dominio
│       │   ├── components/            # Componentes reutilizables (Button, Card, etc.)
│       │   ├── pages/                 # Páginas (LoginPage, HomePage, AdminDashboard, etc.)
│       │   ├── hooks/                 # Custom hooks (useAuth, useCart, useKitchenSocket, etc.)
│       │   ├── store/                 # Zustand stores (auth, cart, ui)
│       │   ├── types/                 # TypeScript tipos y interfaces
│       │   ├── index.css              # Estilos globales, TailwindCSS
│       │   └── lib/                   # Utilidades (validators, formatters, etc.)
│       ├── public/                    # Assets estáticos
│       ├── vite.config.ts             # Vite config
│       └── package.json
│
├── 📦 Shared Packages
│   └── packages/
│       ├── core/                      # Utilities compartidas
│       └── ui/                        # Componentes compartidos
│
├── 📚 Documentación
│   ├── docs/
│   │   ├── API.md                     # Documentación API endpoints
│   │   ├── ARCHITECTURE.md            # Decisiones arquitectónicas
│   │   ├── DATABASE.md                # Schema, relaciones, migrations
│   │   ├── AUTHENTICATION.md          # JWT, roles, seguridad
│   │   ├── CONTRIBUTING.md            # Guía para contribuidores
│   │   └── screenshots/               # Capturas de pantalla
│   └── feature-display-cocina/        # Especificación del KDS
│
├── 🧪 Testing
│   ├── backend/tests/                 # pytest (async, fixtures, mocking)
│   └── frontend/src/__tests__/        # Vitest + React Testing Library
│
└── 🔄 DevOps
    ├── .github/workflows/             # GitHub Actions (lint, test, build)
    ├── .husky/                        # Git hooks (commitlint)
    └── skills-lock.json               # Agent skills registry
```

---

## 📜 Scripts Útiles

### 🐳 Docker Compose

```bash
# Levantar todo
docker compose up

# Levantar en background
docker compose up -d

# Ver logs
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar un servicio (toma cambios del .env)
docker compose up -d --force-recreate backend

# Bajar y limpiar volúmenes (reset completo de BD)
docker compose down -v

# Ejecutar comando dentro de un contenedor
docker compose exec backend bash
docker compose exec frontend bash

# Crear migración automática
docker compose exec backend alembic revision --autogenerate -m "add_column_xyz"

# Aplicar migraciones manualmente
docker compose exec backend alembic upgrade head
```

### 🧪 Testing

```bash
# Frontend — todo con npm workspaces
npm run test

# Backend — desde dentro del contenedor o local
cd backend
python -m pytest                        # Todos los tests
python -m pytest -v                     # Verbose
python -m pytest --cov=app             # Con coverage
python -m pytest tests/test_orders.py   # Un archivo específico
```

### 🧹 Linting & Formato

```bash
# Todos (lint + format + typecheck)
npm run check:all

# Backend
cd backend && ruff check .              # Lint
cd backend && black .                   # Format

# Frontend
npm run lint --workspace frontend       # ESLint
npm run format --workspace frontend     # Prettier
```

### 🌐 ngrok (Webhooks)

```bash
# Obtener URL pública actual
curl http://localhost:4040/api/tunnels

# Ver logs de ngrok
docker compose logs -f ngrok
```

---

## 🎨 Demo & Screenshots

### 🏠 Pantalla de Inicio
Catálogo de productos con búsqueda, filtros y vista en grid.

### 🛒 Carrito
Agregar/quitar productos, ver total, proceder al checkout.

### 💳 Checkout
Seleccionar método de pago (MercadoPago, efectivo, tarjeta).

### 👨‍💼 Admin Dashboard
Visión general: órdenes, ventas, empleados, productos.

### 📋 Gestión de Órdenes
Listar, filtrar, cambiar estado de órdenes (pendiente → confirmado → enviado → entregado).

### 🍳 Display de Cocina (KDS)
**Pantalla en tiempo real para la cocina:**
- Órdenes con urgencia visual (colores por tiempo)
- Sonido de notificación cuando llega nueva orden
- Timer que muestra cuánto tiempo tiene la orden
- Cambiar estado (nuevo → preparando → listo)
- Responsive para tablet en pared de cocina

### 👥 Gestión de Empleados
ABM de empleados, asignación de roles (admin, chef, camarero).

---

## 🔐 Autenticación & Seguridad

### JWT (JSON Web Tokens)

- **Access Token** — corta duración (15 min default)
- **Refresh Token** — larga duración (7 días default)
- Almacenado en httpOnly cookie (seguro contra XSS)
- Rotación automática al expirar

### Roles

- 👤 **Cliente** — ver catálogo, hacer pedidos, ver historial
- 👨‍💼 **Admin** — gestionar productos, órdenes, empleados, reportes
- 🍳 **Chef** — ver display de cocina (KDS), cambiar estado de órdenes

---

## 🗄️ Base de Datos

### Esquema Principal

```
users (autenticación)
  ├── id (PK)
  ├── email (unique)
  ├── hashed_password
  ├── role (enum: client, admin, chef)
  └── created_at

products (catálogo)
  ├── id (PK)
  ├── name
  ├── description
  ├── price
  ├── category_id (FK)
  ├── image_url
  ├── stock
  └── created_at

categories
  ├── id (PK)
  ├── name
  └── description

orders (pedidos)
  ├── id (PK)
  ├── user_id (FK)
  ├── status (enum: pending, confirmed, sent, delivered)
  ├── total_amount
  ├── payment_method (enum: mercadopago, cash, card)
  ├── payment_status (enum: pending, confirmed, failed)
  ├── notas (texto adicional)
  └── created_at

order_items (detalle de pedidos)
  ├── id (PK)
  ├── order_id (FK)
  ├── product_id (FK)
  ├── quantity
  └── unit_price

payments (pagos)
  ├── id (PK)
  ├── order_id (FK)
  ├── mp_id (MercadoPago ID)
  ├── status
  └── created_at
```

### Migraciones

Las migraciones se corren **automáticamente al iniciar Docker**. Para crear una nueva:

```bash
docker compose exec backend alembic revision --autogenerate -m "descripcion"
```

---

## 🌐 API REST

### Ejemplos de Endpoints

```
GET    /api/v1/products                # Listar productos
POST   /api/v1/products                # Crear producto (admin)
GET    /api/v1/products/{id}           # Obtener producto
PUT    /api/v1/products/{id}           # Actualizar producto (admin)
DELETE /api/v1/products/{id}           # Eliminar producto (admin)

GET    /api/v1/orders                  # Mis órdenes (autenticado)
POST   /api/v1/orders                  # Crear orden
GET    /api/v1/orders/{id}             # Obtener orden
PATCH  /api/v1/orders/{id}             # Actualizar estado de orden

POST   /api/v1/auth/register           # Registro
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/refresh            # Refresh token
POST   /api/v1/auth/logout             # Logout

POST   /api/v1/payments                # Iniciar pago con MP
POST   /api/v1/payments/webhook        # Webhook de MP (notificación)

WS     /ws/kitchen/{room_id}           # WebSocket para KDS
```

Para ver todos los endpoints interactivamente:
👉 **http://localhost:8000/docs** (Swagger UI)

---

## 🚀 Display de Cocina (KDS)

El sistema incluye un **Kitchen Display System (KDS)** en tiempo real para optimizar la producción.

### Características

✅ **Vista en tiempo real** de órdenes pendientes
✅ **Urgencia visual** — colores por tiempo transcurrido
✅ **Notificación sonora** cuando llega nueva orden
✅ **Timer** que muestra cuánto tiempo tiene la orden
✅ **Estados** — nuevo → preparando → listo
✅ **Responsive** — diseñado para tablet en pared
✅ **WebSocket** — comunicación bidireccional sin latencia

### Acceder al KDS

```
http://localhost:5173/kitchen
```

*Requiere rol de chef o admin.*

### Cómo Funciona

1. **Órdenes entrantes** — aparecen en rojo urgente
2. **Marcar como "preparando"** — cambia a amarillo, timer avanza
3. **Marcar como "listo"** — verde, notificación al cliente
4. **Autorefresh** — WebSocket mantiene sincronizado en tiempo real

---

## 🤝 Contribuir

### Flujo de Desarrollo

1. **Cloná de `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/tu-feature-nombre
   ```

2. **Hacé cambios y commiteá con Conventional Commits:**
   ```bash
   git add .
   git commit -m "feat(products): add search filter to catalog"
   ```
   Tipos válidos: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`

3. **Pusheá tu rama:**
   ```bash
   git push origin feat/tu-feature-nombre
   ```

4. **Abrí un PR** en GitHub con descripción clara

5. **Esperá revisión** y aprobación

### Estándares de Código

- ✅ Tests obligatorios (backend + frontend)
- ✅ Linting y formato automático (Ruff, ESLint, Prettier, Black)
- ✅ TypeScript strict mode en frontend
- ✅ Docstrings en funciones importantes
- ✅ 80+ caracteres de ancho preferido

### Ejecutar Checks Localmente

```bash
# Backend
cd backend && python -m pytest -v
cd backend && ruff check .
cd backend && black --check .

# Frontend
npm run test --workspace frontend
npm run lint --workspace frontend
npm run format:check --workspace frontend
```

---

## 🛠️ Troubleshooting

### Docker no inicia

```bash
# Verificar que Docker Desktop esté corriendo
docker ps

# Ver logs detallados
docker compose logs

# Limpiar todo y reintentar
docker compose down -v
docker compose up
```

### Puerto en uso

```bash
# Si algún puerto ya está ocupado, cambiar en docker-compose.yml
# o en variables de entorno
```

### Base de datos corrupta

```bash
# Reset completo (pierde TODOS los datos)
docker compose down -v
docker compose up
```

### El backend devuelve 503 en pagos

→ Sin credenciales de MercadoPago configuradas. Ver sección **Configurar Pagos**.

### WebSocket del KDS no conecta

```bash
# Verificar que backend esté corriendo
docker compose logs -f backend

# Verificar que frontend vea la URL correcta en .env
docker compose logs -f frontend | grep "VITE_API_URL"
```

---

## 📞 Soporte

- 🐛 **Bugs** — Abrí un issue en [GitHub Issues](https://github.com/NahuelA19/food_store_gestion/issues)
- 💬 **Preguntas** — Usá [GitHub Discussions](https://github.com/NahuelA19/food_store_gestion/discussions)
- 📖 **Docs** — Lee [`docs/`](docs/) para guías detalladas

---

## 📄 Licencia

MIT — Usá libremente en proyectos comerciales y personales. Ver [`LICENSE`](LICENSE).

---

## 🙌 Agradecimientos

Construido con ❤️ por el equipo de Food Store.

<div align="center">

**[⬆ Volver arriba](#-food-store--plataforma-e-commerce-de-gestión-de-comida)**

</div>
