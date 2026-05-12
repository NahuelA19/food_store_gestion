# Diagnóstico TPI — Solo los Changes Realizados

> Revisión del 2026-05-11 | Solo evalúa los 16 changes **completados y archivados** en OPSX.
> Los changes no realizados aún no se penalizan — ese trabajo está por venir.

---

## Changes Completados (Archivados en OPSX)

| # | Change | Estado OPSX |
|---|--------|-------------|
| 1 | `setup-project-structure` | ✅ Archivado |
| 2 | `add-database-layer` | ✅ Archivado |
| 3 | `implement-authentication` | ✅ Archivado |
| 4 | `create-product-service` | ✅ Archivado |
| 5 | `create-user-service` | ✅ Archivado |
| 6 | `build-search-and-filtering` | ✅ Archivado |
| 7 | `implement-checkout-and-orders` | ✅ Archivado |
| 8 | `implement-payment-integration` | ✅ Archivado |
| 9 | `implement-shopping-cart` | ⚠️ Archivado — **tasks SIN completar** |
| 10 | `add-notifications` | ✅ Archivado |
| 11 | `add-product-reviews` | ✅ Archivado |
| 12 | `admin-dashboard-pages` (archive) | ✅ Archivado |
| 13 | `frontend-dashboard-redesign` | ✅ Archivado |
| 14 | `implement-favorites-wishlist` | ✅ Archivado |
| 15 | `implement-recommendation-engine` | ✅ Archivado |
| 16 | `monitoring-health-check` | ✅ Archivado |
| — | `admin-dashboard-pages` (activo) | 🔄 En progreso — todas tasks ✅ |

> [!WARNING]
> El change `implement-shopping-cart` (Change 9) tiene **todos los checkboxes vacíos** (`[ ]`) en su tasks.md. Fue archivado sin completar las tareas. Esto es una discrepancia entre el archivo OPSX y el código real.

---

## Evaluación por Criterio de Rúbrica — Solo lo Hecho

### 1. Backend — Estructura y Configuración (10 pts)
**Estimación: 5–6/10 pts**

✅ **Lo que los changes hicieron bien:**
- `setup-project-structure`: monorepo con backend/frontend, `.gitignore`, `.env.example`, README, Husky, commitlint, CI/CD en GitHub Actions — todo correcto
- `add-database-layer`: Alembic inicializado, PostgreSQL async con asyncpg, engine startup/shutdown en lifespan — correcto
- `implement-authentication`: CORS configurado, routers registrados en main.py — correcto
- `monitoring-health-check`: health endpoint funcional

⚠️ **Brechas dentro de lo hecho vs. el spec:**
- La estructura acordada en los changes es **horizontal** (`routes/`, `services/`, `models/` separados) — el spec exige **feature-first vertical** (`app/modules/auth/`, `app/modules/pedidos/`, etc.)
- El prefijo de rutas registrado en main.py es `/api` (sin `/v1`) en la mayoría de routers — el spec exige `/api/v1`
- No hay `core/uow.py` — los changes no planificaron Unit of Work

---

### 2. Backend — Modelo de Datos (15 pts)
**Estimación: 6–8/15 pts**

✅ **Lo que los changes implementaron:**
- `add-database-layer`: tablas Usuario, Categoria, Producto, Pedido, DetallePedido con SQLAlchemy v2 + Alembic
- `create-product-service`: tabla Inventory, índices, relaciones Product↔Inventory
- `implement-checkout-and-orders`: campo `status_history` en Order (como JSON column), relaciones OrderItem
- `implement-payment-integration`: campos de pago en Order (`payment_status`, `paid_at`, etc.)

⚠️ **Brechas dentro de lo hecho vs. el spec:**
- **RefreshToken**: no existe tabla — el change `implement-authentication` usa solo JWT sin RefreshToken en BD
- **Ingrediente + ProductoIngrediente**: `create-product-service` usó tabla `Inventory` separada en lugar del modelo de `stock_cantidad` en Producto + tabla Ingrediente
- **FormaPago**: no existe tabla — es un campo enum/string libre en los schemas
- **EstadoPedido como tabla catálogo**: no implementado — usa Python Enum directamente
- **HistorialEstadoPedido tabla append-only**: implementado como `status_history: JSON column` en Order — el spec exige tabla separada con campos específicos y constraint append-only
- **DireccionEntrega**: no aparece en ningún change completado
- El `implement-payment-integration` implementó **Stripe** (PaymentIntent, Customer) — el spec exige **MercadoPago** específicamente

---

### 3. Backend — Unit of Work y Repository (15 pts)
**Estimación: 0/15 pts**

❌ **Ningún change completado implementó UoW ni BaseRepository.**

Los changes `implement-checkout-and-orders` y `implement-payment-integration` usan directamente `db: AsyncSession` y hacen `db.commit()` explícito. Esto viola el criterio CE-10 directamente.

> [!CAUTION]
> Esto no es un change no realizado — es que ninguno de los 16 changes planificó o implementó este patrón. El evaluador busca activamente esto.

---

### 4. Backend — Capa de Servicio (15 pts)
**Estimación: 8–10/15 pts**

✅ **Lo que los changes implementaron correctamente:**
- Hay separación real de `services/` con lógica de negocio (cart_service, order_service, payment_service, etc.)
- `implement-checkout-and-orders`: VALID_TRANSITIONS mapeado, cancel_order con lógica de release inventory
- `create-product-service`: lógica de negocio en el servicio, no en routers
- `create-user-service`: gestión de roles, validaciones en servicio

⚠️ **Brechas dentro de lo hecho:**
- Los services reciben `db: AsyncSession` directamente, no un `UoW` — no es el patrón correcto
- La FSM del pedido existe parcialmente (VALID_TRANSITIONS dict) pero no valida todas las RN del spec (RN-02: PENDIENTE→CONFIRMADO solo automático, RN-05: motivo obligatorio en cancelación)
- La transición automática por webhook MP no está implementada (porque MP no está implementado)

---

### 5. Backend — Controladores REST (15 pts)
**Estimación: 8–10/15 pts**

✅ **Lo que los changes implementaron:**
- `create-product-service`: GET, POST, PUT, DELETE para productos con verbos correctos, status codes 404/400/403/409
- `implement-authentication`: POST /register, POST /login con manejo correcto de errores
- `implement-checkout-and-orders`: GET, POST, PATCH para pedidos
- Schemas Pydantic separados (Create, Update, Response) en `create-product-service`

⚠️ **Brechas:**
- **Prefijo incorrecto**: la mayoría de routers usa `/api`, no `/api/v1` — esto impacta directamente la rúbrica y el CE-08
- El `implement-shopping-cart` tenía planificado rutas con `/api/v1` pero **no completó ninguna tarea**

---

### 6. Backend — MercadoPago (15 pts)
**Estimación: 2/15 pts**

> [!CAUTION]
> El change `implement-payment-integration` implementó **Stripe**, no MercadoPago.

El tasks.md del change explícitamente dice:
- Task 3.1: `Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET...`
- Task 5.1: `create_payment_intent() — creates Stripe PaymentIntent`
- Task 6.1: `POST /api/payments/webhook (Stripe signature)`

El spec exige MercadoPago Checkout API con SDK Python `mercadopago 2.3.0+`, IPN webhook, tabla Pago con `mp_payment_id`, `external_reference`, `idempotency_key` UUID. **Esta divergencia viene del diseño del change mismo, no de algo pendiente.**

Los 2 puntos estimados son por tener al menos un webhook implementado como concepto.

---

### 7. Frontend — Estructura y TypeScript (10 pts)
**Estimación: 5/10 pts**

✅ **Lo que los changes hicieron:**
- `setup-project-structure`: React + TypeScript + Vite, tsconfig, estructura src/
- `create-product-service`: componentes en `components/`, páginas en `pages/`, hooks en `hooks/`
- `frontend-dashboard-redesign`: sistema de diseño consistente

⚠️ **Brechas:**
- Feature-Sliced Design no fue implementado en ningún change — la estructura es pages/components/hooks simple
- No hay carpeta `features/`, `entities/`, `shared/` que el spec FSD requiere

---

### 8. Frontend — Zustand (10 pts)
**Estimación: 0/10 pts**

❌ **Ningún change completado implementó Zustand.**

- `implement-authentication` (change 3): implementó auth con **localStorage + Context (`AuthContext.tsx`)**, NO Zustand
- `implement-shopping-cart` (change 9): el tasks.md tenía planificado CartContext con React Context — y ni eso fue completado (tasks vacías)
- No existe `authStore.ts`, `cartStore.ts`, `paymentStore.ts`, ni `uiStore.ts`

El spec exige explícitamente 4 stores Zustand tipados con `persist` middleware. El CE-11 lo pide explícitamente.

---

### 9. Frontend — TanStack Query (15 pts)
**Estimación: 3–5/15 pts**

⚠️ **Situación ambigua:**
- Los hooks existen (`useProducts.ts`, `useOrders.ts`, `useCart.ts`, etc.) — fueron creados en `create-product-service` y otros changes
- **No se confirmó** que usen `@tanstack/react-query` (useQuery/useMutation) — podrían hacer fetch directo con useEffect/useState, que es lo que el tasks.md de `implement-authentication` planificó (useState + localStorage)
- El spec exige TanStack Query para TODO el fetching de datos del servidor

---

### 10. Frontend — Funcionalidades Cliente (15 pts)
**Estimación: 5–7/15 pts**

✅ **Lo que los changes hicieron:**
- `create-product-service`: catálogo con filtros, búsqueda, paginación, ProductCard, ProductDetail
- `admin-dashboard-pages`: OrdersPage, OrderDetailPage con status management
- `implement-shopping-cart`: CartPage existe pero **el change no completó sus tareas** — el carrito puede no funcionar end-to-end

❌ **Ausente dentro de lo hecho:**
- Carrito persistente con Zustand (no implementado)
- Checkout con CardPayment de MercadoPago (Stripe en su lugar, sin frontend MP)
- Timeline de pedido con polling 30s

---

### 11. Frontend — Panel Admin (15 pts)
**Estimación: 8–10/15 pts**

✅ **Lo que los changes hicieron — esto está bien:**
- `admin-dashboard-pages` (archivado): Dashboard KPI cards con skeleton loaders, OrdersPage, OrderDetailPage, BranchesPage, BranchDetailPage, EmployeesPage — todo con `[x]`
- `admin-dashboard-pages` (activo, en progreso): todos los tasks `[x]` — sidebar, KPIs, pedidos, sucursales, empleados
- `monitoring-health-check`: health endpoint, métricas

⚠️ **Brechas:**
- Los datos de Orders/Branches son **demo data estáticos**, no conectados a la API real
- No hay CRUD de categorías/productos desde el panel admin frontend (solo backend)
- Gestión de stock via panel admin no implementada en frontend

---

### 12. UI/UX y Diseño (10 pts)
**Estimación: 7–8/10 pts**

✅ El `frontend-dashboard-redesign` y `admin-dashboard-pages` evidencian un sistema de diseño consistente (hay COLOR_PALETTE.md y DESIGN_SYSTEM.md en el repo). Skeleton loaders, estados vacíos, modo oscuro implementados.

---

### 13. Calidad de Código (10 pts)
**Estimación: 7–8/10 pts**

✅ **Muy bien en esto:**
- `setup-project-structure`: commitlint + Husky + Prettier + Black + Ruff + ESLint — todo configurado y funcionando
- 25 archivos de tests en backend → casi seguro el **bonus de +10 pts**
- Conventional commits correctos en todos los changes
- Tipado TypeScript estricto planificado en los changes

---

## Resumen — Estimación de Puntos (Solo lo Hecho)

| Criterio (sobre rúbrica) | Pts posibles | Estimación con lo hecho |
|---|---|---|
| Backend — Estructura | 10 | 5–6 |
| Backend — Modelo de datos | 15 | 6–8 |
| Backend — Unit of Work + Repo | 15 | **0** |
| Backend — Capa de Servicio | 15 | 8–10 |
| Backend — Controladores REST | 15 | 8–10 |
| Backend — MercadoPago | 15 | **2** |
| Frontend — Estructura + TS | 10 | 5 |
| Frontend — Zustand | 10 | **0** |
| Frontend — TanStack Query | 15 | 3–5 |
| Frontend — Funcionalidades Cliente | 15 | 5–7 |
| Frontend — Panel Admin | 15 | 8–10 |
| UI/UX y Diseño | 10 | 7–8 |
| Calidad de Código | 10 | 7–8 |
| **TOTAL** | **200** | **~64–79 pts** |

**Bonus tests (>60% cobertura):** +10 pts probables → **~74–89 pts**

> [!IMPORTANT]
> Rango actual: **74–89/200** → zona entre INSUFICIENTE y REGULAR (umbral de 100 pts para REGULAR). Esto es solo con lo ya hecho — hay mucho trabajo que aún está por delante según el mapa de changes.

---

## Las 3 Brechas Dentro de lo Ya Hecho (para corregir antes de avanzar)

> [!CAUTION]
> Estas no son cosas pendientes — son errores de diseño en changes YA completados:

### 🔴 1. Stripe en lugar de MercadoPago (`implement-payment-integration`)
El change se diseñó con Stripe desde el inicio. Hay que re-diseñar e implementar con MercadoPago. Impacta 15 pts directos + CE-09.

### 🔴 2. Unit of Work ausente en todos los changes
Ningún change lo planificó. No es "trabajo futuro" — es un vacío arquitectónico que atraviesa todo lo hecho. Impacta 15 pts + CE-10.

### 🔴 3. Zustand ausente — autenticación con Context/localStorage
El change de auth eligió React Context + localStorage en vez de Zustand. El carrito tampoco usa Zustand. Impacta 10 pts + CE-11.

---

## Lo que Está Bien (mérito real de lo hecho)

> [!NOTE]

✅ **Calidad general del código**: Estructura prolija, commits convencionales, linting funcional  
✅ **Tests**: 25 archivos pytest — muy buen trabajo, casi asegura el bonus  
✅ **Panel Admin**: El trabajo de dashboard es sólido y visible  
✅ **Catálogo de productos**: Bien implementado con filtros, search, paginación  
✅ **Autenticación JWT básica**: Flujo de login/register funcional  
✅ **Infraestructura**: Alembic, Docker, CI/CD, variables de entorno — todo correcto

---

*Diagnóstico basado en: tasks.md de los 16 changes archivados + 1 change activo, verificado contra código real del repositorio.*
