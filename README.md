# Food Store - Plataforma de E-commerce

Aplicación full-stack de gestión de una tienda de comida. Incluye catálogo de productos, carrito, pedidos, panel de administración y pago con MercadoPago.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy (async) + Alembic |
| Frontend | React 18 + TypeScript + Vite + TailwindCSS v4 |
| Base de datos | PostgreSQL 16 (Docker) |
| Pagos | MercadoPago (Checkout Pro) |
| Estado | Zustand + TanStack Query |
| Tunnel | ngrok (webhooks MercadoPago en desarrollo) |

---

## Requisitos previos

- **Python** 3.12+
- **Node.js** 18+ y npm 9+
- **Docker Desktop** (requerido — PostgreSQL corre en Docker)

> Si tenés PostgreSQL instalado localmente, Docker lo expone en el puerto **5433** para evitar conflictos.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/NahuelA19/food_store_gestion.git
cd food_store_gestion
```

### 2. Levantar PostgreSQL con Docker

```bash
docker compose up -d postgres
```

Esto levanta PostgreSQL en `localhost:5433` con la base `food_store` y el usuario `food_store_user` ya configurados (ver `docker/init-db.sql`).

### 3. Configurar el backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar (Windows)
venv\Scripts\activate

# Activar (Linux/macOS)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

Crear `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://food_store_user:root@localhost:5433/food_store
TEST_DATABASE_URL=postgresql+asyncpg://food_store_user:root@localhost:5433/food_store_test
DB_USER=food_store_user
DB_PASSWORD=root
DB_NAME=food_store
DB_PORT=5433
DB_HOST=localhost

ENVIRONMENT=development
DEBUG=true
SECRET_KEY=change-this-insecure-dev-key-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15

BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

# MercadoPago — obtené las credenciales de sandbox en:
# https://www.mercadopago.com.ar/developers/panel/app
MP_ACCESS_TOKEN=TEST-tu-access-token
MP_PUBLIC_KEY=TEST-tu-public-key
MP_WEBHOOK_SECRET=
MP_NOTIFICATION_URL=http://localhost:8000/api/v1/payments/webhook

# ngrok — completar después de levantar el servicio (ver sección MercadoPago)
# NGROK_AUTHTOKEN=tu-token
```

Correr las migraciones y seeds:

```bash
alembic upgrade head
python run_seeds.py
```

### 4. Configurar el frontend

Instalar dependencias desde la raíz del proyecto:

```bash
cd ..
npm install --ignore-scripts
```

> `--ignore-scripts` evita el error de Husky que ocurre cuando el paquete aún no está instalado.

---

## Levantar el proyecto

Necesitás **tres terminales**.

**Terminal 1 — Backend:**

```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
uvicorn app.main:app --reload
```

Disponible en `http://localhost:8000` · Swagger en `http://localhost:8000/docs`.

**Terminal 2 — Frontend:**

```bash
npm run dev --workspace frontend
```

Disponible en `http://localhost:5173`.

**Docker (en segundo plano):**

```bash
docker compose up -d postgres
```

---

## MercadoPago — configuración de pagos

Para que los pagos funcionen en sandbox necesitás credenciales de prueba y ngrok para recibir webhooks.

### 1. Credenciales

1. Entrá a [mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
2. Creá o seleccioná tu app
3. Copiá el **Access Token** (`TEST-...`) y el **Public Key** (`TEST-...`) de "Credenciales de prueba"
4. Pegálos en `backend/.env`:

```env
MP_ACCESS_TOKEN=TEST-tu-access-token
MP_PUBLIC_KEY=TEST-tu-public-key
```

### 2. ngrok — webhooks y redirección automática

ngrok expone el backend localmente para que MP pueda llamar al webhook y redirigir automáticamente al usuario después del pago.

**Obtener authtoken:**

1. Creá cuenta gratuita en [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Copiá tu authtoken

**Configurar:**

```env
# backend/.env
NGROK_AUTHTOKEN=tu-token
```

**Levantar ngrok:**

```bash
docker compose up -d ngrok
```

**Obtener la URL pública:**

```bash
curl http://localhost:4040/api/tunnels
# buscá el campo "public_url", e.g. https://xxxx.ngrok-free.app
```

**Actualizar `backend/.env` con la URL de ngrok:**

```env
BASE_URL=https://xxxx.ngrok-free.app
MP_NOTIFICATION_URL=https://xxxx.ngrok-free.app/api/v1/payments/webhook
```

**Reiniciá el backend** para que tome los cambios.

> La URL de ngrok cambia cada vez que reiniciás el contenedor. Repetí el paso de obtener la URL y actualizar el `.env` en cada sesión.

---

## Estructura del proyecto

```
food_store_gestion/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py             # Entry point
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── models/             # SQLAlchemy models
│   │   ├── routes/             # Endpoints por dominio
│   │   ├── services/           # Lógica de negocio
│   │   ├── core/               # UoW, seguridad, base
│   │   └── dependencies.py     # Inyección de dependencias
│   ├── alembic/                # Migraciones de base de datos
│   ├── run_seeds.py            # Poblar base de datos inicial
│   ├── requirements.txt
│   └── .env                    # Variables locales (no commitear)
│
├── frontend/                   # App React
│   ├── src/
│   │   ├── api/                # Clientes HTTP por dominio
│   │   ├── components/         # Componentes reutilizables
│   │   ├── pages/              # Páginas de la app
│   │   ├── store/              # Estado global (Zustand)
│   │   ├── hooks/              # Custom hooks
│   │   └── App.tsx             # Rutas y layout
│   └── src/lib/utils.ts        # Utilidades (cn, getProductImageUrl)
│
├── docker/
│   └── init-db.sql             # Inicialización de PostgreSQL
├── docker-compose.yml          # PostgreSQL + ngrok
├── package.json                # Workspace raíz
└── README.md
```

---

## Scripts útiles

```bash
# Correr migraciones
cd backend && alembic upgrade head

# Crear nueva migración
cd backend && alembic revision --autogenerate -m "descripcion"

# Poblar base de datos
cd backend && python run_seeds.py

# Ver logs de PostgreSQL
docker compose logs postgres

# Ver URL de ngrok
curl http://localhost:4040/api/tunnels
```

---

## Git Workflow

Este proyecto usa **Conventional Commits**:

```
feat      → nueva funcionalidad
fix       → corrección de bug
docs      → documentación
refactor  → refactoring sin cambio funcional
style     → cambios de estilo/formato
chore     → tareas de mantenimiento
```

Los hooks de Husky validan el formato automáticamente al commitear.

---

## Licencia

MIT
