import type { DashboardStats } from "../types/dashboard";

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

export const dashboardApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(response);
  },
};
