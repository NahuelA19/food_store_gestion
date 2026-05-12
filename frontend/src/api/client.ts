/**
 * Axios HTTP client with JWT interceptors.
 *
 * - Request interceptor: attaches Bearer token from authStore
 * - Response interceptor: on 401, attempts token refresh and retries once
 *
 * Usage:
 *   import { api } from "../api/client";
 *   const products = await api.get("/products/").then(r => r.data);
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach Bearer token ──────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 ─────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401 errors that aren't already retries
    // and aren't auth endpoints themselves (avoid infinite loops)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newAccess = data.access_token as string;
      const newRefresh = data.refresh_token as string;

      // Update Zustand store with new token pair (preserve current user)
      const currentUser = useAuthStore.getState().user;
      useAuthStore.getState().setAuth(currentUser!, newAccess, newRefresh);

      processQueue(null, newAccess);

      // Retry original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Clear auth — force re-login
      useAuthStore.getState().clearAuth();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
