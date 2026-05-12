/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAuth hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any) = vi.fn();
    useAuthStore.getState().clearAuth();
  });

  it("should login successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: "test@example.com",
        access_token:
          "header.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.signature",
        token_type: "bearer",
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login("test@example.com", "password");
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: "test@example.com",
      first_name: "",
      last_name: "",
      phone: "",
    });
  });

  it("should handle login error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid credentials" }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.login("test@example.com", "wrong-password");
      } catch {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid credentials");
    });
    expect(result.current.user).toBeNull();
  });

  it("should register successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: "newuser@example.com",
        access_token:
          "header.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6Im5ld3VzZXJAZXhhbXBsZS5jb20ifQ.signature",
        token_type: "bearer",
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.register("newuser@example.com", "password");
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: "newuser@example.com",
      first_name: "",
      last_name: "",
      phone: "",
    });
  });

  it("should logout successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should update profile successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: "test@example.com",
        first_name: "Jane",
        last_name: "Doe",
        role: "customer",
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.updateProfile({
        first_name: "Jane",
        last_name: "Doe",
        phone: "+1234567890",
      });
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: "test@example.com",
      first_name: "Jane",
      last_name: "Doe",
      phone: "",
    });
  });

  it("should handle profile update error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid phone format" }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.updateProfile({ phone: "invalid" });
      } catch {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid phone format");
    });
  });

  it("should update preferences successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ language: "es", theme: "dark", notifications: "push" }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.updatePreferences({
        language: "es",
        theme: "dark",
        notifications: "push",
      });
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it("should handle preferences update error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid theme value" }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.updatePreferences({ theme: "invalid" });
      } catch {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid theme value");
    });
  });
});
