## Why

El sistema tiene bugs críticos que impiden su uso normal: los API clients del frontend leen el token de autenticación con claves incorrectas de localStorage, lo que rompe **9 de 11 módulos** que requieren auth (wishlist, notificaciones, reviews, sucursales, pedidos, carrito, usuario, dashboard, direcciones). Además hay features incompletas (stock, favoritos, validaciones) y secciones UI rotas o vacías. Este change las resuelve todas en orden de prioridad.

## What Changes

1. **🔥 Fix crítico: Token mal leído en API clients** — Todos los `api/*.ts` que usan `localStorage.getItem("token"/"auth_token"/"access_token")` pasan a usar `useAuthStore.getState().accessToken`
2. **Validar precio producto > 0** — Backend: agregar validator `gt=0` en `ProductCreate.price`. Frontend: validar en el formulario.
3. **Sucursales: detalle, cambiar sucursal, desactivar** — Fix al toggle (token bug, punto 1), verificar endpoint de detalle, fix al cambiar sucursal
4. **RBAC post-logout + roles** — `ProtectedRoute` debe redirigir a `/login` cuando no autenticado. Agregar `RequireAdmin` o `ProtectedRoute` con `requiredRole`. Verificar que `clearAuth()` reactive la UI correctamente.
5. **Stock visible en tarjetas de producto** — Mostrar cantidad de stock desde `ProductResponse.inventory.stock_quantity` en `ProductCard`
6. **Imágenes de productos** — Verificar que `image_url` se renderiza correctamente en cards y detalle
7. **Wishlist: botón favorito + vista** — Agregar `FavoriteButton` en `ProductCard` y `ProductDetailPage`. Verificar que `WishlistPage` funcione (depende del punto 1)
8. **Stock al crear producto** — Agregar campo `stock_quantity` en el formulario de creación (backend + frontend)
9. **Agregar stock a producto existente** — Endpoint o UI para incrementar stock de un producto existente
10. **Dashboard "estado de pedidos" vacío** — Remover sección o implementar con datos reales
11. **Campana de notificaciones** — El dropdown ya existe, verificar que funcione post-fix del punto 1
12. **(Post-fix) Verificar producto detail + navegación** — Verificar que después del fix de token, la página de detalle funcione correctamente
13. **Vista de configuración vacía** — Agregar contenido o placeholder

## Capabilities

### New Capabilities
- `inventory-management`: Gestión de stock de productos (crear con stock, agregar stock existente)
- `wishlist-favorites`: Wishlist/favoritos con botón de agregar desde producto

### Modified Capabilities
Ninguna — los specs existentes no cambian a nivel de requirements, solo se corrigen implementaciones.

## Impact

- **Backend**: `app/schemas/product.py` — validator en price; `app/routes/products.py` o nueva ruta para stock management
- **Frontend**: `frontend/src/api/*.ts` (9 archivos) — fix token; `frontend/src/components/ProtectedRoute.tsx` — RBAC; `frontend/src/components/ProductCard.tsx` — stock + favorito; formularios de producto — stock + validación precio
- **Dependencias**: Ninguna nueva

## Cumplimiento TPI

- CE-11: Los stores Zustand con persist funcionan correctamente (sin el fix de token, los API clients ignoran el store)
- RN-RB01–RB10: Roles y permisos visuales en frontend (punto 4)
- RN-PC01–PC05: Validación de precio y stock en productos (puntos 2, 5, 8, 9)
