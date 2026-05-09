import React from "react";
import { Product } from "../types/product";
import { ProductCard } from "./ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { AlertTriangle, Package } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error?: string | null;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onRetry?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  error,
  onProductClick,
  onAddToCart,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-danger bg-danger-bg p-12 text-center">
        <Badge variant="danger" className="mb-4">
          Error
        </Badge>
        <Icon
          icon={AlertTriangle}
          size={48}
          className="mx-auto mb-6 text-danger"
        />
        <h3 className="mb-3 text-lg font-bold text-danger-text">
          Something went wrong
        </h3>
        <p className="mb-6 text-sm text-danger-text/80">{error}</p>
        {onRetry && (
          <Button variant="default" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (isLoading && products.length === 0) {
    return (
      <div className="grid animate-fade-in grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 py-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-dashed border-brand-500 bg-gradient-to-br from-brand-50 to-amber-50/30 p-12 text-center">
        <Badge variant="brand" className="mb-4">
          Empty
        </Badge>
        <Icon
          icon={Package}
          size={64}
          className="mx-auto mb-6 text-brand-300"
        />
        <h3 className="mb-3 text-lg font-bold text-brand-600">
          No products found
        </h3>
        <p className="text-sm text-text-muted">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid animate-fade-in grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 py-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onClick={() => onProductClick?.(product)}
        />
      ))}
    </div>
  );
};
