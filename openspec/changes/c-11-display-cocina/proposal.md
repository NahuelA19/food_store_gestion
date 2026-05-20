# Proposal: Kitchen Display System (KDS) y Rol Cocinero

## Descripción del Problema
Actualmente, Food Store no cuenta con un sistema o rol dedicado para la operación en la cocina. El avance del FSM de los pedidos de `CONFIRMADO` a `EN_PREP` y posteriormente a `EN_CAMINO` es ejecutado manualmente por un Gestor de Pedidos. Para agilizar la operación, es imperativo contar con un Kitchen Display System (KDS) que le permita a los cocineros visualizar en tiempo real los pedidos pendientes de preparación, tomarlos y despacharlos, actualizando los estados correspondientes sin necesidad de recargar la interfaz.

## Objetivo
Implementar la feature **Display de Cocina (KDS)** que incluirá:
1. El alta del rol operativo `COCINA`.
2. Una pantalla reactiva (React + Vite) usando Kanban ("Por preparar" y "En preparación") que actúe en tiempo real.
3. Un mecanismo push en el Backend (WebSocket en FastAPI) que notifique automáticamente cuando un pedido deba ingresar o salir del KDS.

## Cumplimiento TPI
- Se usará **UnitOfWork** en el servicio de avance de estado, no se usarán `db.commit()` directos.
- Se respetará el ERD v5, registrando cada avance de estado en la tabla catálogo `historial_estados_pedido` (append-only) para trazar qué usuario lo procesó.
- El KDS manejará su caché usando **TanStack Query** (nunca fetch + useEffect).
- Las llamadas de red y WebSockets usarán las rutas `/api/v1/`.

## Alcance
- **Sí incluye:** WebSockets en memoria (Pub/Sub simple), Timer de urgencia visual en KDS, Auth por JWT en WebSockets, Alerta sonora/visual base en KDS (opcional UI).
- **No incluye:** Modificar el esquema del FSM con estados nuevos (Ej. NO se agregará el estado `LISTO`). El cocinero despacha moviendo de `EN_PREP` a `EN_CAMINO` según las reglas `02_modelo_y_reglas.md`. No se implementará Redis externo en esta V1.

## Preguntas Abiertas
- La implementación usará WebSockets en memoria (Pub/Sub nativo en asyncio) para mantener el scope bajo como especificado en las reglas de dominio. ¿Es aceptable la restricción de que esto solo escalará en despliegues Single-Instance? (Decisión tomada: Sí, es aceptable para v1).
