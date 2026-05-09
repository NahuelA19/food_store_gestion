import type { OrderDetail, OrderListResponse, OrderStatus } from "../types/order";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
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

export const orderApi = {
  async getOrders(page = 1, status?: string): Promise<OrderListResponse> {
    const params = new URLSearchParams({ page: String(page) });
    if (status && status !== "all") params.append("status", status);

    const response = await fetch(`${API_BASE_URL}/admin/orders?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderListResponse>(response);
  },

  async getOrder(id: number): Promise<OrderDetail> {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderDetail>(response);
  },

  async updateOrderStatus(id: number, status: OrderStatus): Promise<OrderDetail> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<OrderDetail>(response);
  },
};
