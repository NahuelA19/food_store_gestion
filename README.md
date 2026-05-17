# Food Store - Plataforma de E-commerce

Aplicación full-stack de gestión de una tienda de comida. Incluye catálogo de productos, carrito, pedidos, panel de administración y pago con MercadoPago.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy (async) + Alembic |
| Frontend | React 18 + TypeScript + Vite + TailwindCSS v4 |
| Base de datos | PostgreSQL |
| Pagos | MercadoPago (Checkout Pro) |
| Estado | Zustand + TanStack Query |

---

## Requisitos previos

- **Python** 3.12+
- **Node.js** 18+ y npm 9+
- **PostgreSQL** 14+ (local o vía Docker)
- **Docker** (opcional, para levantar PostgreSQL fácilmente)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/NahuelA19/food_store_gestion.git
cd food_store_gestion
```

### 2. Levantar PostgreSQL con Docker

```bash
docker-compose up -d postgres
```

Si no usás Docker, asegurate de tener PostgreSQL corriendo localmente y creá la base de datos:

```sql
CREATE DATABASE food_store;
CREATE USER food_store_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE food_store TO food_store_user;
```

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

Crear el archivo `backend/.env` copiando el ejemplo:

```bash
cp .env.example .env
```

Editá `backend/.env` con tus valores reales:

```env
# Server
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Base de datos
DATABASE_URL=postgresql+asyncpg://food_store_user:tu_password@localhost:5432/food_store

# Seguridad
SECRET_KEY=una-clave-secreta-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# URLs
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Logging
LOG_LEVEL=INFO

# MercadoPago (requerido para pagos, ver sección más abajo)
MP_ACCESS_TOKEN=TEST-tu-access-token
MP_PUBLIC_KEY=TEST-tu-public-key
MP_WEBHOOK_SECRET=
MP_NOTIFICATION_URL=http://localhost:8000/api/v1/payments/webhook
```

Correr las migraciones:

```bash
alembic upgrade head
```

### 4. Configurar el frontend

```bash
cd ../frontend
```

Crear `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
```

Instalar dependencias (desde la raíz del proyecto):

```bash
cd ..
npm install
```

---

## Levantar el proyecto

Necesitás dos terminales abiertas.

**Terminal 1 — Backend:**

```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
uvicorn app.main:app --reload
```

El backend queda disponible en `http://localhost:8000`.
Documentación Swagger en `http://localhost:8000/docs`.

**Terminal 2 — Frontend:**

```bash
npm run dev --workspace frontend
```

El frontend queda disponible en `http://localhost:5173`.

---

## Configurar MercadoPago (sandbox)

Para probar pagos en modo sandbox necesitás:

**1. Obtener credenciales de prueba**

Ingresá a [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel), seleccioná tu app y copiá las **Credenciales de prueba** (`TEST-...`). Pegálas en `backend/.env`.

**2. Crear un usuario comprador de prueba**

```bash
curl -X POST https://api.mercadopago.com/users/test \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_TEST" \
  -H "Content-Type: application/json" \
  -d '{"site_id": "MLA", "description": "Test comprador"}'
```

Guardá el `email` y `password` que devuelve.

**3. Realizar un pago de prueba**

1. Hacé un pedido en la app con tu usuario normal
2. Cuando MP te redirija al checkout, iniciá sesión con el **usuario comprador de prueba**
3. Usá una tarjeta de prueba:
   - Número: `4509 9535 6623 3704`
   - Vencimiento: cualquier fecha futura (`11/25`)
   - CVV: `123`
   - Nombre: `APRO` (pago aprobado)

> **Importante:** Las credenciales de sandbox nunca deben commitearse al repositorio. Siempre van en `.env` (ignorado por git).

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
│   ├── requirements.txt
│   ├── .env.example
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
│   ├── .env.example
│   └── .env.local              # Variables locales (no commitear)
│
├── docker-compose.yml          # PostgreSQL para desarrollo
├── package.json                # Workspace raíz
└── README.md
```

---

## Scripts útiles

```bash
# Lint
npm run lint

# Formatear código
npm run format

# Correr migraciones
cd backend && alembic upgrade head

# Crear nueva migración
cd backend && alembic revision --autogenerate -m "descripcion"

# Ver logs de PostgreSQL
docker-compose logs postgres
```

---

## Git Workflow

Este proyecto usa **Conventional Commits**. El formato es:

```
tipo(scope): descripción

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
