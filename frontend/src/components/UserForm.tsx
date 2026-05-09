import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { User } from "lucide-react";

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

    if (
      formData.first_name &&
      (formData.first_name.length < 1 || formData.first_name.length > 50)
    ) {
      newErrors.first_name = "First name must be 1-50 characters";
    }

    if (
      formData.last_name &&
      (formData.last_name.length < 1 || formData.last_name.length > 50)
    ) {
      newErrors.last_name = "Last name must be 1-50 characters";
    }

    if (formData.phone) {
      if (formData.phone.length < 7 || formData.phone.length > 20) {
        newErrors.phone = "Phone must be 7-20 characters";
      }
      const phoneRegex = /^\+?[0-9\-()\s]{7,20}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone =
          "Phone must contain only +, -, (), space, and digits";
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        type="email"
        value={user.email}
        disabled
      />

      <Input
        label="First Name"
        type="text"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter your first name"
        maxLength={50}
        error={errors.first_name}
      />

      <Input
        label="Last Name"
        type="text"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter your last name"
        maxLength={50}
        error={errors.last_name}
      />

      <Input
        label="Phone"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter your phone number"
        maxLength={20}
        error={errors.phone}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        <Icon icon={User} />
        {isLoading ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}
