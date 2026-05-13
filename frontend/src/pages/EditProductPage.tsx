/**
 * EditProductPage — Admin form to edit an existing product
 *
 * Architecture:
 * - Loads product by ID from URL params via TanStack Query
 * - Pre-fills form with existing data
 * - Uses useMutation with productApi.updateProduct for PUT
 * - On success: invalidates products cache + redirects
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/productApi";
import { useCategories } from "../hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Package,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Warehouse,
} from "lucide-react";

/* ─── Inline Select ─── */

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
      <label htmlFor={inputId} className="block text-sm font-semibold text-text-primary">
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
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/* ─── Inline Textarea ─── */

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
      <label htmlFor={inputId} className="block text-sm font-semibold text-text-primary">
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
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/* ─── Page Component ─── */

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories } = useCategories();

  // Load product
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productApi.getProduct(productId),
    enabled: !isNaN(productId),
  });

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Pre-fill form when product loads
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setImageUrl(product.image_url || "");
      setPrice(String(product.price));
      setCategoryId(String(product.category_id));
      setIsAvailable(product.is_available ?? true);
    }
  }, [product]);

  // Inventory
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ["inventory", productId],
    queryFn: () => productApi.getInventory(productId),
    enabled: !isNaN(productId),
  });

  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");

  useEffect(() => {
    if (inventory) {
      setStockQuantity(String(inventory.stock_quantity));
      setLowStockThreshold(String(inventory.low_stock_threshold));
    }
  }, [inventory]);

  const inventoryMutation = useMutation({
    mutationFn: (data: { stock_quantity: number; low_stock_threshold: number }) =>
      productApi.updateInventory(productId, data.stock_quantity, data.low_stock_threshold),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Image upload
  async function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError("Invalid file type. Allowed: JPG, PNG, WebP, GIF");
      return;
    }
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
      setImageUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      image_url?: string;
      price: number;
      category_id: number;
      is_available: boolean;
    }) => productApi.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      navigate("/products");
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Product name is required";
    else if (name.trim().length > 255) newErrors.name = "Name must be 255 characters or less";
    if (description && description.length > 2000) newErrors.description = "Description must be 2000 characters or less";
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) newErrors.price = "Price must be a positive number";
    if (!categoryId) newErrors.categoryId = "Please select a category";
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
    });
  }

  // Loading state
  if (productLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (productError || !product) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-2 border-danger">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertTriangle size={48} className="text-danger" />
            <h2 className="font-display text-xl font-bold text-text-primary">Product not found</h2>
            <p className="text-sm text-text-muted">
              {productError instanceof Error ? productError.message : "The product you're looking for doesn't exist or has been deleted."}
            </p>
            <Button variant="outline" onClick={() => navigate("/products")}>
              <ArrowLeft size={16} className="mr-1" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/products")}
            className="mb-2"
          >
            <Icon icon={ArrowLeft} size={16} />
            Back to Products
          </Button>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Edit Product
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Update product information — #{product.id}
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Icon icon={Package} size={28} />
        </div>
      </div>

      {/* Success message */}
      {mutation.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-success bg-success/10 p-3 text-sm font-semibold text-success-dark">
          <CheckCircle size={18} />
          Product updated successfully!
        </div>
      )}

      {/* Error message */}
      {mutation.isError && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm font-medium text-danger">
          <AlertTriangle size={18} />
          {mutation.error instanceof Error ? mutation.error.message : "Failed to update product"}
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Enter product name"
              maxLength={255}
            />

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
              <div className="flex items-center gap-3">
                <label
                  htmlFor="edit-image-upload"
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
                  id="edit-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageFileSelect}
                  disabled={isUploadingImage}
                  className="hidden"
                />
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

              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/product-image.jpg (or upload above)"
                maxLength={2048}
                helperText="Optional. Paste a URL or upload a file (max 5MB)."
                error={imageUploadError || undefined}
              />

              {imageUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="text-xs text-text-secondary">Image preview</span>
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

            {/* Availability */}
            <div className="flex items-center gap-3">
              <input
                id="edit-is-available"
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-5 w-5 rounded border-2 border-border text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="edit-is-available" className="text-sm font-medium text-text-primary">
                Product is available for purchase
              </label>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="default"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
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

      {/* Inventory Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Warehouse size={20} />
            </div>
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <p className="text-xs text-text-muted mt-0.5">
                Manage stock levels and low-stock alerts
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : inventoryError ? (
            <div className="flex items-center gap-2 rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm font-medium text-danger">
              <AlertTriangle size={16} />
              {inventoryError instanceof Error ? inventoryError.message : "Failed to load inventory"}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current stock summary */}
              {inventory && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-surface-alt p-3 text-center">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Stock</p>
                    <p className="mt-1 font-display text-2xl font-bold text-text-primary">{inventory.stock_quantity}</p>
                  </div>
                  <div className="rounded-lg bg-surface-alt p-3 text-center">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Reserved</p>
                    <p className="mt-1 font-display text-2xl font-bold text-amber-600">{inventory.reserved_quantity}</p>
                  </div>
                  <div className="rounded-lg bg-surface-alt p-3 text-center">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Available</p>
                    <p className="mt-1 font-display text-2xl font-bold text-emerald-600">{inventory.available_quantity}</p>
                  </div>
                </div>
              )}

              {/* Stock form */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Stock Quantity"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  helperText="Total units in stock"
                />
                <Input
                  label="Low Stock Threshold"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  min="0"
                  helperText="Alert when stock drops below this"
                />
              </div>

              {inventoryMutation.isSuccess && (
                <div className="flex items-center gap-2 rounded-lg border-2 border-success bg-success/10 p-3 text-sm font-semibold text-success-dark">
                  <CheckCircle size={18} />
                  Inventory updated successfully!
                </div>
              )}

              {inventoryMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm font-medium text-danger">
                  <AlertTriangle size={16} />
                  {inventoryMutation.error instanceof Error ? inventoryMutation.error.message : "Failed to update inventory"}
                </div>
              )}

              <Button
                variant="default"
                onClick={() => {
                  inventoryMutation.mutate({
                    stock_quantity: parseInt(stockQuantity) || 0,
                    low_stock_threshold: parseInt(lowStockThreshold) || 10,
                  });
                }}
                disabled={inventoryMutation.isPending}
              >
                {inventoryMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Update Inventory
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
