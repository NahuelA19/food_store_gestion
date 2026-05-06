// Custom hook for authentication logic.

import { useState, useCallback } from "react";

interface User {
  id: number;
  email: string;
}

interface AuthResponse {
  id: number;
  email: string;
  access_token: string;
  token_type: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "auth_token";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from localStorage on first load
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Try to verify token by calling a protected endpoint
      // For now, we'll just restore the user from token if we can decode it
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setUser({ id: payload.user_id, email: payload.email });
        }
      } catch {
        // Token is invalid, clear it
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setInitialized(true);
  }

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Login failed");
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser({ id: data.id, email: data.email });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser({ id: data.id, email: data.email });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
