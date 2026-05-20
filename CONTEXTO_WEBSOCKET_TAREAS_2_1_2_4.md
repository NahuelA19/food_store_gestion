# CONTEXTO DETALLADO PARA TAREAS 2.1-2.4: WebSocket + Eventos

## Estado Actual (después de Fase 1)
- ✅ Rol COCINA creado en seeds
- ✅ Usuario cocina@foodstore.com creado
- ✅ Endpoint GET /api/v1/cocina/pedidos implementado
- ✅ Router registrado en main.py

---

## TAREA 2.1: ConnectionManager (Pub/Sub en memoria)

**Archivo a crear:** `backend/app/services/websocket_manager.py`

**Responsabilidad:** Gestor de conexiones WebSocket (Pub/Sub en proceso)

**Implementación requerida:**

```python
# ConnectionManager debe tener:
# 1. __init__() — inicializar set de conexiones activas
# 2. connect(websocket: WebSocket) — registrar una conexión
# 3. disconnect(websocket: WebSocket) — desregistrar
# 4. broadcast(message: dict) — enviar a TODAS las conexiones activas

# Notas:
# - Usar asyncio.Lock para thread-safety en el set de conexiones
# - message es un dict con:
#   {
#     "event": "PEDIDO_CONFIRMADO" | "PEDIDO_EN_PREPARACION" | "PEDIDO_EN_CAMINO" | "PEDIDO_CANCELADO",
#     "order_id": int,
#     "estado_codigo": str,
#     "timestamp": datetime.isoformat(),
#     [data adicional según event]
#   }
# - No guardar eventos perdidos (v1 single-instance)
# - Si falla enviar a una conexión, removerla del set (cleanup automático)
```

**Tests requeridos:**
- connect/disconnect sin errores
- broadcast llega a todas las conexiones
- broadcast maneja conexiones cerradas sin crashes

---

## TAREA 2.2: Endpoint WebSocket

**Archivo a modificar:** `backend/app/routes/cocina.py`

**Agregar:** Endpoint WebSocket `WS /api/v1/cocina/ws`

**Especificación:**

```python
@router.websocket("/ws")
async def websocket_kitchen_display(
    websocket: WebSocket,
    token: str = Query(...),  # JWT en query params
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    """
    WebSocket endpoint para el KDS.
    
    Flujo:
    1. Extraer y validar JWT del query param token=<JWT>
    2. Verificar que usuario tiene rol COCINA/PEDIDOS/ADMIN
    3. await websocket.accept()
    4. manager.connect(websocket)
    5. Loop infinito: await websocket.receive_text() (mantener vivo)
    6. En disconnect: manager.disconnect(websocket)
    """
```

**Detalles técnicos:**

```python
# Validación de JWT:
# - Usar el mismo método que en auth.py (decode_token)
# - Si token inválido/expirado → websocket.close(code=1008, reason="Unauthorized")
# - Si rol insuficiente → websocket.close(code=1008)

# El WebSocket es pasivo (solo recibe broadcast, no envía pedidos)
# Mantener la conexión abierta con un try/except
# En disconnect: manager.disconnect(websocket)
```

---

## TAREA 2.3: Validación FSM en order_service.py

**Archivo a modificar:** `backend/app/services/order_service.py`

**Qué cambiar:** Función `transition()` (líneas 70-106)

**Agregar RN-CO03 (validación de rol por transición):**

```python
# En la función transition(), agregar un parámetro:
# usuario_rol: str | None = None

# Luego, ANTES de la validación de FSM (antes de línea 84):

# RN-CO03: El rol COCINA solo puede hacer: CONFIRMADO→EN_PREP, EN_PREP→EN_CAMINO
if usuario_rol == "COCINA":
    allowed_transitions = {
        "CONFIRMADO": ["EN_PREP"],
        "EN_PREP": ["EN_CAMINO"],
    }
    validos = allowed_transitions.get(order.estado_codigo, [])
    if nuevo_estado not in validos:
        raise HTTPException(
            status_code=403,
            detail=f"Cocinero no puede hacer transición {order.estado_codigo} → {nuevo_estado}"
        )
    # Si pasó validación de COCINA, continuar sin validar FSM_TRANSITIONS
else:
    # Para otros roles (PEDIDOS, ADMIN), validar contra FSM_TRANSITIONS como siempre
    validos = FSM_TRANSITIONS.get(order.estado_codigo, [])
    if nuevo_estado not in validos:
        raise HTTPException(...)
```

**Regla importante:**
- NO modificar el FSM_TRANSITIONS (sigue igual para PEDIDOS y ADMIN)
- Solo agregar lógica de filtrado ANTES de la validación existente

---

## TAREA 2.4: Inyectar broadcast() en servicios

**Archivo a modificar:** `backend/app/services/order_service.py`

**Qué cambiar:** Agregar broadcast en las funciones que hacen transiciones de estado

**Dónde:**

1. **En `transition()` (línea 70-106):**
   - Después de que el historial se agrega a la sesión (línea 101)
   - Agregar parámetro `websocket_manager: ConnectionManager | None = None`
   - Después del éxito, hacer:

```python
if websocket_manager:
    await websocket_manager.broadcast({
        "event": "PEDIDO_CONFIRMADO" if nuevo_estado == "CONFIRMADO" 
                 else "PEDIDO_EN_PREPARACION" if nuevo_estado == "EN_PREP"
                 else "PEDIDO_EN_CAMINO" if nuevo_estado == "EN_CAMINO"
                 else "PEDIDO_CANCELADO" if nuevo_estado == "CANCELADO"
                 else None,
        "order_id": order.id,
        "estado_codigo": nuevo_estado,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
```

2. **En `update_order_status()` (busca dónde llama a `transition()`):**
   - Pasar el `websocket_manager` a `transition()`

3. **En `create_order_from_cart()` (si existe transición inicial):**
   - Pasar `websocket_manager` si es aplicable

**Criterio importante:**
- El broadcast() SIEMPRE se hace DESPUÉS del commit de UnitOfWork
- NO hacer broadcast si falla la transición (excepción lanzada)
- El websocket_manager puede ser None (para backward compatibility)

---

## RUTAS DE INTEGRACIÓN EN MAIN.PY Y ROUTES

**1. En main.py (lifespan):**
```python
# Dentro de la función lifespan():
app.state.websocket_manager = ConnectionManager()  # Al startup
# No necesita cleanup especial (garbage collection)
```

**2. En routes/orders.py (endpoint de transición):**
```python
# Buscar el endpoint PATCH que hace update_order_status
# Agregar dependencia:
websocket_manager: ConnectionManager = Depends(lambda: get_app().state.websocket_manager)

# Pasar a update_order_status():
await update_order_status(..., websocket_manager=websocket_manager)
```

---

## EVENTOS A EMITIR (según RN-CO05, RN-CO06)

| Evento | Triggered by | Payload |
|--------|--------------|---------|
| PEDIDO_CONFIRMADO | `PENDIENTE → CONFIRMADO` (webhook MercadoPago) | `{order_id, estado_codigo: "CONFIRMADO", timestamp}` |
| PEDIDO_EN_PREPARACION | `CONFIRMADO → EN_PREP` (cocina toma pedido) | `{order_id, estado_codigo: "EN_PREP", timestamp}` |
| PEDIDO_EN_CAMINO | `EN_PREP → EN_CAMINO` (cocina marca listo) | `{order_id, estado_codigo: "EN_CAMINO", timestamp}` |
| PEDIDO_CANCELADO | `* → CANCELADO` (cancelación en cualquier estado) | `{order_id, estado_codigo: "CANCELADO", timestamp}` |

---

## IMPORTS NECESARIOS

```python
# websocket_manager.py
from fastapi import WebSocket
import asyncio
import logging

# routes/cocina.py
from fastapi import WebSocket, Query, WebSocketDisconnect
from app.services.websocket_manager import ConnectionManager
from app.security.token import decode_token  # ← para validar JWT

# order_service.py
from app.services.websocket_manager import ConnectionManager
```

---

## VERIFICACIÓN FINAL (Tarea 2.5)

- ✅ No hay `db.commit()` directo en ningún service (todo vía UnitOfWork)
- ✅ El broadcast() se llama DESPUÉS del éxito de la transición
- ✅ El WebSocket cierra correctamente si JWT es inválido
- ✅ ConnectionManager maneja desconexiones sin crashes
- ✅ RN-CO03 está implementada (cocinero solo puede hacer 2 transiciones específicas)

---

## ESTRUCTURA DE CARPETAS FINAL DESPUÉS DE 2.1-2.4

```
backend/
├── app/
│   ├── routes/
│   │   └── cocina.py          ← MODIFICADO: agregar endpoint WS
│   ├── services/
│   │   ├── websocket_manager.py  ← NUEVO
│   │   └── order_service.py      ← MODIFICADO: transition() + broadcast()
│   └── main.py                ← MODIFICADO: app.state.websocket_manager
```

---

## TESTING STRATEGY

Use `TestClient` de FastAPI para WebSocket (testing local):

```python
# test_websocket.py
from starlette.testclient import TestClient
from app.main import app

def test_websocket_connection():
    with TestClient(app) as client:
        with client.websocket_connect("/api/v1/cocina/ws?token=<valid_jwt>") as ws:
            # Verificar que se conecta
            # Enviar broadcast desde otro thread
            # Verificar que llega el mensaje
            pass
```

Para testing real (multiconexión), usar `asyncio` + `websockets` library.

---

## GIT COMMITS DESPUÉS DE 2.1-2.4

Serán commits SEPARADOS:
1. `feat(cocina): add websocket manager for real-time KDS` — 2.1
2. `feat(cocina): add websocket endpoint with JWT validation` — 2.2
3. `fix(orders): add role-based FSM validation (RN-CO03)` — 2.3
4. `feat(orders): broadcast events to kitchen display` — 2.4

---

## NOTAS IMPORTANTES

- **v1 single-instance:** El pub/sub está EN PROCESO. No usa Redis.
- **No persiste eventos:** Si nadie está conectado cuando ocurre un evento, se pierde.
- **JWT en query params:** Porque WebSocket no permite headers personalizados en handshake (limitación de navegadores).
- **Cleanup automático:** Si una conexión falla durante broadcast, se desconecta automáticamente.
- **Backward compatibility:** Los servicios siguen funcionando sin `websocket_manager` (None es válido).

