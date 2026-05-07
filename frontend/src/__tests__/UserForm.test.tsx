import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserForm } from "../components/UserForm";

const mockUser = {
  id: 1,
  email: "test@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890",
};

describe("UserForm", () => {
  it("should render form with user data", () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+1234567890")).toBeInTheDocument();
  });

  it("should display disabled email field", () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const emailInput = screen.getByDisplayValue("test@example.com") as HTMLInputElement;
    expect(emailInput.disabled).toBe(true);
  });

  it("should validate phone format", async () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const phoneInput = screen.getByDisplayValue("+1234567890") as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "inv" } }); // Only 3 chars - fails length check

    const submitButton = screen.getByText("Update Profile");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Phone must be 7-20 characters/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should validate first name length", async () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const firstNameInput = screen.getByDisplayValue("John") as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: "" } });

    const lastNameInput = screen.getByDisplayValue("Doe") as HTMLInputElement;
    fireEvent.change(lastNameInput, { target: { value: "" } });

    const phoneInput = screen.getByDisplayValue("+1234567890") as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "" } });

    const submitButton = screen.getByText("Update Profile");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should call onSubmit with changed fields only", async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const firstNameInput = screen.getByDisplayValue("John") as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: "Jane" } });

    const submitButton = screen.getByText("Update Profile");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        first_name: "Jane",
      });
    });
  });

  it("should show loading state", () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={true} />
    );

    const submitButton = screen.getByText("Updating...") as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it("should clear error on field change", async () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const phoneInput = screen.getByDisplayValue("+1234567890") as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "invalid" } });

    const submitButton = screen.getByText("Update Profile");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Phone must contain only/)).toBeInTheDocument();
    });

    fireEvent.change(phoneInput, { target: { value: "+1 (234) 567-890" } });

    await waitFor(() => {
      expect(screen.queryByText(/Phone must contain only/)).not.toBeInTheDocument();
    });
  });

  it("should not submit if no changes made", async () => {
    const mockOnSubmit = vi.fn();

    render(
      <UserForm user={mockUser} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const submitButton = screen.getByText("Update Profile");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
