/**
 * Kitchen Display System (KDS) types.
 * Implements RN-CO01, RN-CO02, RN-CO05, RN-CO06.
 */

export interface KitchenOrderItem {
  id: number;
  nombre_snapshot: string;
  cantidad: number;
  precio_snapshot: number;
}

export interface KitchenOrder {
  id: number;
  estado_codigo: string; // "CONFIRMADO", "EN_PREP", etc.
  notas: string;
  items: KitchenOrderItem[];
  kitchen_entry_at: string; // ISO timestamp when order entered kitchen queue
}

export interface KitchenOrderListResponse {
  items: KitchenOrder[];
  total: number;
}

/**
 * WebSocket event types emitted from backend to KDS clients.
 * Implements RN-CO05, RN-CO06.
 */
export type KDSEventType =
  | "PEDIDO_CONFIRMADO"
  | "PEDIDO_EN_PREPARACION"
  | "PEDIDO_EN_CAMINO"
  | "PEDIDO_CANCELADO";

export interface KDSEvent {
  event: KDSEventType;
  order_id: number;
  estado_codigo: string;
  timestamp: string; // ISO timestamp
}
