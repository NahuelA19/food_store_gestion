/**
 * Kitchen Display System (KDS) API client.
 * Interfaces with backend endpoints:
 * - GET /api/v1/cocina/pedidos — list orders in kitchen queue
 * - WS /api/v1/cocina/ws — WebSocket for real-time events (RN-CO05, RN-CO06)
 */

import { useAuthStore } from "../store/authStore";
import type { KitchenOrderListResponse } from "../types/kitchen";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const kitchenApi = {
  /**
   * Fetch orders in kitchen queue (CONFIRMADO or EN_PREP).
   * Implements RN-CO01: only orders in these states.
   * Implements RN-CO02: sorted by kitchen entry time (oldest first).
   */
  async getKitchenOrders(): Promise<KitchenOrderListResponse> {
    const response = await fetch(`${API_BASE_URL}/cocina/pedidos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<KitchenOrderListResponse>(response);
  },

  /**
   * Create WebSocket connection to KDS endpoint.
   * Token passed via query parameter (browser handshake limitation).
   * Backend validates JWT and restricts to COCINA, PEDIDOS, ADMIN roles.
   *
   * Returns: WebSocket instance
   * Throws: Error if token is missing or connection fails
   */
  connectKDS(): WebSocket {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      throw new Error("No authentication token available");
    }

    // Convert http(s) to ws(s)
    const wsBase = API_BASE_URL.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/cocina/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    return ws;
  },
};
