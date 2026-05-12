## Why

El diagnóstico del TPI reveló que los 16 changes ya completados acumulan **~74–89/200 puntos**, con 3 brechas críticas que por sí solas representan 40 puntos perdidos: el módulo de pagos usa Stripe en lugar de MercadoPago (exigido explícitamente), no existe la capa Unit of Work + BaseRepository en ningún servicio, y el estado del cliente usa React Context en vez de 4 stores Zustand tipados. Sin corregir estas brechas, el proyecto no alcanza el umbral mínimo de aprobación.

## What Changes

- **BREAKING** — Reemplazar toda la integración Stripe por MercadoPago (SDK `mercadopago 2.3.0+`), incluyendo tabla `pagos` con `mp_payment_id`, `idempotency_key` UUID, `external_reference`, webhook IPN en `/api/v1/pagos/webhook`
- **BREAKING** — Introducir `core/uow.py` con `UnitOfWork` y `BaseRepository[T]` genérico; refactorizar TODOS los services para recibir `uow` en lugar de `db: AsyncSession` y eliminar cualquier `db.commit()` directo
- **BREAKING** — Migrar autenticación frontend de React Context + localStorage a `authStore` Zustand con `persist`; crear `cartStore`, `paymentStore` y `uiStore`
- Agregar tablas faltantes del ERD v5: `refresh_tokens`, `ingredientes`, `producto_ingredientes`, `formas_pago`, `estados_pedido` (catálogo), `historial_estados_pedido` (append-only), `pagos`
- Migrar todos los hooks de datos (`useProducts`, `useOrders`, `useCart`, `useAuth`, etc.) a TanStack Query (`useQuery` / `useMutation`)
- Cambiar prefijo de rutas de `/api` a `/api/v1` en todos los routers del backend
- Implementar JWT refresh token con rotación (access 30 min / refresh 7 días) usando tabla `refresh_tokens`
- Implementar FSM completa de pedidos como función de transición validada en `order_service`, con registro en tabla `historial_estados_pedido`
- Agregar soft delete (`deleted_at`) en Producto, Categoria y Usuario
- Agregar `nombre_snapshot` y `precio_snapshot` en `DetallePedido`
- Implementar rate limiting en login con `slowapi` (5 intentos / 15 min por IP)
- Agregar screenshots de 10 pantallas en `docs/screenshots/` y enlace a video demo en README (CE-12, CE-13)

## Capabilities

### New Capabilities

- `unit-of-work`: Patrón UoW + BaseRepository genérico como núcleo de acceso a datos del backend
- `mercadopago-integration`: Reemplazo completo de Stripe por MercadoPago Checkout API con IPN webhook
- `zustand-stores`: Los 4 stores del cliente (auth, cart, payment, ui) con persist y tipado estricto
- `tanstack-query-migration`: Migración de todos los hooks de fetching a TanStack Query
- `jwt-refresh-rotation`: Refresh token persistido en BD con rotación automática
- `erv5-schema-migration`: Migraciones Alembic para todas las tablas faltantes del ERD v5
- `order-fsm-historial`: FSM de pedidos con validación y tabla append-only de historial

### Modified Capabilities

- `payment-gateway`: Cambio de proveedor (Stripe → MercadoPago) y estructura de tabla Pago
- `user-auth`: Extensión con refresh token y rate limiting en login
- `checkout-and-orders`: Extensión con FSM completa, historial, snapshot de precio y forma de pago
- `auth-frontend`: Reemplazo de Context por Zustand authStore

## Impacto

**Backend afectado:**
- `backend/app/services/*.py` — todos refactorizados para usar UoW
- `backend/app/models/order.py` — campos Stripe eliminados, campos MP añadidos
- `backend/app/services/payment_service.py` — reescritura completa
- `backend/app/routes/payments.py` — endpoint webhook cambiado a IPN de MP
- `backend/alembic/versions/` — nuevas migraciones para ERD v5
- `backend/requirements.txt` — stripe eliminado, mercadopago añadido
- `backend/app/main.py` — prefijos de routers actualizados a /api/v1

**Frontend afectado:**
- `frontend/src/context/AuthContext.tsx` — eliminado (reemplazado por authStore)
- `frontend/src/store/` — nuevo directorio con 4 stores Zustand
- `frontend/src/hooks/*.ts` — todos migrados a useQuery/useMutation
- `frontend/package.json` — zustand y @tanstack/react-query añadidos

**Dependencias:**
- `stripe` eliminado de requirements.txt
- `mercadopago>=2.3.0` añadido
- `slowapi` añadido (rate limiting)
- `zustand` añadido a frontend
- `@tanstack/react-query` añadido a frontend (si no está ya)

## Cumplimiento TPI

| Criterio Rúbrica | Puntos | Este change lo resuelve |
|---|---|---|
| Backend — UoW + BaseRepository | 15 pts | ✅ `unit-of-work` capability |
| Backend — MercadoPago | 15 pts | ✅ `mercadopago-integration` capability |
| Backend — Modelo de datos ERD v5 | 15 pts | ✅ `erv5-schema-migration` capability |
| Backend — Capa de servicio (FSM) | +5 pts | ✅ `order-fsm-historial` capability |
| Frontend — Zustand 4 stores | 10 pts | ✅ `zustand-stores` capability |
| Frontend — TanStack Query | 15 pts | ✅ `tanstack-query-migration` capability |
| CE-09 — MP sandbox funcional | CE | ✅ `mercadopago-integration` |
| CE-10 — Sin db.commit() directo | CE | ✅ `unit-of-work` |
| CE-11 — 4 stores Zustand con persist | CE | ✅ `zustand-stores` |
| CE-12 — Screenshots | CE | ✅ task directa |
| CE-13 — Video demo en README | CE | ✅ task directa |
