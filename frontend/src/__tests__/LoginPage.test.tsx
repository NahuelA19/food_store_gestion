import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "../pages/LoginPage";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any) = vi.fn();
  });

  it("renders login form with email and password inputs", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("has a link to the registration page", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute("href", "/register");
  });

  it("calls login with correct credentials on submit", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, email: "test@example.com", access_token: "token", token_type: "bearer" }),
    });

    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("displays error message when login fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid credentials" }),
    });

    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows loading state while login is in progress", async () => {
    (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));
    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "secret123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in\.\.\./i })).toBeDisabled();
    });
  });

  it("form fields are required", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("email input has correct type", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
  });

  it("password input has correct type", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
  });
});
