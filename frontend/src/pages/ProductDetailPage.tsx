import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReviewList } from "../components/reviews/ReviewList";
import { ReviewForm } from "../components/reviews/ReviewForm";
import { FavoriteButton } from "../components/wishlist/FavoriteButton";
import { useProduct } from "../hooks/useProduct";
import { useProductReviews } from "../hooks/useReviews";
import { useWishlist } from "../hooks/useWishlist";
import { useAuthStore } from "../store/authStore";
import {
  AlertTriangle,
  Package,
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  MessageSquare,
  Star,
} from "lucide-react";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id) : undefined;
  const { product, isLoading, error } = useProduct(productId);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isWishlisted, toggle } = useWishlist();
  const {
    reviews,
    summary,
    isLoading: reviewsLoading,
    page: reviewPage,
    setPage: setReviewPage,
    refetch: refetchReviews,
  } = useProductReviews(productId);

  if (error) {
    return (
      <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="bordered" className="mx-auto max-w-lg text-center">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Icon icon={AlertTriangle} size={48} className="text-danger" />
            <CardTitle>Product not found</CardTitle>
            <p className="text-text-muted">{error}</p>
            <Button onClick={() => navigate("/products")}>
              <Icon icon={ArrowLeft} size={16} />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" disabled className="mb-8">
          <Icon icon={ArrowLeft} size={16} />
          Back to Products
        </Button>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton variant="rect" className="h-[450px]" />
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock =
    product.inventory && product.inventory.available_quantity === 0;
  const isLowStock =
    product.inventory &&
    product.inventory.available_quantity > 0 &&
    product.inventory.available_quantity <= product.inventory.low_stock_threshold;

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/products")}
        className="mb-8"
      >
        <Icon icon={ArrowLeft} size={16} />
        Back to Products
      </Button>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex min-h-[450px] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-amber-50">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Icon icon={Package} size={96} className="text-brand-300" />
            )}
          </div>

          <CardContent className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-text-primary lg:text-4xl">
                  {product.name}
                </h1>
                {product.category && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {product.category.name}
                  </p>
                )}
              </div>
              {isAuthenticated && (
                <FavoriteButton
                  isWishlisted={isWishlisted(product.id)}
                  onToggle={() => toggle(product.id)}
                  size="lg"
                />
              )}
            </div>

            {product.description && (
              <p className="text-lg leading-relaxed text-text-secondary">
                {product.description}
              </p>
            )}

            <div className="border-b border-border pb-6">
              <span className="font-display text-4xl font-black text-primary lg:text-5xl">
                ${product.price.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOutOfStock && (
                <Badge variant="danger">Out of Stock</Badge>
              )}
              {isLowStock && (
                <Badge variant="warning">
                  Low Stock ({product.inventory?.available_quantity} left)
                </Badge>
              )}
              {!isOutOfStock && !isLowStock && (
                <Badge variant="success">
                  <Icon icon={CheckCircle} size={14} />
                  In Stock
                </Badge>
              )}
            </div>

            {product.inventory && (
              <div>
                <div className="h-2.5 overflow-hidden rounded-full bg-border-light">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-brand-300 transition-all duration-500"
                    style={{
                      width: `${(product.inventory.available_quantity / product.inventory.stock_quantity) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-text-muted">
                  {product.inventory.available_quantity} of{" "}
                  {product.inventory.stock_quantity} available
                </p>
              </div>
            )}

            {!isOutOfStock && (
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex overflow-hidden rounded-xl border-2 border-border bg-surface-alt">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="shrink-0 rounded-none border-none min-h-[44px] w-11 px-0"
                  >
                    <Icon icon={Minus} size={16} />
                  </Button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    min="1"
                    max={product.inventory?.available_quantity || 1}
                    className="w-16 border-none bg-transparent text-center font-bold text-base text-text-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label="Quantity"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          quantity + 1,
                          product.inventory?.available_quantity || 1
                        )
                      )
                    }
                    aria-label="Increase quantity"
                    className="shrink-0 rounded-none border-none min-h-[44px] w-11 px-0"
                  >
                    <Icon icon={Plus} size={16} />
                  </Button>
                </div>
                <Button variant="default" size="lg" className="flex-1">
                  <Icon icon={ShoppingCart} size={18} />
                  Add to Cart
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Reviews Section */}
      <section className="mt-12 border-t border-border pt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReviewList
              reviews={reviews}
              summary={summary}
              isLoading={reviewsLoading}
              page={reviewPage}
              totalPages={Math.max(1, Math.ceil(summary.total_count / 10))}
              onPageChange={setReviewPage}
            />
          </div>

          <div>
            <div className="sticky top-24 rounded-xl border border-border bg-surface-alt p-6 dark:border-border dark:bg-surface">
              <h3 className="mb-4 font-display text-lg font-bold text-text-primary">
                Write a Review
              </h3>
              {isAuthenticated ? (
                showReviewForm ? (
                  <ReviewForm
                    productId={product.id}
                    onSubmit={() => {
                      setShowReviewForm(false);
                      refetchReviews();
                    }}
                  />
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <Icon icon={Star} size={16} />
                    Write a Review
                  </Button>
                )
              ) : (
                <div className="text-center">
                  <p className="mb-3 text-sm text-text-muted">
                    Log in to share your experience with this product.
                  </p>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      <Icon icon={MessageSquare} size={16} />
                      Log in to Review
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
