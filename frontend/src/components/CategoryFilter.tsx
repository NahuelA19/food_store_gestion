import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ChevronDown } from "lucide-react";
import { productApi } from "../api/productApi";
import type { Category } from "../types/product";

interface CategoryFilterProps {
  selectedCategory: number | null;
  onFilterChange: (categoryId: number | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onFilterChange,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const data = await productApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="relative">
      <select
        value={selectedCategory || ""}
        onChange={(e) =>
          onFilterChange(e.target.value ? parseInt(e.target.value) : null)
        }
        disabled={isLoading}
        className="flex h-11 w-full appearance-none rounded-lg border-2 border-border bg-surface-card px-3.5 py-2.5 pr-10 text-sm text-text-primary transition-all hover:border-brand-300 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
            {cat.product_count ? ` (${cat.product_count})` : ""}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <Icon icon={ChevronDown} className="text-text-muted" />
      </div>
      {selectedCategory && (
        <Badge
          variant="brand"
          size="sm"
          className="absolute -top-2 -right-2"
        >
          {categories.find((c) => c.id === selectedCategory)?.name ??
            selectedCategory}
        </Badge>
      )}
    </div>
  );
}
