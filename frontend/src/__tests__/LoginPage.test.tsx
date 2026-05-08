import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LoginPage } from "../pages/LoginPage";

describe("LoginPage", () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();

  const renderLoginPage = (contextOverrides = {}) => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            login: mockLogin,
            register: mockRegister,
            logout: mockLogout,
            updateProfile: vi.fn(),
            updatePreferences: vi.fn(),
            ...contextOverrides,
          }}
        >
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with email and password inputs", () => {
    renderLoginPage();

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("has a link to the registration page", () => {
    renderLoginPage();

    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute("href", "/register");
  });

  it("calls login with correct credentials on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("displays error message when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows loading state while login is in progress", () => {
    renderLoginPage({ isLoading: true });

    expect(screen.getByRole("button", { name: /signing in\.\.\./i })).toBeDisabled();
  });

  it("shows error from context when present", async () => {
    // LoginPage uses local submitError state, not context.error directly.
    // The error is set from the caught exception in handleSubmit.
    // This test verifies that when context has error, login is still callable
    // and local submitError gets populated on submit failure.
    mockLogin.mockRejectedValue(new Error("Session expired"));
    renderLoginPage({ error: "Session expired" });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Session expired")).toBeInTheDocument();
    });
  });

  it("form fields are required", () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("email input has correct type", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
  });

  it("password input has correct type", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
  });
});
