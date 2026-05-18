/**
 * WishlistPage — Display all favorited products
 */

import { Link } from "react-router-dom";
import { useWishlist } from "../hooks/useWishlist";
import { ProductCard } from "../components/ProductCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";

export function WishlistPage() {
  const { items, count, isLoading } = useWishlist();

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Heart size={28} className="fill-red-500 text-red-500" />
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Mis Favoritos
            </h1>
          </div>
          <p className="mt-1 text-text-muted">
            {count} {count === 1 ? "producto guardado" : "productos guardados"}
          </p>
        </div>
        <Link to="/products">
          <Button variant="outline">
            <Icon icon={ArrowLeft} size={16} />
            Ver productos
          </Button>
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product}
              onClick={() => {
                window.location.href = `/products/${item.product.id}`;
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="mb-2 font-display text-2xl font-bold text-text-primary">
            Todavía no tenés favoritos
          </h2>
          <p className="mb-8 max-w-md text-text-muted">
            Explorá los productos y hacé clic en el corazón para guardar tus favoritos.
          </p>
          <Link to="/products">
            <Button variant="default" size="lg">
              <Icon icon={ShoppingBag} size={18} />
              Ver productos
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
