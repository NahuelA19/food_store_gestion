import { useState } from "react";

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface UserFormProps {
  user: User;
  onSubmit: (profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function UserForm({ user, onSubmit, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone: user.phone || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field on change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.first_name && (formData.first_name.length < 1 || formData.first_name.length > 50)) {
      newErrors.first_name = "First name must be 1-50 characters";
    }

    if (formData.last_name && (formData.last_name.length < 1 || formData.last_name.length > 50)) {
      newErrors.last_name = "Last name must be 1-50 characters";
    }

    if (formData.phone) {
      if (formData.phone.length < 7 || formData.phone.length > 20) {
        newErrors.phone = "Phone must be 7-20 characters";
      }
      // Simple phone format validation
      const phoneRegex = /^\+?[0-9\-\(\)\s]{7,20}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Phone must contain only +, -, (), space, and digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const changes: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    } = {};

    if (formData.first_name !== (user.first_name || "")) {
      changes.first_name = formData.first_name;
    }
    if (formData.last_name !== (user.last_name || "")) {
      changes.last_name = formData.last_name;
    }
    if (formData.phone !== (user.phone || "")) {
      changes.phone = formData.phone;
    }

    if (Object.keys(changes).length > 0) {
      await onSubmit(changes);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="user-form">
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={user.email}
          disabled
          className="input-disabled"
        />
      </div>

      <div className="form-group">
        <label htmlFor="first_name">First Name:</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter your first name"
          maxLength={50}
        />
        {errors.first_name && <span className="error-text">{errors.first_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="last_name">Last Name:</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter your last name"
          maxLength={50}
        />
        {errors.last_name && <span className="error-text">{errors.last_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone:</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter your phone number"
          maxLength={20}
        />
        {errors.phone && <span className="error-text">{errors.phone}</span>}
      </div>

      <button type="submit" disabled={isLoading} className="submit-button">
        {isLoading ? "Updating..." : "Update Profile"}
      </button>
    </form>
  );
}
