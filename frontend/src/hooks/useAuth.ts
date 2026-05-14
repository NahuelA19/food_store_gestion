import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): Record<string, string> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}

export function useAuth() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const user = data.user || {
        id: data.id,
        email: data.email,
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
        role: data.role ?? "",
      };
      useAuthStore.getState().setAuth(user, data.access_token, data.refresh_token ?? "");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const user = data.user || {
        id: data.id,
        email: data.email,
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
        role: data.role ?? "",
      };
      useAuthStore.getState().setAuth(user, data.access_token, data.refresh_token ?? "");
    },
  });

  const logout = useCallback(async () => {
    try {
      const { accessToken, refreshToken } = useAuthStore.getState();
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Silently fail — we clear local state regardless
    } finally {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    }
  }, [queryClient]);

  const updateProfile = useCallback(
    async (profile: { first_name?: string; last_name?: string; phone?: string }) => {
      setActionError(null);
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(profile),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Profile update failed");
        }
        const data = await res.json();
        useAuthStore.getState().setUser({
          id: data.id,
          email: data.email,
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          role: data.role ?? "",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Profile update failed";
        setActionError(msg);
        throw err;
      }
    },
    []
  );

  const updatePreferences = useCallback(
    async (preferences: { language?: string; theme?: string; notifications?: string }) => {
      setActionError(null);
      try {
        const res = await fetch(`${API_URL}/users/me/preferences`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(preferences),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Preferences update failed");
        }
        await res.json();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Preferences update failed";
        setActionError(msg);
        throw err;
      }
    },
    []
  );

  const mappedUser = useMemo(
    () =>
      user
        ? { id: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName, role: user.role, phone: "" }
        : null,
    [user],
  );

  return {
    user: mappedUser,
    isAuthenticated,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error:
      actionError ??
      (loginMutation.error
        ? loginMutation.error instanceof Error
          ? loginMutation.error.message
          : "Login failed"
        : registerMutation.error
          ? registerMutation.error instanceof Error
            ? registerMutation.error.message
            : "Registration failed"
          : null),
    login: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
    register: (email: string, password: string) => registerMutation.mutateAsync({ email, password }),
    logout,
    updateProfile,
    updatePreferences,
  };
}
