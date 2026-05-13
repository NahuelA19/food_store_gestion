/**
 * CreateProductPage — Admin form to create a new product
 *
 * Architecture:
 * - Uses TanStack Query (useMutation) for the POST request — server state
 * - Uses useCategories hook (TanStack Query) to populate category dropdown
 * - Uses React useState for local form state
 * - On success: invalidates products query cache + redirects to /products
 * - On error: displays inline error message
 *
 * Security: The backend validates ADMIN role via require_role.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/productApi";
import { useCategories } from "../hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  ArrowLeft,
  Package,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

/* ─── Inline Select component (matching project UI patterns) ─── */

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

function Select({ label, value, onChange, options, error, placeholder }: SelectProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-text-primary"
      >
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex h-11 w-full rounded-lg border-2 bg-surface-card px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 ${
          error
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
            : "border-border hover:border-brand-300 focus-visible:border-brand-500"
        } disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-alt`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

/* ─── Inline Textarea component ─── */

interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}

function Textarea({ label, value, onChange, error, placeholder, rows = 4 }: TextareaProps) {
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

export function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories, isLoading: catsLoading, error: catsError } = useCategories();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [stockQuantity, setStockQuantity] = useState("");

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Handle image file selection and upload
  async function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError("Invalid file type. Allowed: JPG, PNG, WebP, GIF");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError("File too large. Maximum size is 5MB");
      return;
    }

    setImageUploadError(null);
    setIsUploadingImage(true);

    try {
      const result = await productApi.uploadImage(file);
      setImageUrl(result.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setImageUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: { name: string; description?: string; image_url?: string; price: number; category_id: number; is_available: boolean; stock_quantity?: number }) =>
      productApi.createProduct(data),
    onSuccess: () => {
      // Invalidate products query so the list reflects the new product
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      // Redirect to products page
      navigate("/products");
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Product name is required";
    } else if (name.trim().length > 255) {
      newErrors.name = "Name must be 255 characters or less";
    }

    if (description && description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or less";
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!categoryId) {
      newErrors.categoryId = "Please select a category";
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
      image_url: imageUrl.trim() || undefined,
      price: parseFloat(price),
      category_id: parseInt(categoryId),
      is_available: isAvailable,
      stock_quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
    });
  }

  // Loading state for categories
  if (catsLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify gap-4 py-16">
            <Loader2 size={24} className="animate-spin text-text-muted" />
            <p className="text-text-muted">Loading categories...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for categories
  if (catsError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card variant="bordered">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Icon icon={AlertTriangle} size={48} className="text-danger" />
            <CardTitle>Failed to load categories</CardTitle>
            <p className="text-text-muted">{catsError}</p>
            <Button onClick={() => navigate("/products")}>
              <Icon icon={ArrowLeft} size={16} />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build category options
  const categoryOptions = categories.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* Back navigation */}
      <Button
        variant="ghost"
        onClick={() => navigate("/products")}
        className="mb-6"
      >
        <Icon icon={ArrowLeft} size={16} />
        Back to Products
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={Package} size={20} />
            </div>
            <div>
              <CardTitle>New Product</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                Fill in the details to add a new product to the catalog
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <Input
              label="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="e.g. Artisan Sourdough Bread"
              maxLength={255}
            />

            {/* Description */}
            <Textarea
              label="Description"
              value={description}
              onChange={setDescription}
              error={errors.description}
              placeholder="A brief description of the product..."
            />

            {/* Image Upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Product Image
              </label>
              
              {/* File input */}
              <div className="flex items-center gap-3">
                <label
                  htmlFor="image-upload"
                  className={`flex h-11 items-center justify-center rounded-lg border-2 border-dashed px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isUploadingImage
                      ? "border-brand-300 bg-brand-50 cursor-wait"
                      : "border-border hover:border-brand-300 hover:bg-surface-card"
                  }`}
                >
                  {isUploadingImage ? (
                    <span className="flex items-center gap-2 text-brand-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="text-text-secondary">Choose file...</span>
                  )}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageFileSelect}
                  disabled={isUploadingImage}
                  className="hidden"
                />
                
                {/* Show current image URL or clear button */}
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-sm text-danger hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Image URL text input (for manual URL or shows uploaded URL) */}
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/product-image.jpg (or upload above)"
                maxLength={2048}
                helperText="Optional. Paste a URL or upload a file above (max 5MB)."
                error={imageUploadError || undefined}
              />

              {/* Preview uploaded image */}
              {imageUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-xs text-text-secondary">
                    Image preview
                  </span>
                </div>
              )}
            </div>

            {/* Price + Category row */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Price ($)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={errors.price}
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />

              <Select
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                error={errors.categoryId}
                placeholder="Select a category..."
              />
            </div>

            {/* Stock Quantity */}
            <Input
              label="Stock Inicial"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="0"
              min="0"
              helperText="Cantidad inicial en inventario (opcional)"
            />

            {/* Availability toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isAvailable}
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  isAvailable
                    ? "bg-emerald-500"
                    : "bg-border-dark"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                    isAvailable ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {isAvailable ? "Available" : "Unavailable"}
                </p>
                <p className="text-xs text-text-muted">
                  {isAvailable
                    ? "Product will be visible in the catalog immediately"
                    : "Product will be hidden from customers"}
                </p>
              </div>
            </div>

            {/* Mutation error */}
            {mutation.isError && (
              <div className="rounded-lg border border-danger/20 bg-danger-bg p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={AlertTriangle} size={18} className="mt-0.5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-semibold text-danger-text">
                      Failed to create product
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
                      Product created successfully!
                    </p>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                      Redirecting to products page...
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
                {mutation.isPending ? "Creating..." : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/products")}
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
