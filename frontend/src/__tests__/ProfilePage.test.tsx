import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ProfilePage } from "../pages/ProfilePage";

// Mock fetch
global.fetch = vi.fn();

const mockUser = {
  id: 1,
  email: "test@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890",
};

const mockPreferences = {
  language: "en",
  theme: "light",
  notifications: "email",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue("fake-token");
  });

  it("should show loading state initially", () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise(() => {
        // Never resolves
      })
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("My Profile")).toBeInTheDocument();
  });

  it("should display user profile information", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Profile")).toBeInTheDocument();
    });
  });

  it("should handle preferences fetch error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Preferences not found" }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Preferences not found/)).toBeInTheDocument();
    });
  });

  it("should redirect to login if not authenticated", () => {
    localStorage.getItem.mockReturnValue(null);

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("Please log in to view your profile.")).toBeInTheDocument();
  });
});
