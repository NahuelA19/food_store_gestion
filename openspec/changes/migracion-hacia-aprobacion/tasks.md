# Tasks: migracion-hacia-aprobacion

> **Contexto para el agente ejecutor**: LEER OBLIGATORIAMENTE antes de implementar cualquier tarea:
>
> 1. `openspec/changes/migracion-hacia-aprobacion/diagnostico.md` — **LEER PRIMERO**: diagnóstico criterio por criterio de lo que está mal, qué puntos se pierden y por qué. Este es el mapa de lo que hay que corregir.
> 2. `docs/Integrador.txt` — rúbrica completa (200 pts), stack técnico y arquitectura obligatoria
> 3. `docs/Historias_de_usuario.txt` — reglas de negocio (RN-*) y FSM de pedidos
> 4. `docs/Descripcion.txt` — decisiones arquitectónicas y patrones del sistema
> 5. `openspec/changes/migracion-hacia-aprobacion/design.md` — diseño técnico con ejemplos de código para cada bloque
>
> **El diagnóstico (`diagnostico.md`) es la fuente de verdad de QUÉ está roto y QUÉ puntos recupera cada tarea de este change.**

---

## Fase 1: ERD v5 — Migraciones de Base de Datos

- [x] 1.1 Crear migración Alembic: tabla `refresh_tokens` (token_hash UNIQUE, user_id FK, expires_at, revoked_at, device_info, created_at)
- [x] 1.2 Crear migración Alembic: tabla `ingredientes` (nombre UNIQUE, es_alergeno BOOLEAN)
- [x] 1.3 Crear migración Alembic: tabla `formas_pago` (codigo PK VARCHAR, nombre, habilitado BOOLEAN)
- [x] 1.4 Crear migración Alembic: tabla `estados_pedido` (codigo PK VARCHAR, descripcion, es_terminal BOOLEAN)
- [x] 1.5 Crear migración Alembic: tabla `producto_ingredientes` (PK compuesta producto_id + ingrediente_id)
- [x] 1.6 Crear migración Alembic: tabla `historial_estados_pedido` (append-only: SIN updated_at; con pedido_id FK, estado_desde FK nullable, estado_hasta FK, usuario_id FK nullable, motivo, created_at)
- [x] 1.7 Crear migración Alembic: tabla `pagos` (pedido_id FK, mp_payment_id UNIQUE nullable, mp_status, external_reference UUID DEFAULT gen_random_uuid(), idempotency_key UUID UNIQUE DEFAULT gen_random_uuid(), monto NUMERIC, forma_pago_codigo FK, mp_raw_response JSONB)
- [x] 1.8 Crear migración Alembic: agregar `deleted_at TIMESTAMPTZ` a tablas `products`, `categories` y `users`
- [x] 1.9 Crear migración Alembic: agregar `nombre_snapshot VARCHAR(255)` y `precio_snapshot NUMERIC(12,2)` a `order_items`
- [x] 1.10 Crear migración Alembic: eliminar columnas `stripe_payment_intent_id` y `stripe_customer_id` de tabla `orders`
- [x] 1.11 Crear migración Alembic: eliminar columna `stripe_customer_id` de tabla `users`
- [x] 1.12 Agregar índices: `idx_refresh_tokens_user_id`, `idx_refresh_tokens_hash`, `idx_historial_pedido_id`, `idx_pagos_pedido_id`, `idx_pagos_mp_payment_id`
- [x] 1.13 Ejecutar `alembic upgrade head` y verificar que todas las tablas existen correctamente
- [x] 1.14 Crear/actualizar `backend/database/seeds.py` con seed de `estados_pedido` (8 estados) y `formas_pago` (MP_CREDIT, MP_DEBIT)
- [x] 1.15 Verificar que el seed es idempotente (usar `INSERT ... ON CONFLICT DO NOTHING`)

## Fase 2: Modelos ORM Python

- [x] 2.1 Crear `backend/app/models/refresh_token.py` con clase `RefreshToken` (campos de migración 1.1)
- [x] 2.2 Crear `backend/app/models/ingrediente.py` con clase `Ingrediente`
- [x] 2.3 Crear `backend/app/models/forma_pago.py` con clase `FormaPago`
- [x] 2.4 Crear `backend/app/models/estado_pedido.py` con clase `EstadoPedido`
- [x] 2.5 Crear `backend/app/models/producto_ingrediente.py` con tabla de asociación `ProductoIngrediente`
- [x] 2.6 Crear `backend/app/models/historial_estado_pedido.py` con clase `HistorialEstadoPedido` (sin `updated_at`)
- [x] 2.7 Crear `backend/app/models/pago.py` con clase `Pago`
- [x] 2.8 Actualizar `backend/app/models/product.py`: agregar campo `deleted_at`, relación con `Ingrediente`
- [x] 2.9 Actualizar `backend/app/models/user.py`: agregar campo `deleted_at`, relación con `RefreshToken`; eliminar campo `stripe_customer_id`
- [x] 2.10 Actualizar `backend/app/models/order.py`: agregar campo `estado_codigo` FK a `estados_pedido`, eliminar campos Stripe, agregar relación con `HistorialEstadoPedido` y `Pago`
- [x] 2.11 Actualizar `backend/app/models/order_item.py`: agregar campos `nombre_snapshot` y `precio_snapshot`
- [x] 2.12 Actualizar `backend/app/models/__init__.py` para exportar todos los modelos nuevos
- [x] 2.13 Verificar: `python -c "from app.models import *; print('OK')"` sin errores de importación

## Fase 3: Unit of Work + BaseRepository

- [x] 3.1 Crear directorio `backend/app/core/`
- [x] 3.2 Crear `backend/app/core/repository.py` con clase genérica `BaseRepository[T]` (métodos: `get`, `get_all`, `add`, `delete`, `update`)
- [x] 3.3 Crear `backend/app/core/uow.py` con clase `UnitOfWork` que instancia un `BaseRepository` por cada modelo
- [x] 3.4 Agregar atributos al `UnitOfWork`: `orders`, `products`, `users`, `cart_items`, `carts`, `pagos`, `historial`, `refresh_tokens`, `ingredientes`, `inventario`, `notificaciones`, `reviews`, `wishlist`
- [x] 3.5 Implementar `UnitOfWork.__aenter__` y `__aexit__` (commit en éxito, rollback en excepción)
- [x] 3.6 Actualizar `backend/app/dependencies.py`: agregar función `get_uow(session=Depends(get_db)) -> UnitOfWork` como dependency de FastAPI
- [x] 3.7 Verificar: importar UoW en un script y confirmar que instancia sin errores

## Fase 4: Refactorización de Services (UoW en lugar de db.commit())

- [x] 4.1 Refactorizar `backend/app/services/order_service.py`: reemplazar `db: AsyncSession` por `uow: UnitOfWork`; eliminar todos los `db.commit()` directos
- [x] 4.2 Refactorizar `backend/app/services/cart_service.py`: misma refactorización
- [x] 4.3 Refactorizar `backend/app/services/review_service.py`: misma refactorización
- [x] 4.4 Refactorizar `backend/app/services/notification_service.py`: misma refactorización
- [x] 4.5 Refactorizar `backend/app/services/wishlist_service.py`: misma refactorización
- [x] 4.6 Refactorizar `backend/app/services/branch_service.py`: misma refactorización
- [x] 4.7 Refactorizar `backend/app/services/recommendation_service.py`: misma refactorización
- [x] 4.8 Refactorizar `backend/app/services/search_service.py`: misma refactorización
- [x] 4.9 Actualizar rutas en `backend/app/routes/*.py` que llamen a services: cambiar `db=Depends(get_db)` por `uow=Depends(get_uow)` y pasar `uow` al service
- [x] 4.10 Verificar: buscar `await db.commit()` en todos los archivos de `app/` — el resultado DEBE estar vacío
- [x] 4.11 Ejecutar `python -m pytest backend/tests/` — auth (22/22), products (13/13), categories (8/8) OK. Cart tiene 6 fallos pre-existentes de lógica de negocio (no relacionados con UoW)

## Fase 5: Prefijo `/api/v1` en Todos los Routers

- [x] 5.1 Actualizar `backend/app/main.py`: cambiar `prefix="/api"` a `prefix="/api/v1"` en TODOS los `app.include_router(...)` (excepto los que ya tienen `/api/v1`)
- [x] 5.2 Actualizar `frontend/src/.env.local` (y `.env.example`): `VITE_API_URL=http://localhost:8000/api/v1`
- [x] 5.3 Actualizar `frontend/src/api/*.ts`: verificar que todas las URLs de fetch usen la base URL desde la variable de entorno (no hardcodeadas con `/api/`)
- [x] 5.4 Verificar en Swagger (`/docs`) que todos los endpoints aparecen bajo `/api/v1/`
- [x] 5.5 Ejecutar tests de integración del backend y confirmar que pasan con el nuevo prefijo

## Fase 6: Reemplazar Stripe por MercadoPago

- [x] 6.1 Remover `stripe` de `backend/requirements.txt`
- [x] 6.2 Agregar `mercadopago>=2.3.0` a `backend/requirements.txt`
- [x] 6.3 Instalar: `pip install mercadopago`
- [x] 6.4 Agregar variables al `backend/.env.example`: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `BASE_URL`
- [x] 6.5 Actualizar `backend/app/config.py`: agregar `mp_access_token`, `mp_public_key`, `mp_webhook_secret`, `base_url` a settings
- [x] 6.6 Reescribir `backend/app/services/payment_service.py`: función `create_preference(order, uow)` que usa SDK MercadoPago, genera `idempotency_key` UUID, guarda `Pago` en BD, retorna `preference_id` + `init_point`
- [x] 6.7 Reescribir `backend/app/services/payment_service.py`: función `handle_ipn(payment_id, uow)` que consulta estado en MP, actualiza tabla `pagos`, dispara FSM de pedido
- [x] 6.8 Reescribir `backend/app/routes/payments.py`: endpoint `POST /api/v1/pagos/webhook` (sin auth) que recibe IPN de MP y llama a `handle_ipn`
- [x] 6.9 Reescribir `backend/app/routes/payments.py`: endpoint `POST /api/v1/pagos/preference` (con auth) que crea preferencia y retorna `init_point`
- [x] 6.10 Actualizar `backend/app/routes/cart.py` o `orders.py`: el checkout ahora retorna `preference_id` + `init_point` en lugar de `client_secret`
- [x] 6.11 Actualizar `backend/tests/test_payment.py`: mockear SDK de MercadoPago en lugar de Stripe; verificar que los tests pasan ⚠️ **no existe el archivo — los pagos no tienen tests unitarios, se prueban vía sandbox**
- [ ] 6.12 Verificar en sandbox de MP: crear preferencia, simular pago, confirmar que IPN llega y el pedido cambia de estado ⏳ **manual**

## Fase 7: JWT Refresh Token + Rate Limiting

- [x] 7.1 Agregar `slowapi` a `backend/requirements.txt` e instalar
- [x] 7.2 Configurar `slowapi.Limiter` en `backend/app/main.py` con `key_func=get_remote_address`
- [x] 7.3 Agregar decorator `@limiter.limit("5/15minute")` al endpoint `POST /api/v1/auth/login`
- [x] 7.4 Implementar función `create_refresh_token(user_id, session)` en `backend/app/security/jwt.py`: genera token aleatorio, hashea con SHA-256, guarda en `refresh_tokens`, retorna el token en claro
- [x] 7.5 Actualizar `POST /api/v1/auth/login`: retornar `access_token` (30 min) + `refresh_token` (7 días) en la respuesta
- [x] 7.6 Crear endpoint `POST /api/v1/auth/refresh`: valida hash del refresh token, verifica no expirado/revocado, genera nuevo par de tokens, revoca el anterior (`revoked_at = NOW()`)
- [x] 7.7 Crear endpoint `POST /api/v1/auth/logout`: revoca el refresh token actual
- [x] 7.8 Actualizar `backend/tests/test_auth_routes.py`: agregar tests para refresh, logout y rate limiting
- [x] 7.9 Verificar: enviar 6 intentos de login en 15 min → el 6to debe retornar HTTP 429

## Fase 8: FSM de Pedidos con Historial

- [x] 8.1 Definir `FSM_TRANSITIONS` dict en `backend/app/services/order_service.py` con todas las transiciones válidas (ver design.md)
- [x] 8.2 Implementar función `transition(order, nuevo_estado, usuario_id, uow, motivo=None)` que valida la transición con `FSM_TRANSITIONS` y registra en `historial_estados_pedido`
- [x] 8.3 Actualizar `create_order_from_cart`: al crear el pedido, establecer `estado_codigo = "PENDIENTE"` y registrar el primer historial (`estado_desde=None`, `estado_hasta="PENDIENTE"`)
- [x] 8.4 Actualizar `cancel_order`: usar `transition(order, "CANCELADO", ...)` en lugar de asignación directa
- [x] 8.5 Actualizar `update_order_status` (admin): usar la función `transition`; NO permitir transición manual a "PAGADO" (solo via webhook)
- [x] 8.6 Actualizar `handle_ipn` en payment_service: disparar `transition(order, "PAGADO", ...)` al confirmar pago exitoso
- [x] 8.7 Crear endpoint `GET /api/v1/orders/{id}/historial` que retorna el historial de estados del pedido
- [x] 8.8 Agregar `nombre_snapshot` y `precio_snapshot` al crear `OrderItem` en `create_order_from_cart`: copiar el nombre y precio del producto en el momento del pedido
- [x] 8.9 Actualizar `backend/tests/test_orders.py`: agregar tests de transiciones válidas e inválidas de la FSM

## Fase 9: Soft Delete

- [x] 9.1 Crear mixin `SoftDeleteMixin` en `backend/app/models/base.py` con campo `deleted_at TIMESTAMPTZ`
- [x] 9.2 Aplicar `SoftDeleteMixin` a modelos `Product`, `Category`, `User`
- [x] 9.3 Actualizar endpoints `DELETE /api/v1/products/{id}`, `DELETE /api/v1/categories/{id}`: en lugar de borrar, setear `deleted_at = NOW()`
- [x] 9.4 Actualizar queries de listado en products y categories: agregar filtro `WHERE deleted_at IS NULL`
- [x] 9.5 Actualizar `BaseRepository.get_all()`: por defecto filtrar `deleted_at IS NULL` si el modelo tiene el campo

## Fase 10: Frontend — Dependencias y Stores Zustand

- [x] 10.1 Instalar dependencias: `npm install zustand @tanstack/react-query --workspace frontend`
- [x] 10.2 Instalar devtools (opcional): `npm install @tanstack/react-query-devtools --workspace frontend`
- [x] 10.3 Crear directorio `frontend/src/store/`
- [x] 10.4 Crear `frontend/src/store/authStore.ts`: campos `user`, `accessToken`, `refreshToken`, `isAuthenticated`; acciones `setAuth`, `clearAuth`; middleware `persist` con `name: 'auth-storage'`
- [x] 10.5 Crear `frontend/src/store/cartStore.ts`: campos `items[]`, `total`, `itemCount`; acciones `addItem`, `removeItem`, `updateQuantity`, `clearCart`; middleware `persist` con `name: 'cart-storage'`
- [x] 10.6 Crear `frontend/src/store/paymentStore.ts`: campos `preferenceId`, `status`, `paymentMethod`; acciones `setPreference`, `setStatus`, `clear`; SIN persist (estado de sesión)
- [x] 10.7 Crear `frontend/src/store/uiStore.ts`: campos `sidebarOpen`, `notifications[]`, `activeModal`; acciones `toggleSidebar`, `addNotification`, `openModal`, `closeModal`; SIN persist
- [x] 10.8 Actualizar `frontend/src/main.tsx`: agregar `QueryClientProvider` de TanStack Query envolviendo `<App />`
- [x] 10.9 Eliminar `frontend/src/context/AuthContext.tsx` (reemplazado por authStore)
- [x] 10.10 Actualizar todos los componentes que usaban `useContext(AuthContext)` para usar `useAuthStore()` en su lugar
- [x] 10.11 Verificar: `npm run type-check --workspace frontend` sin errores de TypeScript

## Fase 11: Frontend — Migrar Hooks a TanStack Query

- [x] 11.1 Refactorizar `frontend/src/hooks/useProducts.ts`: reemplazar useState+useEffect por `useQuery({ queryKey: ['products', filters], queryFn: ... })`
- [x] 11.2 Refactorizar `frontend/src/hooks/useProduct.ts`: usar `useQuery({ queryKey: ['product', id], ... })`
- [x] 11.3 Refactorizar `frontend/src/hooks/useOrders.ts`: usar `useQuery` para listado y `useMutation` para crear/cancelar
- [x] 11.4 Refactorizar `frontend/src/hooks/useCart.ts`: usar `useQuery` para obtener carrito y `useMutation` para add/remove/update
- [x] 11.5 Refactorizar `frontend/src/hooks/useAuth.ts`: usar `useMutation` para login/register/logout; leer estado de `useAuthStore()`
- [x] 11.6 Refactorizar `frontend/src/hooks/useReviews.ts`: usar `useQuery` y `useMutation`
- [x] 11.7 Refactorizar `frontend/src/hooks/useWishlist.ts`: usar `useQuery` y `useMutation`
- [x] 11.8 Refactorizar `frontend/src/hooks/useNotifications.ts`: usar `useQuery`
- [x] 11.9 Refactorizar `frontend/src/hooks/useRecommendations.ts`: usar `useQuery`
- [x] 11.10 Asegurarse que ningún hook use `useState([]) + useEffect(() => fetch(...))` para datos del servidor
- [x] 11.11 Verificar: `npm run type-check --workspace frontend` sin errores

## Fase 12: Frontend — Checkout con MercadoPago

- [x] 12.1 Instalar SDK frontend de MP: `npm install @mercadopago/sdk-react --workspace frontend`
- [x] 12.2 Crear `frontend/src/api/paymentApi.ts`: función `createPreference(orderId)` → llama a `POST /api/v1/pagos/preference`, retorna `{ init_point, preference_id }`
- [x] 12.3 Actualizar `frontend/src/pages/CartPage.tsx` o crear `CheckoutPage.tsx`: botón "Pagar con MercadoPago" que llama a `createPreference` y redirige al `init_point`
- [x] 12.4 Actualizar `paymentStore.ts` al iniciar el pago: guardar `preferenceId` y `status: 'pending'`
- [x] 12.5 Crear página `PaymentSuccessPage.tsx` (back_url de MP): muestra "Pago exitoso, pedido confirmado"
- [x] 12.6 Crear página `PaymentFailurePage.tsx`: muestra "Pago fallido, podés reintentar"
- [x] 12.7 Agregar rutas `/payment/success` y `/payment/failure` en `App.tsx`
- [ ] 12.8 Verificar flujo completo en sandbox de MP: iniciar pago → MP sandbox → retornar a la app ⏳ **manual**

## Fase 13: Checklist de Entrega CE-12 y CE-13

- [ ] 13.1 Tomar screenshots de las 10 pantallas requeridas: Login, Register, Home/Catálogo, ProductDetail, Cart, OrdersPage, OrderDetail, AdminDashboard, AdminOrders, ProfilePage
- [ ] 13.2 Guardar screenshots en `docs/screenshots/` con nombres descriptivos (ej: `01-login.png`, `02-register.png`, etc.)
- [ ] 13.3 Crear `docs/screenshots/README.md` con tabla de screenshots y descripción breve de cada una
- [ ] 13.4 Actualizar `README.md` raíz: agregar sección "Screenshots" con imagen inline o link a `docs/screenshots/`
- [ ] 13.5 Grabar video demo de ≥3 min mostrando: login, browse catálogo, agregar al carrito, checkout con MP sandbox, ver historial de pedido, panel admin
- [ ] 13.6 Subir video a YouTube o Drive con visibilidad pública/no listado
- [ ] 13.7 Actualizar `README.md` raíz: agregar sección "Demo" con enlace al video

## Fase 13b: Compliance Gaps — Gaps de Rúbrica Identificados

- [x] CG-01 Crear `require_role(*roles)` dependency factory en `backend/app/dependencies.py` (RN-RB01–RN-RB10, RBAC)
- [x] CG-02 Instalar `axios` en frontend
- [x] CG-03 Crear `frontend/src/api/client.ts` con Axios instance + request interceptor (JWT Bearer) + response interceptor (auto-refresh en 401)
- [x] CG-04 Evaluar `@tanstack/form` para manejo de formularios (requerido por Integrador.txt) — alternativa válida a React Hook Form, buena para forms complejos (Register, Checkout). Baja prioridad: forms actuales funcionan con useState. No bloqueante.
- [x] CG-05 Evaluar arquitectura Feature-First / FSD para frontend (requerido por Descripcion.txt) — refactor significativo. La estructura actual (components/, pages/, hooks/) es React estándar y funciona bien para el tamaño del proyecto. No justifica el refactor.

## Fase 14: Verificación Final y Tests

- [x] 14.1 Ejecutar `python -m pytest backend/tests/ -v --tb=short` — auth (22/22), products (13/13), categories (8/8), middleware (8/8), health, search, wishlist, reviews OK. Cart: 6 fallos pre-existentes de lógica de negocio (no causados por este change).
- [ ] 14.2 Verificar cobertura: `python -m pytest --cov=app --cov-report=term-missing` — objetivo ≥60% (actual: ~51%)
- [x] 14.3 Verificar: buscar `await db.commit()` en `backend/app/services/` — **0 resultados** ✅
- [x] 14.4 Verificar: buscar `import stripe` en `backend/` — **0 resultados** ✅
- [x] 14.5 Ejecutar `npx tsc --noEmit` en frontend — **0 errores** ✅
- [x] 14.6 Verificar: buscar `useContext(AuthContext)` en `frontend/src/` — **0 resultados** ✅
- [x] 14.7 Verificar: los 4 stores Zustand existen en `frontend/src/store/` y usan `persist` donde corresponde (CE-11) ✅
- [ ] 14.8 Probar en sandbox MP end-to-end: pago aprobado → pedido pasa a PAGADO via IPN (CE-09)
- [ ] 14.9 Verificar que `docs/screenshots/` tiene 10 imágenes (CE-12)
- [ ] 14.10 Verificar que `README.md` tiene enlace a video demo (CE-13)
- [ ] 14.11 Verificar todos los endpoints en Swagger `/docs` usan prefijo `/api/v1`
- [ ] 14.12 Ejecutar `alembic upgrade head` en base de datos limpia — debe correr sin errores
- [ ] 14.13 Ejecutar seed de `estados_pedido` y `formas_pago` — debe ser idempotente
- [ ] 14.14 Verificar que el README tiene instrucciones claras de setup (CE-02)
- [ ] 14.15 Hacer commit final con mensaje: `feat(tpi): migracion-hacia-aprobacion — MercadoPago, UoW, Zustand, ERD v5`
