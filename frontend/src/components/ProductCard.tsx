import React from "react";
import { Product } from "../types/product";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuthContext } from "../context/AuthContext";
import { useWishlist } from "../hooks/useWishlist";
import { FavoriteButton } from "./wishlist/FavoriteButton";
import { ShoppingCart, Plus, Minus, Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
}) => {
  const [quantity, setQuantity] = React.useState(1);
  const { isAuthenticated } = useAuthContext();
  const { isWishlisted, toggle } = useWishlist();

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
  };

  const isOutOfStock =
    product.inventory && product.inventory.available_quantity === 0;
  const isLowStock =
    product.inventory &&
    product.inventory.available_quantity > 0 &&
    product.inventory.available_quantity <= product.inventory.low_stock_threshold;

  const maxQuantity = product.inventory?.available_quantity || 1;

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      <div
        className="relative flex h-40 items-center justify-center bg-gradient-to-br from-brand-50 to-amber-50"
        aria-label={`${product.name} image`}
      >
        <Icon icon={Package} size={48} className="text-brand-300" />
        {isAuthenticated && (
          <div className="absolute right-2 top-2">
            <FavoriteButton
              isWishlisted={isWishlisted(product.id)}
              onToggle={() => toggle(product.id)}
              size="sm"
            />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-2">
        <h3 className="font-display text-base font-bold text-text-primary">
          {product.name}
        </h3>

        {product.category && (
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {product.category.name}
          </p>
        )}

        {product.description && (
          <p className="line-clamp-2 text-sm text-text-muted">
            {product.description.substring(0, 80)}
            {product.description.length > 80 ? "..." : ""}
          </p>
        )}

        <div className="border-b border-border-light pb-3 mb-3">
          <span
            className="block text-xl font-bold text-brand-600"
            aria-label={`Price: $${product.price.toFixed(2)}`}
          >
            ${product.price.toFixed(2)}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {isOutOfStock && (
            <Badge variant="danger" role="status" aria-label="Out of stock">
              Out of Stock
            </Badge>
          )}
          {isLowStock && (
            <Badge
              variant="warning"
              role="status"
              aria-label={`Low stock: ${product.inventory?.available_quantity} remaining`}
            >
              Low Stock
            </Badge>
          )}
          {!isOutOfStock && !isLowStock && product.is_available && (
            <Badge variant="success" role="status" aria-label="In stock">
              In Stock
            </Badge>
          )}
        </div>

        {!isOutOfStock && (
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex overflow-hidden rounded-xl border-2 border-border-light bg-surface-alt">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                aria-label="Decrease quantity"
                className="shrink-0 rounded-none border-none min-h-[44px] w-10 px-0"
              >
                <Icon icon={Minus} size={16} />
              </Button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                }}
                min="1"
                max={maxQuantity}
                className="flex-1 border-none bg-transparent text-center font-bold text-base text-text-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Quantity"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.min(maxQuantity, quantity + 1));
                }}
                aria-label="Increase quantity"
                className="shrink-0 rounded-none border-none min-h-[44px] w-10 px-0"
              >
                <Icon icon={Plus} size={16} />
              </Button>
            </div>
            <Button
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              aria-label={`Add ${quantity} ${product.name} to cart`}
              className="w-full"
            >
              <Icon icon={ShoppingCart} size={16} />
              Add to Cart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
