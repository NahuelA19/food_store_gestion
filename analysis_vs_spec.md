# Análisis del Proyecto vs. Especificación

> **Fuentes de spec**: `docs/Descripcion.txt`, `docs/Integrador.txt`, `docs/Historias_de_usuario.txt`  
> **Proyecto analizado**: `food_store_gestion` (repo actual)  
> **Metodología**: inspección directa de archivos, no inferencia por tamaño  
> **Fecha**: 2026-05-12

---

## Resumen Ejecutivo

| Área | Estado | Cumplimiento real |
|---|---|---|
| Estructura backend (monolítica flat vs. feature-first) | ❌ No conforme | ~30% |
| Patrones UoW + BaseRepository | ✅ Implementado | ~90% |
| FSM de pedidos (6 estados) | ✅ Implementado | ~95% |
| Modelo de datos — snapshots, historial, pagos | ✅ Implementado | ~90% |
| Autenticación JWT + Refresh Tokens | ✅ Implementado | ~95% |
| RBAC (`require_role`) | ✅ Implementado | ~85% |
| MercadoPago — preference + webhook IPN | ⚠️ Parcial | ~60% |
| Tests backend (pytest) | ⚠️ Parcial | ~65% |
| Frontend — FSD arquitectura | ❌ No conforme | ~25% |
| Frontend — Zustand (4 stores) | ✅ Implementado | ~90% |
| Frontend — TanStack Query | ✅ Implementado | ~80% |
| Frontend — funcionalidades fuera de spec | ❌ Deuda técnica | — |

---

## 1. Backend — Arquitectura

### ❌ PROBLEMA CRÍTICO — Estructura flat en lugar de feature-first

La spec define una arquitectura **feature-first modular**. El estándar del profesor exige:

```
backend/app/modules/
├── auth/         → model.py, schemas.py, repository.py, service.py, router.py
├── pedidos/      → (ídem)
├── pagos/        → (ídem)
└── ...
```

**Lo que hay en el proyecto real:**

```
backend/app/
├── config.py
├── dependencies.py
├── main.py
├── core/
│   ├── repository.py        ← BaseRepository[T] genérico ✅
│   └── uow.py              ← UnitOfWork ✅
├── models/                  ← 26 modelos ORM (SQLAlchemy)
├── schemas/                 ← schemas Pydantic separados por recurso
├── routes/                  ← 16 routers (auth, products, orders, payments…)
├── services/                ← 14 services
├── repositories/            ← 5 repositorios específicos (parcial)
├── middleware/
├── security/
└── validation/
```

**No existe `modules/`**. La separación es por tipo de artefacto (MVC clásico), no por feature. Esto es estructuralmente diferente a la spec, aunque la funcionalidad puede existir.

> [!WARNING]
> La rúbrica evalúa "Estructura de módulos feature-first". Esta arquitectura es flat/MVC y NO cumple esa definición. Sin embargo, dado que el proyecto está avanzado y funcional, migrar a feature-first ahora tiene un costo muy alto vs. beneficio en nota.

**Alternativa**: Si el evaluador acepta que el patrón "de facto" está presente (models + schemas + routes + services cohesivos por recurso), el cumplimiento es ~70%. Si evalúa estructura de carpetas literalmente → ~30%.

---

## 2. Backend — Unit of Work (UoW)

### ✅ IMPLEMENTADO CORRECTAMENTE

Evidencia directa de `core/uow.py`:

```python
class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.orders = OrderRepository(session)      # repositorio específico
        self.users = UserRepository(session)
        self.products = BaseRepository(Product, session)  # genérico
        # ... 14 repositorios más

    async def __aenter__(self): return self
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()   # rollback en error
        else:
            await self.commit()     # commit en éxito
```

**Cumple al 100%** con la spec:
- ✅ Context manager async (`__aenter__`/`__aexit__`)
- ✅ Commit automático al salir exitosamente
- ✅ Rollback automático en error
- ✅ Repositorios como atributos del UoW
- ✅ `flush()` y `refresh()` expuestos
- ✅ Un único archivo `core/uow.py` (el problema de duplicación fue resuelto)

El UoW se inyecta vía `Depends(get_uow)` en `dependencies.py`:

```python
async def get_uow(session: AsyncSession = Depends(get_db)) -> AsyncGenerator[UnitOfWork, None]:
    async with UnitOfWork(session) as uow:
        yield uow
```

**✅ Patrón correcto.**

---

## 3. Backend — BaseRepository

### ✅ IMPLEMENTADO

`core/repository.py` existe (1.6KB). Los repositorios específicos lo extienden:
- `repositories/order_repository.py`
- `repositories/user_repository.py`
- `repositories/cart_repository.py`
- `repositories/inventory_repository.py`
- `repositories/review_repository.py`

El resto usa `BaseRepository(Model, session)` directamente desde el UoW. **✅ Conforme.**

---

## 4. Backend — FSM de Pedidos

### ✅ IMPLEMENTADO — con un problema de alias en enum

**Evidencia en `services/order_service.py`:**

```python
FSM_TRANSITIONS: dict[str, list[str]] = {
    "PENDIENTE":  ["CONFIRMADO", "CANCELADO"],   # Pago vía IPN → CONFIRMADO
    "CONFIRMADO": ["EN_PREP", "CANCELADO"],       # Admin prepara o cancela
    "EN_PREP":    ["EN_CAMINO", "CANCELADO"],     # Sale a delivery
    "EN_CAMINO":  ["ENTREGADO"],                  # Terminal positivo
    "ENTREGADO":  [],                             # Terminal
    "CANCELADO":  [],                             # Terminal
}
```

**Cumple con la spec (6 estados, 2 terminales, transición CONFIRMADO solo via IPN):**
- ✅ 6 estados principales
- ✅ `CONFIRMADO` bloqueado para admin manual (solo via webhook)
- ✅ `HistorialEstadoPedido` creado en cada transición con `estado_desde`, `estado_hasta`, `usuario_id`, `motivo`
- ✅ Inventario liberado en cancelación

**⚠️ Problema real detectado — enum `OrderStatus` inflado:**

El enum tiene 14 valores para 6 estados reales, con aliases en inglés y español del mismo estado (`PAGADO`/`PAID`, `CONFIRMADO`/`CONFIRMED`, etc.). El FSM opera sobre `estado_codigo` (string FK) pero el campo `status` usa este enum inflado, generando confusión.

> [!IMPORTANT]
> Los tests de FSM unitarios (`test_order_fsm.py`) — todos **PASSED** (14/14). Los tests de integración de órdenes (`test_orders.py`) tienen varios **FAILED** y **ERROR** — esto puede ser el origen de pérdida de puntos en evaluación.

---

## 5. Backend — Modelo de Datos

### ✅ Snapshots implementados correctamente

**`OrderItem` tiene los campos requeridos:**
```python
nombre_snapshot: Mapped[str | None] = mapped_column(String(255), nullable=True)
precio_snapshot: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
```

Y se populan en `create_order_from_cart` con los valores del producto al momento del checkout.
**✅ Cumple CE-13.**

### ✅ Pago con idempotency_key y external_reference

```python
class Pago(Base):
    mp_payment_id: Mapped[str | None]
    mp_status: Mapped[str | None]
    external_reference: Mapped[UUID]      # gen_random_uuid()
    idempotency_key: Mapped[UUID]         # unique=True, gen_random_uuid()
    monto: Mapped[Decimal]
    mp_raw_response: Mapped[dict | None]  # JSONB
```
**✅ Cumple todos los campos spec.**

### ✅ HistorialEstadoPedido — append-only

El historial se crea via `session.add()` en cada transición, nunca se modifica. **✅ Inmutable.**

### ✅ DireccionSnapshot

```python
order.direccion_snapshot = {
    "direccion": ..., "ciudad": ..., "provincia": ..., "codigo_postal": ...
}
```
**✅ Cumple CE-13.**

### ⚠️ Ingredientes — no es módulo independiente

El modelo `ingrediente.py` existe, pero no hay `/routes/ingredientes.py` ni `ingrediente_service.py`. Los ingredientes están en `producto_ingrediente.py` como tabla de asociación. La spec requiere CRUD de ingredientes independiente (US-011 a US-014).

---

## 6. Backend — Autenticación y RBAC

### ✅ JWT implementado

`dependencies.py` — `get_current_user`:
- ✅ Extrae Bearer token del header
- ✅ Verifica con `verify_token(token)`
- ✅ Carga usuario desde DB via `uow.users.get_by_id(user_id)`
- ✅ Verifica `deleted_at` y `is_active`

### ✅ RBAC implementado correctamente

```python
def require_role(*roles: str):
    async def _role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(403, detail=f"Requires: {', '.join(roles)}")
        return current_user
    return _role_checker
```

**✅ Factory de roles funcionando.**  
**Tests: todos los de auth PASSED (22/22).**

---

## 7. Backend — MercadoPago

### ⚠️ Parcialmente implementado — webhook con deficiencia crítica

**Lo que está bien:**
- ✅ `create_preference` usa el SDK de mercadopago real
- ✅ Guarda `Pago` con `idempotency_key` y maneja duplicados vía `IntegrityError`
- ✅ `handle_ipn` dispara la FSM correctamente (`approved` → `CONFIRMADO`, `rejected` → `CANCELADO`)
- ✅ El webhook está en `/api/v1/payments/webhook`

**❌ Deficiencia crítica del webhook:**

```python
# En routes/payments.py — webhook handler:
# For now, assume the payment was approved if the webhook was received
mp_status = "approved"  # HARDCODEADO — siempre aprueba
```

El webhook **siempre asume pago aprobado**. No consulta la API de MercadoPago para verificar el estado real del pago. Cualquier POST al endpoint hace `PENDIENTE → CONFIRMADO`.

> [!CAUTION]
> La spec requiere consultar el estado real del pago. El flujo correcto es:
> 1. Recibir webhook con `topic=payment&id=<payment_id>`
> 2. Consultar `sdk.payment().get(payment_id)` para obtener estado real
> 3. Según el estado → disparar FSM

**⚠️ Segundo problema — firma no verificada:**

El webhook no valida la firma `x-signature` de MercadoPago. Cualquier request POST puede disparar una transición FSM.

---

## 8. Backend — Tests

### ⚠️ Parcialmente passing — con failures en flujos clave

Del `test_output.txt` (250 tests en total):

| Suite | Resultado |
|---|---|
| `test_auth_middleware.py` | ✅ 8/8 PASSED |
| `test_auth_routes.py` | ✅ 13/13 PASSED |
| `test_categories.py` | ✅ 8/8 PASSED |
| `test_database.py` | ✅ 4/4 PASSED |
| `test_direcciones_entrega.py` | ✅ 11/11 PASSED |
| `test_inventory.py` | ✅ 7/7 PASSED |
| `test_products.py` | ✅ 13/13 PASSED |
| `test_order_fsm.py` | ✅ 14/14 PASSED |
| `test_cart.py` | ⚠️ 5 PASSED / 6 FAILED |
| `test_orders.py` | ⚠️ 3 PASSED / 7 FAILED / 12 ERROR |
| `test_notifications.py` | ❌ 7 ERROR / 1 PASSED |

> [!IMPORTANT]
> Los ERRORs (no FAILUREs) en `test_orders.py` suelen indicar errores en setup de fixtures, no en código de producción. Pueden ser resolvibles sin cambiar lógica de negocio.

**Cobertura estimada: ~65%**. Suficiente para el bonus, pero los failures en cart y orders son señales de regresión activa.

---

## 9. Frontend — Arquitectura

### ❌ No conforme con FSD

**Estructura actual:**
```
frontend/src/
├── App.tsx         ← routing directo (no hay app/ layer)
├── api/            ← clientes HTTP por recurso
├── components/     ← mezcla: Navigation, ProductCard, ProtectedRoute, Cart/, layout/, reviews/, wishlist/
├── context/        ← Context API (spec dice Zustand, que sí existe)
├── hooks/          ← 14 hooks
├── pages/          ← 18 páginas flat (sin subdirectorios por feature)
├── store/          ← 4 stores Zustand ✅
├── types/          ← tipos TypeScript
└── lib/            ← utilidades
```

**Capas FSD requeridas que FALTAN:**
- ❌ `app/` — providers, QueryClient, global styles
- ❌ `widgets/` — bloques de UI compuestos
- ❌ `entities/` — modelos de dominio (User, Product, Order)
- ❌ `features/` — sub-árboles por feature con model/ui/api

### ❌ Rutas no todas protegidas correctamente

```tsx
// App.tsx — rutas sin ProtectedRoute:
<Route path="/orders" element={<OrdersPage />} />           // sin auth
<Route path="/orders/:id" element={<OrderDetailPage />} />  // sin auth
<Route path="/branches" element={<BranchesPage />} />       // sin auth
<Route path="/employees" element={<EmployeesPage />} />     // sin auth
```

Las páginas de órdenes no están protegidas en el router. El usuario verá un error de API en lugar de ser redirigido al login.

---

## 10. Frontend — Zustand

### ✅ Los 4 stores requeridos existen

| Store | Archivo | Estado |
|---|---|---|
| `useAuthStore` | `store/authStore.ts` | ✅ con `persist` |
| `useCartStore` | `store/cartStore.ts` | ✅ con `persist` |
| `usePaymentStore` | `store/paymentStore.ts` | ✅ |
| `useUIStore` | `store/uiStore.ts` | ✅ |

`authStore` almacena `user`, `accessToken`, `refreshToken`, `isAuthenticated`. **✅ Correcto.**

---

## 11. Frontend — TanStack Query

### ✅ Implementado en hooks

`useOrders.ts` usa `useQuery` y `useMutation` correctamente. `useAuth.ts` usa `useMutation` para login/register. **✅ Patrón correcto.**

**⚠️ Sin staleTime configurado** en la mayoría de los queries — refetching agresivo en cada mount.

---

## 12. Frontend — Funcionalidades fuera de spec

### ❌ Código que no suma puntos y agrega deuda

La spec v5.0 NO define:
- **Wishlist** → `pages/WishlistPage.tsx`, `components/wishlist/`, `hooks/useWishlist.ts`, `models/wishlist.py`
- **Reviews** → `components/reviews/`, `routes/reviews.py`, `services/review_service.py`, `routes/admin_reviews.py`
- **Branches / Sucursales** → `pages/BranchesPage.tsx`, `pages/BranchDetailPage.tsx`, `routes/branches.py`
- **Notifications** → 7 tests con ERROR sugieren que no funciona correctamente
- **Employees page** → `pages/EmployeesPage.tsx`

> [!CAUTION]
> Estas features no existen en la rúbrica. Los 7 ERROR en notifications y 6 FAILED en cart pueden ser consecuencia directa de la complejidad adicional. El tiempo invertido en estas features no suma puntos.

---

## 13. Checklist de Entrega — Estado Real

| CE | Ítem | Estado | Evidencia |
|---|---|---|---|
| CE-01 | Repositorio Git | ✅ | `.git/` existe |
| CE-02 | README con instrucciones | ✅ | `README.md` 8.9KB |
| CE-03 | `.env.example` | ✅ | `backend/.env.example` existe |
| CE-04 | `alembic upgrade head` | ⚠️ | `alembic/` existe, no verificado en producción |
| CE-05 | Script de seed | ✅ | `backend/run_seeds.py` existe |
| CE-06 | Backend funcional | ⚠️ | Estructura presente, tests de orders con failures |
| CE-07 | Frontend funcional | ⚠️ | Páginas presentes, RBAC de rutas incompleto |
| CE-08 | Flujo de auth completo | ✅ | 22 tests de auth pasando |
| CE-09 | CRUD de productos | ✅ | 13 tests de productos pasando |
| CE-10 | Flujo de pedidos + FSM | ⚠️ | FSM unitario 14/14 ✅, integración 7 FAILED |
| CE-11 | Integración MercadoPago | ⚠️ | Webhook existe pero `mp_status` hardcodeado |
| CE-12 | RBAC por roles | ✅ | `require_role()` factory implementado |
| CE-13 | Snapshots e inmutabilidad | ✅ | `nombre_snapshot`, `precio_snapshot`, `direccion_snapshot` |
| CE-14 | Carrito persistente | ✅ | `cartStore.ts` con `persist` |

---

## 14. Priorización de Acciones

### 🔴 Crítico — afectan directamente la nota

1. **Corregir `test_orders.py`** — investigar por qué 12 tests están en ERROR (probablemente fixtures rotos).

2. **Arreglar webhook de MercadoPago** — reemplazar `mp_status = "approved"` hardcodeado:
   ```python
   response = sdk.payment().get(payment_id)
   mp_status = response["response"]["status"]
   ```

3. **Proteger rutas faltantes en frontend**:
   ```tsx
   <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
   ```

4. **Corregir `test_cart.py`** — 6 failures en cart pueden ser un bug de código o fixture.

### 🟡 Importante — mejora calificación

5. **Crear CRUD de ingredientes** — router + service independientes (US-011 a US-014).

6. **Agregar `staleTime` a los queries de TanStack** — mejora calidad de código.

7. **Eliminar alias duplicados del enum `OrderStatus`** — 14 valores para 6 estados reales.

8. **Corregir `test_notifications.py`** — 7 ERROR sugiere fixture roto.

### 🟢 Bonus / Calidad

9. **Agregar validación de firma en webhook** (`x-signature` header de MercadoPago).

10. **Documentar estructura en README** — explicar arquitectura flat para que el evaluador entienda la coherencia.

---

## 15. Estimación de Puntuación (con evidencia real)

| Criterio | Máx | Estimado | Justificación |
|---|---|---|---|
| Backend — Estructura y Configuración | 10 | **5** | Flat/MVC, no feature-first |
| Backend — Modelo de Datos | 15 | **12** | ERD completo, snapshots, ingrediente sin módulo |
| Backend — Unit of Work y Repository | 15 | **13** | UoW correcto, repo parcial (5/14 específicos) |
| Backend — Capa de Servicio + FSM | 15 | **11** | FSM correcto, `test_orders` con failures |
| Backend — Controladores REST | 15 | **11** | CRUD implementado, cart con 6 failures |
| Backend — MercadoPago | 15 | **7** | Preference OK, webhook hardcodeado |
| Frontend — Estructura y TypeScript | 10 | **4** | No FSD, rutas sin protección |
| Frontend — Zustand | 10 | **9** | 4 stores con persist ✅ |
| Frontend — TanStack Query | 15 | **10** | Hooks con useQuery/useMutation, sin staleTime |
| Frontend — Funcionalidades Cliente | 15 | **9** | Carrito, checkout, órdenes, perfil |
| Frontend — Panel Admin | 15 | **7** | CreateProduct/Category, sin panel admin completo |
| UI/UX y Diseño | 10 | **6** | index.css 8KB, componentes con estilos |
| Calidad de Código | 10 | **7** | async/await, Pydantic, TypeScript strict |
| **TOTAL** | **200** | **~111** | — |

> **Estimación actual: ~111/200 (55%)**  
> **Con fixes críticos aplicados: ~135-145/200 (70%)**

---

## 16. Correcciones al Análisis Anterior

| Gap (análisis anterior) | Estado real tras inspección |
|---|---|
| "Dos archivos UoW" | ✅ **Resuelto** — solo existe `core/uow.py` |
| "Pago model muy pequeño (1.1KB)" | ✅ **Resuelto** — `pago.py` tiene todos los campos spec |
| "Tests completamente ausentes" | ✅ **Resuelto** — 29 archivos de test, ~250 tests |
| "Módulo `modules/` ausente" | ❌ **Confirmado** — arquitectura flat/MVC |
| "Webhook IPN muy pequeño" | ⚠️ **Parcial** — existe y usa FSM, pero `mp_status` hardcodeado |
| "Features fuera de spec (wishlist, reviews)" | ❌ **Confirmado** — existen y generan deuda |
| "Módulo ingredientes ausente" | ❌ **Confirmado** — solo modelo y tabla de asociación, sin CRUD |
