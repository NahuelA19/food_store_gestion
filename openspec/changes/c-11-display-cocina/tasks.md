# Implementation Tasks: C-11-display-cocina

## 1. Setup Base de Datos y Endpoints Base
- [x] 1.1 Insertar el rol `COCINA` en `seed_roles` (`backend/database/seeds.py`).
- [x] 1.2 Crear usuario de prueba para cocina (`chef@foodstore.com`).
- [x] 1.3 Crear el router base `backend/app/api/v1/cocina.py`.
- [x] 1.4 Configurar ruta REST `GET /api/v1/cocina/pedidos` con protección de rol `COCINA`, que liste pedidos en estado `CONFIRMADO` o `EN_PREP`.
- [x] **Verificación:** Confirmar que el endpoint use prefijo `/api/v1` y devuelva datos ordenados por antigüedad.

## 2. Lógica FSM y Eventos WebSockets
- [x] 2.1 Implementar `ConnectionManager` en `backend/app/services/websocket_manager.py` (métodos `connect`, `disconnect`, `broadcast`).
- [x] 2.2 Agregar endpoint `WS /api/v1/cocina/ws` para conectar cocineros (validación de JWT requerida).
- [x] 2.3 Modificar `pedido_service.py` para bloquear avances no permitidos por la cocina (RN-CO03).
- [x] 2.4 Inyectar `websocket_manager.broadcast()` dentro de los servicios de pedido (posterior al éxito en UoW) para disparar los eventos `PEDIDO_CONFIRMADO`, `PEDIDO_EN_PREPARACION`, y `PEDIDO_EN_CAMINO`.
- [x] 2.5 Integrar `websocket_manager` en routers vía `app.state` y FastAPI `Depends()` — actualizar `cancel_order()` y `update_order_status()` para aceptar el manager.
- [x] **Verificación:** Confirmar que no hay `db.commit()` directo en ningún service. Todos los cambios al FSM deben pasar por el `UnitOfWork`.

## 3. Frontend: Hooks, Estado y Polling
- [x] 3.1 Instalar e implementar interfaz de conexión WebSocket vía un hook custom `useKitchenSocket.js`.
- [x] 3.2 Enganchar `useKitchenSocket` con **TanStack Query** usando `queryClient.setQueryData` (para mutar el caché local ante la llegada de `PEDIDO_CONFIRMADO` u otros eventos).
- [x] 3.3 Implementar estrategia de Fallback en el hook: si la conexión falla, iniciar Polling cada 30 segundos sobre `GET /api/v1/cocina/pedidos`.
- [x] **Verificación:** "Implementar con useQuery/useMutation de TanStack Query", verificando que la data del servidor no viva en un store Zustand aislado.

## 4. Frontend: UI Dashboard
- [x] 4.1 Crear `ChefDashboard.jsx` con Layout Kanban. Aislar esta vista del auto-logout inactivo si corresponde.
- [x] 4.2 Crear `OrderCard.jsx` e implementar el componente `UrgencyTimer` (actualización cada 15 segundos con colores indicativos).
- [x] 4.3 Incorporar botones "Iniciar Preparación" y "Despachar" con `useMutation` para pegarle al PATCH de avance de estado.
- [ ] 4.4 Opcional: Implementar Alertas Sonoras (Web Audio API) y almacenar preferencia `ON/OFF` usando store Zustand con `persist`. *(Postergado - baja prioridad)*

## 5. Verificación Final
- [x] 5.1 Tests unitarios KDS: 23/23 tests pasando (15 pre-existentes + 8 nuevos de FSM + Broadcast)
- [ ] ~~5.2 Entrar al KDS con el usuario chef (requiere PostgreSQL + Docker — bloqueado por WinError 64)~~
- [ ] ~~5.3 Realizar un pago simulado por MercadoPago (webhook) y comprobar que la orden salte a la pantalla instantáneamente~~
- [ ] ~~5.4 Mover la tarjeta hasta estado `EN_CAMINO` y verificar que desaparezca~~
- [ ] ~~5.5 Verificar cumplimiento con `docs/` (requiere E2E con PostgreSQL)~~
