import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Package, Search, ChevronLeft, ChevronRight, Heart, ShoppingCart, Check, Loader2 } from "lucide-react";
import { getProductImageUrl } from "@/lib/utils";
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
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
}

type CartState = "idle" | "loading" | "added" | "error";

function ProductCardItem({
  product,
  onClick,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: {
  product: Product;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (productId: number) => void;
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
}) {
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [cartState, setCartState] = useState<CartState>("idle");

  const stockQty = product.inventory?.stock_quantity ?? 0;
  const isOutOfStock = stockQty === 0;
  const isLowStock = product.inventory
    ? stockQty > 0 && stockQty <= product.inventory.low_stock_threshold
    : false;

  const imageUrl = getProductImageUrl(product.image_url);
  const hasImage = !!imageUrl && !imgError;

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onAddToCart || cartState !== "idle") return;
    setCartState("loading");
    try {
      await onAddToCart(product.id, 1);
      setCartState("added");
      setTimeout(() => setCartState("idle"), 2000);
    } catch {
      setCartState("error");
      setTimeout(() => setCartState("idle"), 2500);
    }
  };

  return (
    <Card variant="interactive" onClick={onClick}>
      <CardContent className="p-0">
        {/* Product image */}
        <div className="relative h-36 overflow-hidden rounded-t-xl">
          {hasImage ? (
            <img
              src={imageUrl!}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface-alt">
              <Icon icon={Package} size={36} className="text-text-muted" />
            </div>
          )}

          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favLoading}
              className={`absolute right-2 top-2 rounded-full p-1.5 transition-all duration-200 bg-black/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                favLoading ? "animate-pulse" : "hover:scale-110"
              } ${isFavorite ? "text-red-400" : "text-white/70 hover:text-red-400"}`}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart
                size={16}
                className={`transition-all duration-200 ${isFavorite ? "fill-red-400" : "fill-none"}`}
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2">
          <h3 className="truncate font-display text-sm font-semibold text-text-primary">
            {product.name}
          </h3>

          {product.description && (
            <p className="line-clamp-2 text-xs text-text-muted">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-base font-bold text-brand-400">
              ${parseFloat(product.price.toString()).toFixed(2)}
            </span>

            {product.inventory && (
              <Badge
                variant={isOutOfStock ? "danger" : isLowStock ? "warning" : "success"}
                size="sm"
              >
                {isOutOfStock
                  ? "Sin stock"
                  : isLowStock
                  ? `Quedan ${stockQty}`
                  : "En stock"}
              </Badge>
            )}
          </div>

          {/* Add to cart button */}
          {onAddToCart && !isOutOfStock && (
            <Button
              variant={cartState === "added" ? "outline" : "default"}
              size="sm"
              className="w-full mt-1"
              onClick={handleAddToCart}
              disabled={cartState !== "idle"}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              {cartState === "loading" && (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Agregando...
                </>
              )}
              {cartState === "added" && (
                <>
                  <Check size={14} className="mr-1 text-emerald-400" />
                  <span className="text-emerald-400">¡Agregado!</span>
                </>
              )}
              {cartState === "error" && (
                <>
                  <ShoppingCart size={14} className="mr-1 text-red-400" />
                  <span className="text-red-400">Error</span>
                </>
              )}
              {cartState === "idle" && (
                <>
                  <ShoppingCart size={14} className="mr-1" />
                  Agregar
                </>
              )}
            </Button>
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
  onAddToCart,
}: SearchResultsProps) {
  const sortedItems = useMemo(() => {
    if (!favoriteIds || favoriteIds.size === 0) return items;
    return [...items].sort((a, b) => {
      const aFav = favoriteIds.has(a.id) ? 1 : 0;
      const bFav = favoriteIds.has(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [items, favoriteIds]);

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-center">
        <p className="font-semibold text-danger">{error}</p>
        <p className="mt-1 text-sm text-text-muted">
          Intentá de nuevo o contactá con soporte.
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
          No se encontraron productos
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Probá limpiar los filtros o buscá algo diferente.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        Mostrando {items.length} de {pagination.total} productos
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedItems.map((product) => (
          <ProductCardItem
            key={product.id}
            product={product}
            onClick={() => onProductClick(product.id)}
            isFavorite={favoriteIds?.has(product.id) ?? false}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
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
          Anterior
        </Button>

        <span className="min-w-[140px] text-center text-sm text-text-muted">
          Página {pagination.page} de {pagination.total_pages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.has_next}
        >
          Siguiente
          <Icon icon={ChevronRight} />
        </Button>
      </div>
    </div>
  );
}
