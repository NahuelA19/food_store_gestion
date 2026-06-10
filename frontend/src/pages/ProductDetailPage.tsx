import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProductImageUrl } from "@/lib/utils";
import { Card, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReviewList } from "../components/reviews/ReviewList";
import { ReviewForm } from "../components/reviews/ReviewForm";
import { FavoriteButton } from "../components/wishlist/FavoriteButton";
import { useProduct } from "../hooks/useProduct";
import { useProductReviews, useMyReview } from "../hooks/useReviews";
import { useWishlist } from "../hooks/useWishlist";
import { useAuthStore } from "../store/authStore";
import { useCartContext } from "../context/CartContext";
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
  Pencil,
  Check,
  AlertCircle,
} from "lucide-react";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id) : undefined;
  const { product, isLoading, error } = useProduct(productId);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCartContext();
  const {
    reviews,
    summary,
    isLoading: reviewsLoading,
    page: reviewPage,
    setPage: setReviewPage,
    refetch: refetchReviews,
  } = useProductReviews(productId);

  const {
    review: myReview,
    refetch: refetchMyReview,
  } = useMyReview(productId);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      
      await addItem(product.id, quantity);
      
      setSuccessMessage(`"${product.name}" agregado al carrito`);
      setQuantity(1);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al agregar al carrito";
      setErrorMessage(message);
      console.error("Error adding to cart:", err);
    }
  };

  if (error) {
    return (
      <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="bordered" className="mx-auto max-w-lg text-center">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Icon icon={AlertTriangle} size={48} className="text-danger" />
            <CardTitle>Producto no encontrado</CardTitle>
            <p className="text-text-muted">{error}</p>
            <Button onClick={() => navigate("/products")}>
              <Icon icon={ArrowLeft} size={16} />
              Volver a productos
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
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 backdrop-blur-sm animate-slide-up">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <Check size={16} className="text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-emerald-400">
            {successMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 backdrop-blur-sm animate-slide-up">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/20">
            <AlertCircle size={16} className="text-danger" />
          </div>
          <p className="text-sm font-semibold text-danger">
            {errorMessage}
          </p>
        </div>
      )}

      <button
        onClick={() => navigate("/products")}
        className="mb-8 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-white/10 transition-all duration-200"
      >
        <Icon icon={ArrowLeft} size={16} />
        Volver a productos
      </button>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex min-h-[450px] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-amber-50">
            {getProductImageUrl(product.image_url) && !imgError ? (
              <img
                src={getProductImageUrl(product.image_url)!}
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
              <div className="flex items-center gap-2">
                {useAuthStore.getState().user?.role?.toLowerCase() === "admin" && (
                  <Link
                    to={`/products/${product.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm font-semibold text-text-secondary transition-all hover:border-brand-300 hover:text-brand-600"
                  >
                    <Pencil size={16} />
                    Editar
                  </Link>
                )}
                {isAuthenticated && (
                <FavoriteButton
                  isWishlisted={isWishlisted(product.id)}
                  onToggle={() => toggle(product.id)}
                  size="lg"
                />
              )}
            </div>
          </div>

            {product.description && (
              <p className="text-lg leading-relaxed text-text-secondary">
                {product.description}
              </p>
            )}

            <div className="border-b border-white/10 pb-6">
              <span className="font-display text-5xl font-black text-accent lg:text-6xl">
                ${product.price.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOutOfStock && (
                <Badge variant="danger">Sin stock</Badge>
              )}
              {isLowStock && (
                <Badge variant="warning">
                  Stock bajo ({product.inventory?.available_quantity} disponibles)
                </Badge>
              )}
              {!isOutOfStock && !isLowStock && (
                <Badge variant="success">
                  <Icon icon={CheckCircle} size={14} />
                  Disponible
                </Badge>
              )}
            </div>

            {product.inventory && (
              <div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      product.inventory.available_quantity / product.inventory.stock_quantity > 0.5
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : product.inventory.available_quantity / product.inventory.stock_quantity > 0.2
                        ? "bg-gradient-to-r from-amber-500 to-orange-400"
                        : "bg-gradient-to-r from-red-500 to-rose-400"
                    }`}
                    style={{
                      width: `${(product.inventory.available_quantity / product.inventory.stock_quantity) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-text-muted">
                  {product.inventory.available_quantity} de{" "}
                  {product.inventory.stock_quantity} disponibles
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
                <Button
                  variant="default"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                >
                  <Icon icon={ShoppingCart} size={18} />
                  Agregar al carrito
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
                {myReview ? "Tu reseña" : "Escribir una reseña"}
              </h3>
              {isAuthenticated ? (
                myReview ? (
                  <ReviewForm
                    productId={product.id}
                    existingReview={myReview}
                    onSubmit={() => {
                      setShowReviewForm(false);
                      refetchReviews();
                      refetchMyReview();
                    }}
                    onDelete={() => {
                      setShowReviewForm(false);
                      refetchReviews();
                      refetchMyReview();
                    }}
                  />
                ) : showReviewForm ? (
                  <ReviewForm
                    productId={product.id}
                    onSubmit={() => {
                      setShowReviewForm(false);
                      refetchReviews();
                      refetchMyReview();
                    }}
                  />
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <Icon icon={Star} size={16} />
                    Escribir reseña
                  </Button>
                )
              ) : (
                <div className="text-center">
                  <p className="mb-3 text-sm text-text-muted">
                    Iniciá sesión para compartir tu experiencia con este producto.
                  </p>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      <Icon icon={MessageSquare} size={16} />
                      Iniciar sesión para reseñar
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
