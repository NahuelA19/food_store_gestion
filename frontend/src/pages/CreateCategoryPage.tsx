/**
 * CreateCategoryPage — Admin form to create a new category
 *
 * Architecture:
 * - Uses TanStack Query (useMutation) for the POST request — server state
 * - Uses React useState for local form state
 * - On success: invalidates categories query cache + redirects to /
 * - On error: displays inline error message with server feedback
 * - On conflict (409): shows specific message for duplicate name
 *
 * Security: The backend validates ADMIN role via require_role.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/productApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  ArrowLeft,
  FolderPlus,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

/* ─── Inline Textarea component ─── */

interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}

function Textarea({ label, value, onChange, error, placeholder, rows = 3 }: TextareaProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-text-primary"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`flex w-full rounded-lg border-2 bg-surface-card px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200 placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 ${
          error
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
            : "border-border hover:border-brand-300 focus-visible:border-brand-500"
        }`}
      />
      {error && (
        <p className="text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

/* ─── Page Component ─── */

export function CreateCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      productApi.createCategory(data),
    onSuccess: () => {
      // Invalidate categories query so the list reflects the new category
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Redirect to dashboard
      navigate("/");
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Category name is required";
    } else if (name.trim().length > 255) {
      newErrors.name = "Name must be 255 characters or less";
    }

    if (description && description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* Back navigation */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-6"
      >
        <Icon icon={ArrowLeft} size={16} />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <Icon icon={FolderPlus} size={20} />
            </div>
            <div>
              <CardTitle>New Category</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                Create a new category to organize your products
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <Input
              label="Category Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="e.g. Bakery, Dairy, Beverages"
              maxLength={255}
              autoFocus
            />

            {/* Description */}
            <Textarea
              label="Description"
              value={description}
              onChange={setDescription}
              error={errors.description}
              placeholder="A brief description of this category..."
            />

            {/* Mutation error */}
            {mutation.isError && (
              <div className="rounded-lg border border-danger/20 bg-danger-bg p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={AlertTriangle} size={18} className="mt-0.5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-semibold text-danger-text">
                      Failed to create category
                    </p>
                    <p className="text-sm text-danger-text/80 mt-0.5">
                      {mutation.error instanceof Error
                        ? mutation.error.message
                        : "An unexpected error occurred. Please try again."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success feedback */}
            {mutation.isSuccess && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <div className="flex items-start gap-3">
                  <Icon icon={CheckCircle} size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Category created successfully!
                    </p>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                      Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="gap-2"
              >
                {mutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon icon={Save} size={16} />
                )}
                {mutation.isPending ? "Creating..." : "Create Category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
