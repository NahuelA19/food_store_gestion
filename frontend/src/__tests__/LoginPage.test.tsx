/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any) = vi.fn();
  });

  it("renders login form with email and password inputs", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { name: /food store/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("has a link to the registration page", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("link", { name: /registrate gratis/i })).toHaveAttribute("href", "/register");
  });

  it("calls login with correct credentials on submit", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, email: "test@example.com", access_token: "token", token_type: "bearer" }),
    });

    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText("Correo electrónico");
    const passwordInput = screen.getByLabelText("Contraseña");

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("displays error message when login fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Credenciales incorrectas" }),
    });

    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText("Correo electrónico");
    const passwordInput = screen.getByLabelText("Contraseña");

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText("Credenciales incorrectas")).toBeInTheDocument();
    });
  });

  it("shows loading state while login is in progress", async () => {
    (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));
    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText("Correo electrónico");
    const passwordInput = screen.getByLabelText("Contraseña");

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "secret123");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /ingresando.../i })).toBeDisabled();
    });
  });

  it("form fields are required", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText("Correo electrónico");
    const passwordInput = screen.getByLabelText("Contraseña");

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("email input has correct type", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("type", "email");
  });

  it("password input has correct type", () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
  });
});
