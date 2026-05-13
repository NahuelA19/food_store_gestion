/**
 * EditCategoryPage — Admin form to edit an existing category
 *
 * Architecture:
 * - Loads category by ID from URL params via TanStack Query
 * - Pre-fills form with existing data
 * - Uses useMutation with productApi.updateCategory for PUT
 * - On success: invalidates categories cache + redirects
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/productApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load category
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => productApi.getCategory(categoryId),
    enabled: !isNaN(categoryId),
  });

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill when loaded
  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
    }
  }, [category]);

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      productApi.updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      navigate("/");
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Category name is required";
    else if (name.trim().length > 100) newErrors.name = "Name must be 100 characters or less";
    if (description && description.length > 500) newErrors.description = "Description must be 500 characters or less";
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

  if (categoryLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (categoryError || !category) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="border-2 border-danger">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertTriangle size={48} className="text-danger" />
            <h2 className="font-display text-xl font-bold text-text-primary">Category not found</h2>
            <p className="text-sm text-text-muted">
              {categoryError instanceof Error ? categoryError.message : "The category doesn't exist or has been deleted."}
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2">
          <Icon icon={ArrowLeft} size={16} />
          Back to Dashboard
        </Button>
        <h1 className="font-display text-2xl font-bold text-text-primary">Edit Category</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Update category information — #{category.id}
        </p>
      </div>

      {mutation.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-success bg-success/10 p-3 text-sm font-semibold text-success-dark">
          <CheckCircle size={18} />
          Category updated successfully!
        </div>
      )}

      {mutation.isError && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm font-medium text-danger">
          <AlertTriangle size={18} />
          {mutation.error instanceof Error ? mutation.error.message : "Failed to update category"}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Category Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Enter category name"
              maxLength={100}
            />

            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              placeholder="Optional description"
              maxLength={500}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="default" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save size={16} className="mr-2" />Save Changes</>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
