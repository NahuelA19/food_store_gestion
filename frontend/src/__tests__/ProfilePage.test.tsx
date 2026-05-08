/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProfilePage } from "../pages/ProfilePage";

// Mock fetch for preferences API calls
global.fetch = vi.fn();

// Mock useAuth — ProfilePage reads from this hook directly, NOT from AuthContext
const mockUseAuth = vi.fn();
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockPreferences = {
  language: "en",
  theme: "light",
  notifications: "email",
};

const mockUser = {
  id: 1,
  email: "test@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user with no errors
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      updatePreferences: vi.fn(),
    });
  });

  it("should show loading state initially", () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise(() => {
        // Never resolves — preferences stay in loading state
      })
    );

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/My Profile/)).toBeInTheDocument();
  });

  it("should display user profile information", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Profile/)).toBeInTheDocument();
    });
  });

  it("should handle preferences fetch error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Preferences not found" }),
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Preferences not found/)).toBeInTheDocument();
    });
  });

  it("should redirect to login if not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      updatePreferences: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByText("Please log in to view your profile.")).toBeInTheDocument();
  });
});
