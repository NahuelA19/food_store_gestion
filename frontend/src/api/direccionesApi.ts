/**
 * Direcciones API client
 */

export interface Direccion {
  id: number;
  usuario_id: number;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string | null;
}

export interface DireccionCreate {
  direccion: string;
  ciudad: string;
  provincia: string;
  codigo_postal?: string;
}

export interface DireccionUpdate {
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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

export const direccionesApi = {
  async list(): Promise<Direccion[]> {
    const response = await fetch(`${API_BASE_URL}/direcciones-entrega/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Direccion[]>(response);
  },

  async create(data: DireccionCreate): Promise<Direccion> {
    const response = await fetch(`${API_BASE_URL}/direcciones-entrega/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Direccion>(response);
  },

  async update(id: number, data: DireccionUpdate): Promise<Direccion> {
    const response = await fetch(`${API_BASE_URL}/direcciones-entrega/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Direccion>(response);
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/direcciones-entrega/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || "Failed to delete address");
    }
  },
};
