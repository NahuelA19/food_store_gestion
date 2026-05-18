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

- **Docker Desktop** (requerido — todos los servicios corren en Docker)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/NahuelA19/food_store_gestion.git
cd food_store_gestion
```

### 2. Crear el archivo `.env` en la raíz del proyecto

```env
# Base de datos
DB_USER=food_store_user
DB_PASSWORD=root
DB_NAME=food_store
DB_PORT=5433

# Servidor
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

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_MP_PUBLIC_KEY=TEST-tu-public-key

# ngrok (opcional — solo para webhooks de MercadoPago)
# NGROK_AUTHTOKEN=tu-token
```

> El `.env` va en la **raíz del proyecto**, no en `backend/`. Docker Compose lo lee desde ahí.

### 3. Levantar el proyecto

```bash
docker compose up
```

Eso es todo. Docker levanta PostgreSQL, corre las migraciones y seeds automáticamente, e inicia el backend y el frontend con hot reload.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

> La primera vez tarda un poco más porque Docker construye las imágenes.

---

## MercadoPago — configuración de pagos

Si no configurás las credenciales de MP, el botón "Pagar con MercadoPago" devuelve un error 503. Los métodos "Pagar en efectivo" y "Pagar con tarjeta" funcionan sin credenciales.

### 1. Credenciales de sandbox

1. Entrá a [mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
2. Creá o seleccioná tu app
3. Copiá el **Access Token** (`TEST-...`) y el **Public Key** (`TEST-...`) de "Credenciales de prueba"
4. Pegálos en el `.env` de la raíz:

```env
MP_ACCESS_TOKEN=TEST-tu-access-token
MP_PUBLIC_KEY=TEST-tu-public-key
VITE_MP_PUBLIC_KEY=TEST-tu-public-key
```

5. Reiniciá el backend para que tome los cambios:

```bash
docker compose up -d --force-recreate backend
```

### 2. ngrok — webhooks y redirección automática

ngrok expone el backend para que MP pueda notificar el resultado del pago. Es opcional para desarrollo básico, necesario si querés que los pedidos se confirmen automáticamente tras el pago.

**Configurar el authtoken:**

1. Creá cuenta gratuita en [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Agregá tu token al `.env` de la raíz:

```env
NGROK_AUTHTOKEN=tu-token
```

**Levantar ngrok** (perfil opcional — no arranca con el `docker compose up` normal):

```bash
docker compose --profile ngrok up -d ngrok
```

**Obtener la URL pública:**

```bash
curl http://localhost:4040/api/tunnels
# buscá "public_url", e.g. https://xxxx.ngrok-free.app
```

**Actualizar el `.env` con la URL de ngrok:**

```env
BASE_URL=https://xxxx.ngrok-free.app
MP_NOTIFICATION_URL=https://xxxx.ngrok-free.app/api/v1/payments/webhook
```

**Reiniciá el backend** para que tome los cambios:

```bash
docker compose up -d --force-recreate backend
```

> La URL de ngrok cambia en cada reinicio del contenedor. Repetí el paso de obtener la URL y actualizar el `.env` en cada sesión.

---

## Reset completo de la base de datos

Si necesitás partir desde cero (credenciales cambiadas, schema roto, etc.):

```bash
docker compose down -v
docker compose up
```

> `-v` elimina los volúmenes. Se pierden todos los datos pero las migrations y seeds se vuelven a correr solas.

---

## Estructura del proyecto

```
food_store_gestion/
├── .env                        # Variables de entorno (no commitear) ← raíz
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
│   ├── database/seeds.py       # Datos iniciales
│   └── requirements.txt
│
├── frontend/                   # App React
│   ├── src/
│   │   ├── api/                # Clientes HTTP por dominio
│   │   ├── components/         # Componentes reutilizables
│   │   ├── pages/              # Páginas de la app
│   │   ├── store/              # Estado global (Zustand)
│   │   ├── hooks/              # Custom hooks
│   │   └── App.tsx             # Rutas y layout
│   └── src/lib/utils.ts
│
├── docker/
│   └── init-db.sql             # Inicialización de PostgreSQL
├── docker-compose.yml
├── package.json                # Workspace raíz
└── README.md
```

---

## Scripts útiles

```bash
# Levantar todo
docker compose up

# Levantar en segundo plano
docker compose up -d

# Ver logs del backend
docker compose logs -f backend

# Reiniciar backend (para tomar cambios del .env)
docker compose up -d --force-recreate backend

# Crear nueva migración
docker compose exec backend alembic revision --autogenerate -m "descripcion"

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
