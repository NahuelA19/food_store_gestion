import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, PaginationInfo } from "../hooks/useSearch";

export interface SearchResultsProps {
  items: Product[];
  pagination: PaginationInfo;
  loading: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
  onProductClick: (productId: number) => void;
}

function ProductCardItem({ product, onClick }: { product: Product; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const inStock =
    product.inventory &&
    product.inventory.stock_quantity > product.inventory.low_stock_threshold;
  const hasImage = product.image_url && !imgError;

  return (
    <Card variant="interactive" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {hasImage ? (
            <img
              src={product.image_url!}
              alt={product.name}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-alt">
              <Icon icon={Package} className="text-text-secondary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-semibold text-text-primary">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">
                {product.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <span className="font-display text-lg font-bold text-brand-600">
                ${parseFloat(product.price.toString()).toFixed(2)}
              </span>
              {product.inventory && (
                <Badge variant={inStock ? "success" : "warning"} size="sm">
                  {inStock
                    ? "In Stock"
                    : `Low Stock (${product.inventory.stock_quantity})`}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchResults({
  items,
  pagination,
  loading,
  error,
  onPageChange,
  onProductClick,
}: SearchResultsProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger-bg p-6 text-center">
        <p className="font-semibold text-danger-text">{error}</p>
        <p className="mt-1 text-sm text-danger-text/80">
          Please try again or contact support.
        </p>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <Icon icon={Search} size={24} className="text-text-muted" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-text-primary">
          No products found
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Try clearing your filters or searching for something else.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">
        Showing {items.length} of {pagination.total} products
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <ProductCardItem
            key={product.id}
            product={product}
            onClick={() => onProductClick(product.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.has_previous}
        >
          <Icon icon={ChevronLeft} />
          Previous
        </Button>

        <span className="min-w-[140px] text-center text-sm text-text-secondary">
          Page {pagination.page} of {pagination.total_pages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.has_next}
        >
          Next
          <Icon icon={ChevronRight} />
        </Button>
      </div>
    </div>
  );
}
