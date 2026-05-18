import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Package, Search, ChevronLeft, ChevronRight, Heart, ShoppingCart, Loader2, Plus, Minus } from "lucide-react";
import { getProductImageUrl } from "@/lib/utils";
import { useCartContext } from "../context/CartContext";
import { useToast } from "./ui/Toast";
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
  showCartControls?: boolean;
}

/* ─── Single product card ─── */

function ProductCardItem({
  product,
  onClick,
  isFavorite,
  onToggleFavorite,
  showCartControls,
}: {
  product: Product;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (productId: number) => void;
  showCartControls: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [qtyLoading, setQtyLoading] = useState<"inc" | "dec" | null>(null);

  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartContext();
  const { toast } = useToast();

  // Find this product in cart (if any)
  const cartItem = cartItems.find((i) => i.product_id === product.id);
  const inCart = !!cartItem;

  const stockQty = product.inventory?.stock_quantity ?? 0;
  const isOutOfStock = stockQty === 0;
  const isLowStock = product.inventory
    ? stockQty > 0 && stockQty <= product.inventory.low_stock_threshold
    : false;
  const atMaxStock = inCart && cartItem.quantity >= stockQty;

  const imageUrl = getProductImageUrl(product.image_url);
  const hasImage = !!imageUrl && !imgError;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading || !onToggleFavorite) return;
    setFavLoading(true);
    try { await onToggleFavorite(product.id); } finally { setFavLoading(false); }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (addLoading) return;
    setAddLoading(true);
    try {
      await addItem(product.id, 1);
      toast(`${product.name} agregado al carrito`, "success");
    } catch {
      toast("Error al agregar al carrito", "error");
    } finally {
      setAddLoading(false);
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cartItem || qtyLoading || atMaxStock) return;
    setQtyLoading("inc");
    try {
      await updateQuantity(cartItem.id, cartItem.quantity + 1);
    } finally {
      setQtyLoading(null);
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cartItem || qtyLoading) return;
    setQtyLoading("dec");
    try {
      if (cartItem.quantity <= 1) {
        await removeItem(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, cartItem.quantity - 1);
      }
    } finally {
      setQtyLoading(null);
    }
  };

  return (
    <Card variant="interactive" onClick={onClick}>
      <CardContent className="p-0">
        {/* Image */}
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

          {/* Favorite */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favLoading}
              className={`absolute right-2 top-2 rounded-full p-1.5 transition-all duration-200 bg-black/30 backdrop-blur-sm ${
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

          {/* In cart indicator */}
          {inCart && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-500/80 backdrop-blur-sm px-2 py-0.5">
              <ShoppingCart size={10} className="text-white" />
              <span className="text-[10px] font-bold text-white">{cartItem.quantity}</span>
            </div>
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
                {isOutOfStock ? "Sin stock" : isLowStock ? `Quedan ${stockQty}` : "En stock"}
              </Badge>
            )}
          </div>

          {/* Cart controls */}
          {showCartControls && !isOutOfStock && (
            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
              {inCart ? (
                /* Qty controls: [-] qty [+] */
                <div className="flex items-center justify-between overflow-hidden rounded-xl border border-border bg-surface-alt">
                  <button
                    onClick={handleDecrease}
                    disabled={qtyLoading !== null}
                    className="flex h-9 w-10 items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-all disabled:opacity-40"
                    aria-label="Disminuir cantidad"
                  >
                    {qtyLoading === "dec"
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Minus size={14} />
                    }
                  </button>

                  <span className="flex-1 text-center text-sm font-bold text-text-primary">
                    {cartItem.quantity}
                  </span>

                  <button
                    onClick={handleIncrease}
                    disabled={qtyLoading !== null || atMaxStock}
                    className="flex h-9 w-10 items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-all disabled:opacity-40"
                    aria-label="Aumentar cantidad"
                  >
                    {qtyLoading === "inc"
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Plus size={14} />
                    }
                  </button>
                </div>
              ) : (
                /* Add to cart button */
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={handleAdd}
                  disabled={addLoading}
                  aria-label={`Agregar ${product.name} al carrito`}
                >
                  {addLoading
                    ? <Loader2 size={14} className="animate-spin mr-1" />
                    : <ShoppingCart size={14} className="mr-1" />
                  }
                  {addLoading ? "Agregando..." : "Agregar"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Grid ─── */

export function SearchResults({
  items,
  pagination,
  loading,
  error,
  onPageChange,
  onProductClick,
  favoriteIds,
  onToggleFavorite,
  showCartControls = false,
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
            showCartControls={showCartControls}
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
