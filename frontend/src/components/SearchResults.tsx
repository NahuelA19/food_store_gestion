import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Package, Search, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import type { Product, PaginationInfo } from "../hooks/useSearch";
export interface SearchResultsProps {
  items: Product[];
  pagination: PaginationInfo;
  loading: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
  onProductClick: (productId: number) => void;
  favoriteIds?: Set<number>;
  onToggleFavorite?: (productId: number) => void;
}

function ProductCardItem({
  product,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  product: Product;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (productId: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const inStock =
    product.inventory &&
    product.inventory.stock_quantity > product.inventory.low_stock_threshold;
  const hasImage = product.image_url && !imgError;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (favLoading || !onToggleFavorite) return;
    setFavLoading(true);
    try {
      await onToggleFavorite(product.id);
    } finally {
      setFavLoading(false);
    }
  };

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
             <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-surface-alt)]">
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
             <span className="font-display text-lg font-bold text-[color:var(--color-primary)]">
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

          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favLoading}
              className={`shrink-0 rounded-full p-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                favLoading ? "animate-pulse" : "hover:scale-110"
              } ${
                isFavorite
                  ? "text-red-500"
                  : "text-gray-400 hover:text-red-400 dark:text-gray-500"
              }`}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart
                size={18}
                className={`transition-all duration-200 ${
                  isFavorite ? "fill-red-500" : "fill-none"
                }`}
              />
            </button>
          )}
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
  favoriteIds,
  onToggleFavorite,
}: SearchResultsProps) {
  // Sort: favorited products first
  const sortedItems = useMemo(() => {
    if (!favoriteIds || favoriteIds.size === 0) return items;
    return [...items].sort((a, b) => {
      const aFav = favoriteIds.has(a.id) ? 1 : 0;
      const bFav = favoriteIds.has(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [items, favoriteIds]);

  const displayItems = sortedItems;
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
         <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-surface-alt)]">
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
        {displayItems.map((product) => (
          <ProductCardItem
            key={product.id}
            product={product}
            onClick={() => onProductClick(product.id)}
            isFavorite={favoriteIds?.has(product.id) ?? false}
            onToggleFavorite={onToggleFavorite}
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
