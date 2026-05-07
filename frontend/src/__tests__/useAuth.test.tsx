/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../hooks/useAuth";

global.fetch = vi.fn();

const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjogMSwgImVtYWlsIjogInRlc3RAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("useAuth hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  it("should initialize with null user when no token", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should restore user from token in localStorage", () => {
    localStorage.getItem.mockReturnValue(mockToken);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual({
      id: 1,
      email: "test@example.com",
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should login successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: "test@example.com",
        access_token: mockToken,
        token_type: "bearer",
      }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("test@example.com", "password");
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: "test@example.com",
    });
    expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", mockToken);
  });

  it("should handle login error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid credentials" }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login("test@example.com", "wrong-password");
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBe("Invalid credentials");
    expect(result.current.user).toBeNull();
  });

  it("should register successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: "newuser@example.com",
        access_token: mockToken,
        token_type: "bearer",
      }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register("newuser@example.com", "password");
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: "newuser@example.com",
    });
    expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", mockToken);
  });

  it("should logout successfully", async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth_token");
  });

  it("should update profile successfully", async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: "test@example.com",
        first_name: "Jane",
        last_name: "Doe",
        phone: "+1234567890",
      }),
    });

    const { result } = renderHook(() => useAuth());

    // Wait for initialization
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

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
      phone: "+1234567890",
    });
  });

  it("should handle profile update error", async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid phone format" }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      try {
        await result.current.updateProfile({
          phone: "invalid",
        });
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBe("Invalid phone format");
  });

  it("should update preferences successfully", async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          email: "test@example.com",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          language: "es",
          theme: "dark",
          notifications: "push",
        }),
      });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      await result.current.updatePreferences({
        language: "es",
        theme: "dark",
        notifications: "push",
      });
    });

    expect(result.current.error).toBeNull();
  });

  it("should handle preferences update error", async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid theme value" }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      try {
        await result.current.updatePreferences({
          theme: "invalid",
        });
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBe("Invalid theme value");
  });
});
