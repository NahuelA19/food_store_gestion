/**
 * WishlistPage — Display all favorited products
 */

import { Link } from "react-router-dom";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { ProductCard } from "../components/ProductCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";

export function WishlistPage() {
  const { items, count, isLoading } = useWishlist();
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/20">
              <Heart size={22} className="fill-red-400 text-red-400 animate-[status-pulse_2s_ease-in-out_infinite]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">
                Mis Favoritos
              </h1>
              <p className="text-sm text-text-muted">
                {count > 0
                  ? `${count} ${count === 1 ? "producto guardado" : "productos guardados"}`
                  : "Sin favoritos todavía"}
              </p>
            </div>
          </div>
        </div>
        <Link to="/products">
          <Button variant="outline" size="sm">
            <Icon icon={ArrowLeft} size={16} />
            Ver catálogo
          </Button>
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product}
              onAddToCart={(product, quantity) => addItem(product.id, quantity)}
              onClick={() => {
                window.location.href = `/products/${item.product.id}`;
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20">
              <Heart size={44} className="text-red-400/50" />
            </div>
          </div>
          <h2 className="mb-2 font-display text-xl font-bold text-text-primary">
            Todavía no tenés favoritos
          </h2>
          <p className="mb-8 max-w-sm text-sm text-text-muted">
            Explorá los productos y hacé clic en el corazón para guardar tus favoritos.
          </p>
          <Link to="/products">
            <Button variant="default" size="lg" className="gap-2">
              <Icon icon={ShoppingBag} size={18} />
              Explorar productos
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
