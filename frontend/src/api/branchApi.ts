import type { Branch, BranchListResponse, CreateBranchPayload, UpdateBranchPayload } from "../types/branch";

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

export const branchApi = {
  async getBranches(): Promise<BranchListResponse> {
    const response = await fetch(`${API_BASE_URL}/branches/`);
    if (!response.ok) throw new Error("Failed to fetch branches");
    return response.json();
  },

  async getBranch(id: number): Promise<Branch> {
    const response = await fetch(`${API_BASE_URL}/branches/${id}`);
    if (!response.ok) throw new Error("Failed to fetch branch");
    return response.json();
  },

  async createBranch(payload: CreateBranchPayload): Promise<Branch> {
    const response = await fetch(`${API_BASE_URL}/branches/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Branch>(response);
  },

  async updateBranch(id: number, payload: UpdateBranchPayload): Promise<Branch> {
    const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Branch>(response);
  },

  async deleteBranch(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
  },

  async toggleBranchStatus(id: number): Promise<Branch> {
    const response = await fetch(`${API_BASE_URL}/branches/${id}/toggle`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Branch>(response);
  },
};
