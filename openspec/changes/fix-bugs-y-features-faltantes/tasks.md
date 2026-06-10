# Tasks: fix-bugs-y-features-faltantes

> **Orden de implementación**: Las fases están ordenadas por prioridad. No saltarse fases — la P0 es prerequisito de casi todo.

---

## Fase 0 (P0): 🔥 Fix Token Mal Leído en API Clients

> **Por qué primero**: Sin esto, NINGUNA llamada autenticada funciona. 9 de 11 API clients rotos.

- [ ] 0.1 Fix `frontend/src/api/wishlistApi.ts`: reemplazar `localStorage.getItem("token")` por `useAuthStore.getState().accessToken`
- [ ] 0.2 Fix `frontend/src/api/notificationApi.ts`: reemplazar `localStorage.getItem("token")` por `useAuthStore.getState().accessToken`
- [ ] 0.3 Fix `frontend/src/api/reviewApi.ts`: reemplazar `localStorage.getItem("token")` por `useAuthStore.getState().accessToken`
- [ ] 0.4 Fix `frontend/src/api/branchApi.ts`: reemplazar `localStorage.getItem("auth_token")` por `useAuthStore.getState().accessToken`
- [ ] 0.5 Fix `frontend/src/api/orderApi.ts`: reemplazar `localStorage.getItem("auth_token")` por `useAuthStore.getState().accessToken`
- [ ] 0.6 Fix `frontend/src/api/cartApi.ts`: reemplazar `localStorage.getItem("access_token")` por `useAuthStore.getState().accessToken`
- [ ] 0.7 Fix `frontend/src/api/userApi.ts`: reemplazar `localStorage.getItem("auth_token")` por `useAuthStore.getState().accessToken`
- [ ] 0.8 Fix `frontend/src/api/dashboardApi.ts`: reemplazar `localStorage.getItem("auth_token")` por `useAuthStore.getState().accessToken`
- [ ] 0.9 Fix `frontend/src/api/direccionesApi.ts`: reemplazar `localStorage.getItem("auth_token")` por `useAuthStore.getState().accessToken`
- [ ] 0.10 Verificar: `npm run type-check --workspace frontend` sin errores
- [ ] 0.11 Verificar: probar que un login + llamada a `/api/v1/products/` retorna datos correctamente

---

## Fase 1 (P1): Validación Precio > 0

- [ ] 1.1 Backend: verificar que `ProductCreate.price` tenga `gt=Decimal("0")` en `app/schemas/product.py` — si falta, agregarlo
- [ ] 1.2 Frontend: agregar validación en formulario de crear/editar producto para que no acepte precio <= 0
- [ ] 1.3 Verificar: crear producto con precio 0 desde Swagger debe dar error 422

---

## Fase 2 (P2): Sucursales — Detalle, Cambiar, Desactivar

- [ ] 2.1 Backend: verificar endpoint `GET /api/v1/branches/{id}` funciona correctamente (revisar `branch_service.py`)
- [ ] 2.2 Frontend: verificar que `BranchDetailPage.tsx` recibe el id correcto y llama al endpoint bien
- [ ] 2.3 Frontend: fix `toggleBranchStatus` en `branchApi.ts` — se arregla con Fase 0, pero verificar que el catch no sea silencioso
- [ ] 2.4 Frontend: investigar y fixear el cambio de sucursal (switch branch) — revisar cómo se almacena la sucursal activa
- [ ] 2.5 Verificar: crear una sucursal, ver detalle, desactivar, reactivar

---

## Fase 3 (P3): RBAC — Roles + Post-Logout

- [ ] 3.1 Frontend: actualizar `ProtectedRoute.tsx` para aceptar `requiredRole?: string` y redirigir si no matchea
- [ ] 3.2 Frontend: aplicar `requiredRole` en rutas de admin (`/admin/*`, `/products/new`, `/categories/new`, `/employees`)
- [ ] 3.3 Frontend: verificar que al hacer logout, la UI se actualiza y redirige a `/login`
- [ ] 3.4 Frontend: verificar que el sidebar solo muestra opciones según el rol del usuario
- [ ] 3.5 Verificar: login como admin vs login como client — las vistas deben ser diferentes

---

## Fase 4 (P4): Stock Visible en Tarjetas de Producto

- [ ] 4.1 Frontend: actualizar `ProductCard.tsx` para mostrar `inventory.stock_quantity` con colores (verde >10, amarillo <=10, rojo =0)
- [ ] 4.2 Verificar: los productos en el listado muestran su stock correctamente

---

## Fase 5 (P5): Imágenes de Productos

- [ ] 5.1 Frontend: verificar que `ProductCard.tsx` y `ProductDetailPage.tsx` renderizan `image_url` correctamente
- [ ] 5.2 Frontend: agregar placeholder cuando `image_url` es null
- [ ] 5.3 Verificar: productos seed muestran imágenes de Unsplash

---

## Fase 6 (P6): Wishlist — Botón Favorito + Vista

- [ ] 6.1 Frontend: verificar que `FavoriteButton.tsx` existe y funciona (depende de Fase 0)
- [ ] 6.2 Frontend: agregar `FavoriteButton` en `ProductCard.tsx`
- [ ] 6.3 Frontend: agregar `FavoriteButton` en `ProductDetailPage.tsx`
- [ ] 6.4 Frontend: verificar que `WishlistPage.tsx` muestra los favoritos correctamente
- [ ] 6.5 Verificar: click en corazón → se agrega a favoritos → aparece en WishlistPage

---

## Fase 7 (P7): Stock al Crear Producto

- [ ] 7.1 Backend: agregar campo opcional `stock_quantity: int | None = Field(None, ge=0)` en `ProductCreate`
- [ ] 7.2 Backend: en `create_product` (route/service), si `stock_quantity` se provee, crear Inventory con ese valor en lugar de 0
- [ ] 7.3 Frontend: agregar campo "Stock inicial" en formulario de crear producto
- [ ] 7.4 Verificar: crear producto con stock 50 → debe mostrar stock 50

---

## Fase 8 (P8): Agregar Stock a Producto Existente

- [ ] 8.1 Backend: crear endpoint `PATCH /api/v1/products/{id}/stock` con body `{ "quantity": int }` que incrementa `stock_quantity`
- [ ] 8.2 Backend: crear schema `StockUpdate` en schemas de producto
- [ ] 8.3 Frontend: agregar botón/UI en detalle de producto o admin para agregar stock
- [ ] 8.4 Verificar: endpoint suma stock correctamente, frontend muestra el nuevo valor

---

## Fase 9 (P9): Dashboard — Estado de Pedidos

- [ ] 9.1 Frontend: verificar componente/fila vacía en Dashboard y removerla o implementarla con datos reales
- [ ] 9.2 Verificar: dashboard se ve limpio sin secciones vacías

---

## Fase 10 (P10): Campana de Notificaciones

- [ ] 10.1 Frontend: verificar que `NotificationDropdown.tsx` funciona post-Fase 0
- [ ] 10.2 Verificar: dropdown de notificaciones se abre, muestra notis, se pueden marcar como leídas

---

## Fase 11 (P11): Post-Fix — Product Detail + Navegación

- [ ] 11.1 Verificar que `ProductDetailPage.tsx` carga datos correctamente después de Fase 0
- [ ] 11.2 Verificar que la navegación "volver atrás" no requiera recargar la página
- [ ] 11.3 Si persiste el bug de navegación, fixearlo (posible React Query cache)

---

## Fase 12 (P12): Vista de Configuración

- [ ] 12.1 Agregar contenido básico a la página de configuración (puede ser placeholder con opciones de perfil)
