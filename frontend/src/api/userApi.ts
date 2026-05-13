import { useAuthStore } from "../store/authStore";

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

export interface AdminUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

interface UsersListResponse {
  users: AdminUser[];
  next_cursor: number | null;
}

export const userApi = {
  async getUsers(cursor?: number, limit = 50): Promise<UsersListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.append("cursor", String(cursor));

    const response = await fetch(`${API_BASE_URL}/users?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UsersListResponse>(response);
  },
};
