/**
 * useKitchenSocket: Custom hook for Kitchen Display System (KDS).
 *
 * Implements RN-CO05, RN-CO06: Real-time order updates via WebSocket + fallback polling.
 *
 * Features:
 * 1. WebSocket connection to /api/v1/cocina/ws
 * 2. Listen for events: PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION, PEDIDO_EN_CAMINO, PEDIDO_CANCELADO
 * 3. Mutate TanStack Query cache on event via queryClient.setQueryData()
 * 4. Fallback: auto-reconnect on disconnect, polling every 30s if WS fails
 * 5. Manual refetch via exposed refetch() function
 *
 * Usage:
 *   const kitchen = useKitchenSocket();
 *   - kitchen.orders: KitchenOrder[] (from TanStack Query cache)
 *   - kitchen.isLoading: boolean
 *   - kitchen.isConnected: boolean (WebSocket status)
 *   - kitchen.error: string | null
 *   - kitchen.refetch: () => Promise<void> (manual refetch)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { kitchenApi } from "../api/kitchenApi";
import type { KitchenOrder, KDSEvent, KitchenOrderListResponse } from "../types/kitchen";

const QUERY_KEY = ["kitchenOrders"];
const POLLING_INTERVAL_MS = 30000; // 30 seconds fallback polling
const WS_RECONNECT_DELAY_MS = 3000; // 3 seconds before reconnect attempt

interface UseKitchenSocketReturn {
  orders: KitchenOrder[];
  total: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  newOrderSignal: number;
}

export function useKitchenSocket(): UseKitchenSocketReturn {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newOrderSignal, setNewOrderSignal] = useState(0);

  // Fetch kitchen orders via TanStack Query
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => kitchenApi.getKitchenOrders(),
    // Polling fallback: if WS is down, refetch every 30s
    refetchInterval: (data, query) => {
      // If WebSocket is connected, don't poll; rely on push events instead
      if (isConnected) {
        return false;
      }
      // If WS is disconnected, poll every 30s to stay in sync
      return POLLING_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
  });

  /**
   * Handle WebSocket events: PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION, etc.
   * Update TanStack Query cache in real-time (RN-CO05, RN-CO06).
   */
  const handleWSEvent = useCallback(
    (event: KDSEvent) => {
      const currentData = queryClient.getQueryData<KitchenOrderListResponse>(QUERY_KEY);
      if (!currentData) return;

      // Find and update/remove order based on event type
      let updatedItems = [...currentData.items];

      switch (event.event) {
        case "PEDIDO_CONFIRMADO": {
          // If order is not in the list, add a minimal placeholder
          const exists = updatedItems.some((o) => o.id === event.order_id);
          if (!exists) {
            updatedItems = [
              ...updatedItems,
              { id: event.order_id, estado_codigo: "CONFIRMADO" } as KitchenOrder,
            ];
          } else {
            updatedItems = updatedItems.map((order) =>
              order.id === event.order_id
                ? { ...order, estado_codigo: "CONFIRMADO" }
                : order
            );
          }
          setNewOrderSignal((s) => s + 1);
          break;
        }

        case "PEDIDO_EN_PREPARACION":
          // Order is now being prepared
          updatedItems = updatedItems.map((order) =>
            order.id === event.order_id
              ? { ...order, estado_codigo: "EN_PREP" }
              : order
          );
          break;

        case "PEDIDO_EN_CAMINO":
          // Order is out for delivery — remove from kitchen display
          updatedItems = updatedItems.filter((order) => order.id !== event.order_id);
          break;

        case "PEDIDO_CANCELADO":
          // Order is cancelled — remove from kitchen display
          updatedItems = updatedItems.filter((order) => order.id !== event.order_id);
          break;
      }

      // Update cache
      queryClient.setQueryData<KitchenOrderListResponse>(QUERY_KEY, {
        ...currentData,
        items: updatedItems,
        total: updatedItems.length,
      });
    },
    [queryClient]
  );

  /**
   * Connect to WebSocket and set up event listeners.
   * Auto-reconnect on disconnect with exponential backoff.
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = kitchenApi.connectKDS();

      ws.onopen = () => {
        console.log("[KDS] WebSocket connected");
        setIsConnected(true);
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const kdsEvent: KDSEvent = JSON.parse(event.data);
          console.log("[KDS] Received event:", kdsEvent);
          handleWSEvent(kdsEvent);
        } catch (err) {
          console.error("[KDS] Failed to parse WebSocket event:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[KDS] WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[KDS] WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[KDS] Attempting to reconnect...");
          connectWebSocket();
        }, WS_RECONNECT_DELAY_MS);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[KDS] Failed to connect WebSocket:", error);
      setIsConnected(false);

      // Retry connection
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[KDS] Retrying connection...");
        connectWebSocket();
      }, WS_RECONNECT_DELAY_MS);
    }
  }, [handleWSEvent]);

  /**
   * Lifecycle: connect on mount, cleanup on unmount.
   */
  useEffect(() => {
    connectWebSocket();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  /**
   * Manual refetch (e.g., after error, or user triggers refresh).
   */
  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    orders: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isConnected,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch kitchen orders"
      : null,
    refetch,
    newOrderSignal,
  };
}
