# Design: migracion-hacia-aprobacion

## Resumen

Este change corrige 3 brechas arquitectónicas críticas (MercadoPago, UoW/Repository, Zustand), completa el ERD v5, migra hooks a TanStack Query, y cubre los items del checklist de entrega CE-09 a CE-13. El orden de implementación es bottom-up: infraestructura BD → backend core → servicios → frontend.

---

## Bloque 1: ERD v5 — Tablas Faltantes

### Migraciones Alembic (en orden de dependencias)

**Migración 1 — Tablas independientes:**
```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  device_info VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

CREATE TABLE ingredientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  es_alergeno BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE formas_pago (
  codigo VARCHAR(30) PRIMARY KEY,  -- 'MP_CREDIT', 'MP_DEBIT', 'MP_PIX', etc.
  nombre VARCHAR(100) NOT NULL,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE estados_pedido (
  codigo VARCHAR(30) PRIMARY KEY,  -- 'PENDIENTE', 'PAGO_PENDIENTE', 'PAGADO', etc.
  descripcion TEXT,
  es_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Migración 2 — Tablas con FK a productos/pedidos:**
```sql
CREATE TABLE producto_ingredientes (
  producto_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingrediente_id INTEGER NOT NULL REFERENCES ingredientes(id),
  PRIMARY KEY (producto_id, ingrediente_id)
);

CREATE TABLE historial_estados_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  estado_desde VARCHAR(30) REFERENCES estados_pedido(codigo),  -- NULL = creación
  estado_hasta VARCHAR(30) NOT NULL REFERENCES estados_pedido(codigo),
  usuario_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- SIN updated_at — tabla append-only
);
CREATE INDEX idx_historial_pedido_id ON historial_estados_pedido(pedido_id);

CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES orders(id),
  mp_payment_id VARCHAR(100) UNIQUE,
  mp_status VARCHAR(50),           -- approved, rejected, pending, etc.
  mp_status_detail VARCHAR(100),
  external_reference UUID NOT NULL DEFAULT gen_random_uuid(),
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  monto NUMERIC(12, 2) NOT NULL,
  forma_pago_codigo VARCHAR(30) REFERENCES formas_pago(codigo),
  mp_raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pagos_pedido_id ON pagos(pedido_id);
CREATE INDEX idx_pagos_mp_payment_id ON pagos(mp_payment_id);
```

**Migración 3 — Soft delete + snapshots:**
```sql
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMPTZ;  -- si no existe
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN nombre_snapshot VARCHAR(255);
ALTER TABLE order_items ADD COLUMN precio_snapshot NUMERIC(12, 2);
```

**Seed de estados_pedido y formas_pago:**
```python
# Seed en database/seeds.py
estados = [
  ("PENDIENTE", "Pedido creado, esperando pago", False),
  ("PAGO_PENDIENTE", "Esperando confirmación de pago", False),
  ("PAGADO", "Pago confirmado", False),
  ("CONFIRMADO", "Confirmado por el local", False),
  ("PREPARANDO", "En preparación", False),
  ("LISTO", "Listo para entrega", False),
  ("ENTREGADO", "Entregado al cliente", True),
  ("CANCELADO", "Cancelado", True),
]
formas = [
  ("MP_CREDIT", "Tarjeta de crédito vía MercadoPago", True),
  ("MP_DEBIT", "Tarjeta de débito vía MercadoPago", True),
]
```

---

## Bloque 2: Unit of Work + BaseRepository

### `backend/app/core/repository.py`
```python
from typing import Generic, TypeVar, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: int) -> T | None:
        return await self.session.get(self.model, id)

    async def get_all(self) -> list[T]:
        result = await self.session.execute(select(self.model))
        return list(result.scalars().all())

    async def add(self, entity: T) -> T:
        self.session.add(entity)
        return entity

    async def delete(self, entity: T) -> None:
        await self.session.delete(entity)
```

### `backend/app/core/uow.py`
```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.models.order import Order
from app.models.product import Product
# ... imports de cada modelo

class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.orders = BaseRepository(Order, session)
        self.products = BaseRepository(Product, session)
        # ... un repo por modelo

    async def commit(self):
        await self._session.commit()

    async def rollback(self):
        await self._session.rollback()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, *_):
        if exc_type:
            await self.rollback()
        else:
            await self.commit()
```

### Inyección en routes (patrón)
```python
# backend/app/dependencies.py
async def get_uow(session: AsyncSession = Depends(get_db)) -> UnitOfWork:
    async with UnitOfWork(session) as uow:
        yield uow

# En el router:
@router.post("/orders")
async def create_order(body: OrderCreate, uow: UnitOfWork = Depends(get_uow)):
    return await order_service.create(body, uow)
```

### Regla de oro de la refactorización
Buscar `await db.commit()` en todos los services y reemplazar por operaciones en el UoW. El commit lo hace el UoW al salir del contexto (`__aexit__`).

---

## Bloque 3: MercadoPago (reemplazo de Stripe)

### Eliminaciones
- `stripe` de `requirements.txt`
- `stripe_payment_intent_id`, `stripe_customer_id` de modelos Order y User (migración de limpieza)
- `backend/app/services/payment_service.py` — reescritura completa

### `payment_service.py` nuevo (esqueleto)
```python
import mercadopago
import uuid
from app.core.uow import UnitOfWork
from app.models.payment import Pago

sdk = mercadopago.SDK(settings.mp_access_token)

async def create_preference(order, uow: UnitOfWork) -> dict:
    idempotency_key = str(uuid.uuid4())
    external_reference = str(uuid.uuid4())
    preference_data = {
        "items": [{"title": f"Pedido #{order.id}", "quantity": 1,
                   "unit_price": float(order.total_amount)}],
        "external_reference": external_reference,
        "notification_url": f"{settings.base_url}/api/v1/pagos/webhook",
        "back_urls": {...},
    }
    response = sdk.preference().create(preference_data,
                                       {"X-Idempotency-Key": idempotency_key})
    # Guardar en tabla pagos
    pago = Pago(pedido_id=order.id, idempotency_key=idempotency_key,
                external_reference=external_reference, monto=order.total_amount)
    await uow.pagos.add(pago)
    return {"preference_id": response["response"]["id"],
            "init_point": response["response"]["init_point"]}

async def handle_ipn(payment_id: str, uow: UnitOfWork) -> None:
    payment_info = sdk.payment().get(payment_id)
    data = payment_info["response"]
    external_reference = data["external_reference"]
    # Actualizar tabla pagos + FSM pedido
    ...
```

### Endpoint webhook IPN
```python
# routes/payments.py
@router.post("/api/v1/pagos/webhook")  # sin auth
async def ipn_webhook(request: Request, uow=Depends(get_uow)):
    body = await request.json()
    if body.get("type") == "payment":
        await payment_service.handle_ipn(body["data"]["id"], uow)
    return {"status": "ok"}
```

### Variables de entorno nuevas
```
MP_ACCESS_TOKEN=TEST-...       # sandbox
MP_PUBLIC_KEY=TEST-...
MP_WEBHOOK_SECRET=             # opcional para validar firma
BASE_URL=http://localhost:8000
```

---

## Bloque 4: JWT Refresh Token

### Flujo
1. Login → genera access (30 min) + refresh (7 días), guarda hash del refresh en `refresh_tokens`
2. `POST /api/v1/auth/refresh` → verifica hash, genera nuevos access+refresh, revoca el anterior (rotación)
3. Logout → revoca el refresh token (sets `revoked_at`)

### Tabla usada
`refresh_tokens` (ya definida en Bloque 1)

### Rate limiting (slowapi)
```python
# backend/app/main.py
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# routes/auth.py
@router.post("/login")
@limiter.limit("5/15minute")
async def login(request: Request, ...):
    ...
```

---

## Bloque 5: FSM de Pedidos con Historial

### Mapa de transiciones válidas
```python
FSM_TRANSITIONS = {
    "PENDIENTE": ["PAGO_PENDIENTE", "CANCELADO"],
    "PAGO_PENDIENTE": ["PAGADO", "PAGO_FALLIDO", "CANCELADO"],
    "PAGADO": ["CONFIRMADO"],         # Solo via webhook IPN
    "CONFIRMADO": ["PREPARANDO", "CANCELADO"],
    "PREPARANDO": ["LISTO"],
    "LISTO": ["ENTREGADO"],
    "ENTREGADO": [],                  # estado terminal
    "CANCELADO": [],                  # estado terminal
}
```

### Función en `order_service.py`
```python
async def transition(order, nuevo_estado: str, usuario_id: int, uow: UnitOfWork, motivo: str = None):
    validos = FSM_TRANSITIONS.get(order.estado_codigo, [])
    if nuevo_estado not in validos:
        raise HTTPException(422, f"Transición inválida: {order.estado_codigo} → {nuevo_estado}")
    historial = HistorialEstadoPedido(
        pedido_id=order.id, estado_desde=order.estado_codigo,
        estado_hasta=nuevo_estado, usuario_id=usuario_id, motivo=motivo
    )
    await uow.historial.add(historial)
    order.estado_codigo = nuevo_estado
    await uow.orders.add(order)
```

---

## Bloque 6: Frontend — Zustand Stores + TanStack Query

### Dependencias a instalar
```bash
npm install zustand @tanstack/react-query --workspace frontend
```

### Estructura de stores
```
frontend/src/store/
  authStore.ts       # isAuthenticated, user, accessToken + persist
  cartStore.ts       # items[], total + persist (localStorage)
  paymentStore.ts    # preferenceId, status, paymentMethod
  uiStore.ts         # sidebar open/close, notifications, modals
```

### `authStore.ts` (patrón)
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
)
```

### Migración de hooks (patrón)
```typescript
// ANTES (malo)
export function useProducts() {
  const [products, setProducts] = useState([])
  useEffect(() => { fetch('/api/products').then(...) }, [])
  return { products }
}

// DESPUÉS (correcto — TanStack Query)
import { useQuery, useMutation } from '@tanstack/react-query'
export function useProducts(filters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getAll(filters),
    staleTime: 1000 * 60 * 5,  // 5 min
  })
}
```

### QueryClientProvider en main.tsx
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

---

## Prefijo de Rutas `/api/v1`

Cambio en `backend/app/main.py`: todos los `app.include_router(router, prefix="/api")` pasan a `prefix="/api/v1"`. El único que ya tiene `/api/v1` es search — no tocarlo.

Actualizar `frontend/src/api/*.ts` y `.env` con la nueva base URL: `VITE_API_URL=http://localhost:8000/api/v1`.

---

## Checklist de Entrega Pendiente

- **CE-12**: Tomar screenshots de 10 pantallas y guardar en `docs/screenshots/`
- **CE-13**: Grabar video demo de ≥3 min mostrando el flujo completo y agregar enlace en README

---

## Orden de Implementación Recomendado

1. Migraciones ERD v5 (sin tocar servicios aún)
2. `core/repository.py` + `core/uow.py`
3. Refactorizar services para usar UoW (sin tocar rutas aún)
4. Actualizar rutas a `/api/v1`
5. Reemplazar payment_service (Stripe → MP)
6. JWT refresh token + rate limiting
7. FSM + historial en order_service
8. Frontend: instalar deps, crear stores Zustand
9. Frontend: migrar hooks a TanStack Query
10. Frontend: reemplazar checkout con MercadoPago Brick/SDK
11. Screenshots + video demo
