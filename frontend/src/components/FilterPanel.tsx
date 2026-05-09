import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Filter, X, SlidersHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import type { Filters } from "../hooks/useSearch";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  categories?: Category[];
  isLoading?: boolean;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  categories = [],
  isLoading = false,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [errors, setErrors] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  function handleFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    const newErrors: string[] = [];

    if (
      localFilters.min_price !== null &&
      localFilters.max_price !== null &&
      localFilters.min_price > localFilters.max_price
    ) {
      newErrors.push("Min price must be <= max price");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onFilterChange(localFilters);
  }

  function handleReset() {
    setLocalFilters({
      category_id: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      min_stock: null,
    });
    setErrors([]);
    onReset();
  }

  const activeFilterCount = [
    localFilters.category_id,
    localFilters.min_price,
    localFilters.max_price,
    localFilters.in_stock,
    localFilters.min_stock,
  ].filter((v) => v !== null).length;

  return (
    <Card>
      <CardContent className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between"
          type="button"
        >
          <div className="flex items-center gap-2">
            <Icon icon={SlidersHorizontal} className="text-text-secondary" />
            <span className="font-display text-base font-semibold text-text-primary">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <Badge variant="brand" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <Icon
            icon={isExpanded ? ChevronDown : ChevronRight}
            className="text-text-muted"
          />
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-5">
            {errors.length > 0 && (
              <div className="space-y-1 rounded-lg border border-danger/20 bg-danger-bg p-3">
                {errors.map((err, i) => (
                  <p
                    key={i}
                    className="flex items-center gap-1.5 text-xs font-medium text-danger-text"
                  >
                    <Icon icon={X} size={14} />
                    {err}
                  </p>
                ))}
              </div>
            )}

            <div>
              <label
                htmlFor="category-select"
                className="mb-1.5 block text-sm font-semibold text-text-primary"
              >
                Category
              </label>
              <select
                id="category-select"
                value={localFilters.category_id || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "category_id",
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                disabled={isLoading}
                className="flex h-11 w-full rounded-lg border-2 border-border bg-surface-card px-3.5 py-2.5 text-sm text-text-primary transition-all hover:border-brand-300 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min $"
                  value={localFilters.min_price !== null ? localFilters.min_price : ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "min_price",
                      e.target.value ? parseFloat(e.target.value) : null,
                    )
                  }
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                />
                <span className="text-text-muted">&mdash;</span>
                <Input
                  type="number"
                  placeholder="Max $"
                  value={localFilters.max_price !== null ? localFilters.max_price : ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "max_price",
                      e.target.value ? parseFloat(e.target.value) : null,
                    )
                  }
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={localFilters.in_stock === true}
                onChange={(e) =>
                  handleFilterChange("in_stock", e.target.checked ? true : null)
                }
                disabled={isLoading}
                className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/20"
              />
              <span className="text-sm font-medium text-text-primary">
                In Stock Only
              </span>
            </label>

            <div>
              <label
                htmlFor="min-stock"
                className="mb-1.5 block text-sm font-semibold text-text-primary"
              >
                Minimum Stock
              </label>
              <Input
                id="min-stock"
                type="number"
                placeholder="Any"
                value={localFilters.min_stock !== null ? localFilters.min_stock : ""}
                onChange={(e) =>
                  handleFilterChange(
                    "min_stock",
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                min="1"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleApply}
                disabled={isLoading}
                className="flex-1"
              >
                <Icon icon={Filter} />
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
