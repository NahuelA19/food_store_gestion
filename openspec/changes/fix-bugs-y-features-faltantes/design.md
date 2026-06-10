# Design: fix-bugs-y-features-faltantes

## Architecture Overview

Este change aborda 3 capas:
1. **Infraestructura (P0)**: Fix del token mal leído en todos los API clients del frontend
2. **Validaciones (P1)**: Price > 0 en backend + frontend
3. **Features incompletas (P2+)**: Stock, favoritos, sucursales, RBAC, UI cleanup

## Components

### P0: Fix Token en API Clients

- **Problema**: 9 archivos en `frontend/src/api/*.ts` leen el token con `localStorage.getItem("token")`, `localStorage.getItem("auth_token")` o `localStorage.getItem("access_token")`. El authStore de Zustand guarda en `localStorage['auth-storage']` con estructura `{ state: { accessToken: "..." } }`.
- **Solución**: Reemplazar TODAS esas lecturas por `useAuthStore.getState().accessToken`
- **Archivos afectados**:
  - `frontend/src/api/wishlistApi.ts` — `localStorage.getItem("token")`
  - `frontend/src/api/notificationApi.ts` — `localStorage.getItem("token")`
  - `frontend/src/api/reviewApi.ts` — `localStorage.getItem("token")`
  - `frontend/src/api/branchApi.ts` — `localStorage.getItem("auth_token")`
  - `frontend/src/api/orderApi.ts` — `localStorage.getItem("auth_token")`
  - `frontend/src/api/cartApi.ts` — `localStorage.getItem("access_token")`
  - `frontend/src/api/userApi.ts` — `localStorage.getItem("auth_token")`
  - `frontend/src/api/dashboardApi.ts` — `localStorage.getItem("auth_token")`
  - `frontend/src/api/direccionesApi.ts` — `localStorage.getItem("auth_token")`

**Patrón a usar en cada archivo**:
```typescript
import { useAuthStore } from "../store/authStore";

const token = useAuthStore.getState().accessToken;
const headers = token ? { Authorization: `Bearer ${token}` } : {};
```

### P1: Validación Precio > 0

- **Backend**: En `app/schemas/product.py`, `ProductCreate.price` ya tiene `gt=Decimal("0")` — verificar que se aplica correctamente
- **Frontend**: En el formulario de creación/edición de producto, agregar validación client-side

### P2: Sucursales

- **Detalle sucursal**: Verificar endpoint `GET /api/v1/branches/{id}` en backend y `BranchDetailPage.tsx` en frontend
- **Cambiar sucursal**: Identificar el mecanismo actual de cambio de sucursal y fixearlo
- **Desactivar sucursal**: El `toggleBranchStatus` en `branchApi.ts` usa auth con clave incorrecta — se fixea automáticamente con P0

### P3: RBAC — Roles y Post-Logout

- **ProtectedRoute**: Actualmente solo checkea `isAuthenticated`. Agregar prop opcional `requiredRole: string`
  - Sin `requiredRole` → solo checkea auth
  - Con `requiredRole` → checkea auth + `user?.role === requiredRole`
  - Si no matchea → redirect a `/unauthorized` o `/login`
- **Post-logout**: Verificar que `clearAuth()` + `queryClient.clear()` en `useAuth.ts` reactive la UI y redirija a `/login`

### P4: Stock Visible en Productos

- **ProductResponse** ya incluye `inventory: InventoryResponse` en el schema. En `ProductCard.tsx`, mostrar `inventory.stock_quantity` con estilo:

| Stock | Display |
|-------|---------|
| > 10 | "En stock (X unidades)" — verde |
| 1-10 | "Quedan pocos (X)" — amarillo |
| 0 | "Sin stock" — rojo |

### P5: Imágenes de Productos

- **Problema potencial**: Los seed images son URLs de Unsplash. Verificar que:
  1. El frontend renderiza `image_url` correctamente en `<img>` tags
  2. Las URLs del seed son válidas
  3. No hay error por `image_url: null` en productos sin imagen

### P6: Wishlist — Botón Favorito

- Ya existe `frontend/src/components/wishlist/FavoriteButton.tsx` — verificar que está presente en `ProductCard.tsx` y `ProductDetailPage.tsx`
- Depende de P0 para funcionar (token)

### P7-P8: Inventory Management

- **Al crear producto**: Agregar campo `stock_quantity` opcional en `ProductCreate` schema. Si se provee, crear `Inventory` con ese stock en lugar de 0.
- **Agregar stock**: Nuevo endpoint `PATCH /api/v1/products/{id}/stock` con body `{ "quantity": number }` que incrementa `stock_quantity`

### P9-P13: UI Cleanup

- **Dashboard**: Remover sección "Estado de Pedidos" si está vacía sin datos
- **Notificaciones**: Ya existe `NotificationDropdown.tsx` — verificar post-P0
- **Config**: Agregar placeholder o contenido básico

## Data Model

### ProductCreate Schema (backend)
```python
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    price: Decimal = Field(..., gt=Decimal("0"), max_digits=10, decimal_places=2)  # ya existe
    category_id: int = Field(..., gt=0)
    is_available: bool = Field(default=True)
    image_url: str | None = Field(None, max_length=2048)
    stock_quantity: int | None = Field(None, ge=0)  # NUEVO
```

### Nuevo endpoint stock
```
PATCH /api/v1/products/{id}/stock
Authorization: Bearer <token>
Body: { "quantity": 10 }
Response: { "product_id": 1, "stock_quantity": 50 }
```

## Implementation Notes

- **P0 debe hacerse PRIMERO** porque es prerequisito de casi todo lo demás
- Los tests existentes no cubren la lectura del token (es frontend puro), pero hay que verificar que no se rompan
- No se crean nuevas dependencias npm ni pip

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Al cambiar el token en 9 archivos, algún caso edge podría romperse | Revisar cada archivo uno por uno. Usar `replaceAll` solo donde es 1:1, pero varios usan distintas claves |
| `useAuthStore.getState()` podría no estar disponible si el store no se inicializó | El store de Zustand es síncrono y siempre disponible, no requiere inicialización |
| Productos sin `image_url` podrían romper el render de imágenes | Usar imagen placeholder cuando `image_url` es null |
