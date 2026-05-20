# Design: Kitchen Display System (KDS) y Rol Cocinero

## Patrón de Capas
La arquitectura backend seguirá estrictamente el patrón `Router → Service → UoW → Repository → Model`.
- **Router:** Validará el acceso mediante RBAC (`require_role(["COCINA", "PEDIDOS", "ADMIN"])`).
- **Service:** La lógica del WebSocket y la inyección de la mensajería se orquestará a nivel servicio, publicando el evento a las conexiones en memoria inmediatamente después de la resolución satisfactoria de la UoW.
- **UnitOfWork (UoW):** Controlará el avance de los estados. **Ningún service realizará `db.commit()` directo**.

## Modelo de Datos y FSM
No hay adición de tablas nuevas. Toda la gestión se apoya en el FSM actual. 
- Los estados objetivo para la cocina son: `CONFIRMADO` y `EN_PREP`.
- Los campos de auditoría (quién y a qué hora avanzó el estado) se guardarán obligatoriamente en `historial_estados_pedido` (append-only) (RN-CO04).
- Las reglas de negocio `RN-CO03` (Control de Transiciones de Cocina) prohibirán a nivel Servicio que el rol `COCINA` avance a estados no permitidos (ej. `ENTREGADO`).

## Backend: Infraestructura de Tiempo Real
### WebSocket Pub/Sub (`app/services/websocket_manager.py`)
- Se instanciará un `ConnectionManager` global en el backend.
- Mantendrá un `set` de conexiones activas.
- El método `broadcast(event_type, payload)` será invocado por el servicio de Pedidos y Pagos cuando ocurra `PENDIENTE -> CONFIRMADO` y `CONFIRMADO -> EN_PREP` -> `EN_CAMINO`.
- **Autenticación en WS:** Se requerirá el pase del JWT vía Query Param o Header en el Handshake del socket en la ruta `/api/v1/cocina/ws`.

### Endpoints
- `GET /api/v1/cocina/pedidos`: Lista inicial (estado `CONFIRMADO` y `EN_PREP`) ordenada por antigüedad (`created_at` del historial con estado `CONFIRMADO`). Retorna el `nombre_snapshot`, notas del pedido y personalización requerida.
- `PATCH /api/v1/pedidos/{id}/estado`: Reutilizado o expandido para permitir la transición `EN_PREP -> EN_CAMINO` por el cocinero.

## Frontend: TanStack Query + Zustand
### Gestión del Estado del Cliente
- **AuthStore:** Determinará el acceso al KDS verificando `role === 'COCINA'`.
- **KitchenStore (Opcional en uiStore):** Manejará persistencias menores como las preferencias locales del chef (Alertas Sonoras `ON/OFF`).

### Gestión del Estado del Servidor
- **useQuery:** Se usará `useQuery({ queryKey: ['kitchen-orders'], queryFn: fetchKitchenOrders })` para inicializar el Kanban.
- **WebSocket a TanStack Query:** Al recibir un evento por WS (ej. `PEDIDO_CONFIRMADO`), usaremos `queryClient.setQueryData(['kitchen-orders'], old => [...old, newOrder])`. Esto evita crear un duplicado del store global con Zustand.
- **useMutation:** Para los botones "Comenzar" y "Despachar", ejecutando el `PATCH` a `/api/v1/pedidos/{id}/estado` e invalidando/actualizando el caché.

### Componentes Críticos
- `ChefDashboard.jsx`: Layout Grid para las dos columnas, manejando la reconexión al socket mediante el hook custom `useKitchenSocket`. Si se pierde el WS, pasará a modo *Polling* haciendo un refetch manual del `useQuery` cada 30 segundos (RN-CO08).
- `OrderCard.jsx`: Un componente presentacional puro. Recibirá `createdAt` como prop e implementará un `setInterval` propio encapsulado en `<UrgencyTimer />` para recalcular colores.
