import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { useCartContext } from "../context/CartContext";
import { usePaymentStore } from "../store/paymentStore";
import { useAuthStore } from "../store/authStore";
import { paymentApi } from "../api/paymentApi";
import { ShoppingBag, Package, Trash2, Plus, Minus, ArrowLeft, CreditCard, Loader2 } from "lucide-react";

export function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    checkout,
  } = useCartContext();
  const navigate = useNavigate();
  const { setPreference } = usePaymentStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMpCheckout = async () => {
    if (!shippingAddress.trim()) return;
    if (!accessToken) return;
    setIsProcessing(true);
    try {
      const checkoutResult = await checkout({ shipping_address: shippingAddress });
      const orderId = checkoutResult.order_id;
      if (!orderId) throw new Error("No se pudo crear la orden");
      const { preference_id, init_point } = await paymentApi.createPreference(orderId, accessToken);
      setPreference(preference_id);
      window.location.href = init_point;
    } catch (err) {
      console.error("Checkout error:", err);
      navigate("/payment/failure");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-lg text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12" role="alert">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-xl font-bold text-danger">Something went wrong</h2>
            <p className="text-text-muted">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-border bg-surface-card px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-surface-alt"
              >
                Continue Shopping
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <Icon icon={ShoppingBag} size={48} className="text-text-muted opacity-60" />
        <h2 className="text-xl font-bold text-primary">Tu carrito está vacío</h2>
        <p className="text-text-muted">Agregá productos desde nuestra tienda</p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-text-on-primary shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="m-0 text-xl font-bold text-primary md:text-2xl">Tu carrito</h1>
        <Badge variant="success">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Badge>
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={() => {
            if (window.confirm("Vaciar carrito?")) {
              clearCart();
            }
          }}
          aria-label="Clear cart"
        >
          <Icon icon={Trash2} size={16} />
          Vaciar carrito
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              variant="bordered"
              role="group"
              aria-label={`Item: ${item.product_name || `Product ${item.product_id}`}`}
            >
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Icon icon={Package} size={32} className="shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-primary">
                      {item.product_name || `Product #${item.product_id}`}
                    </h3>
                    <p className="text-sm text-text-muted">
                      ${Number(item.unit_price).toFixed(2)} c/u
                    </p>
                  </div>
                </div>

                <div className="flex items-center overflow-hidden rounded-lg border-2 border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-0"
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    aria-label={`Decrease quantity for ${item.product_name}`}
                  >
                    <Icon icon={Minus} size={16} />
                  </Button>
                  <span
                    className="flex min-w-[2rem] items-center justify-center text-sm font-semibold"
                    aria-label="current quantity"
                  >
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-0"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase quantity for ${item.product_name}`}
                  >
                    <Icon icon={Plus} size={16} />
                  </Button>
                </div>

                <span className="min-w-[80px] text-right text-base font-bold text-primary">
                  ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.product_name || item.product_id} from cart`}
                >
                  <Icon icon={Trash2} size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm text-text-primary">
                <span>Subtotal</span>
                <span>${Number(subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-primary">
                <span>IVA (10%)</span>
                <span>${Number(tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-primary pt-4 text-lg font-bold text-primary">
                <span>Total</span>
                <span>${Number(total).toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <label htmlFor="shipping-address" className="text-sm font-medium text-text-primary">
                  Dirección de envío
                </label>
                <input
                  id="shipping-address"
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Calle y número, ciudad, código postal"
                  className="w-full rounded-lg border-2 border-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full gap-2"
                disabled={!shippingAddress.trim() || isProcessing}
                onClick={handleMpCheckout}
              >
                {isProcessing ? (
                  <Icon icon={Loader2} size={18} className="animate-spin" />
                ) : (
                  <Icon icon={CreditCard} size={18} />
                )}
                {isProcessing ? "Procesando..." : "Pagar con MercadoPago"}
              </Button>
              <Link
                to="/products"
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-border bg-surface-card px-4 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-surface-alt"
              >
                <Icon icon={ArrowLeft} size={16} />
                Seguir comprando
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
