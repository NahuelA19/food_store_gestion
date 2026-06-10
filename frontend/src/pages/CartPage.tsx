import { useState } from "react";
import { flushSync } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { useCartContext } from "../context/CartContext";
import { usePaymentStore } from "../store/paymentStore";
import { useAuthStore } from "../store/authStore";
import { paymentApi } from "../api/paymentApi";
import { CardPaymentForm } from "../components/CardPaymentForm";
import { ShoppingBag, Package, Trash2, Plus, Minus, ArrowLeft, CreditCard, Loader2, Landmark, Banknote } from "lucide-react";

type PaymentMethod = "redirect" | "card";

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
  const user = useAuthStore((s) => s.user);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleMpCheckout = async () => {
    if (!shippingAddress.trim()) return;
    if (!accessToken) return;
    setIsProcessing(true);
    let redirecting = false;
    try {
      const checkoutResult = await checkout({ shipping_address: shippingAddress, payment_method: "MERCADOPAGO" });
      const orderId = checkoutResult.order_id;
      if (!orderId) throw new Error("No se pudo crear la orden");
      const { preference_id, init_point } = await paymentApi.createPreference(orderId, accessToken);
      setPreference(preference_id);
      redirecting = true;
      flushSync(() => setIsRedirecting(true));
      window.location.href = init_point;
    } catch (err) {
      console.error("Checkout error:", err);
      setCardError(err instanceof Error ? err.message : "Error al iniciar el pago con MercadoPago");
    } finally {
      if (!redirecting) setIsProcessing(false);
    }
  };

  const handleCashCheckout = async () => {
    if (!shippingAddress.trim()) return;
    if (!accessToken) return;
    setIsProcessing(true);
    try {
      const checkoutResult = await checkout({ shipping_address: shippingAddress, payment_method: "EFECTIVO" });
      const orderId = checkoutResult.order_id;
      if (!orderId) throw new Error("No se pudo crear la orden");
      navigate(`/orders/${orderId}`);
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "Error al crear la orden");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardCheckout = async () => {
    if (!shippingAddress.trim()) return;
    if (!accessToken) return;
    setIsProcessing(true);
    setCardError(null);
    try {
      const checkoutResult = await checkout({ shipping_address: shippingAddress });
      const orderId = checkoutResult.order_id;
      if (!orderId) throw new Error("No se pudo crear la orden");
      setCurrentOrderId(orderId);
      setPaymentMethod("card");
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "Error al crear la orden");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardSuccess = (paymentId: number) => {
    navigate(`/payment/success?payment_id=${paymentId}`);
  };

  const handleCardError = (errMsg: string) => {
    setCardError(errMsg);
    setPaymentMethod(null);
  };

  const handleBackToMethods = () => {
    setPaymentMethod(null);
    setCurrentOrderId(null);
    setCardError(null);
  };

  const handleSimulatePayment = async () => {
    if (!shippingAddress.trim()) return;
    if (!accessToken) return;
    if (!currentOrderId) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/payments/simulate-payment?order_id=${currentOrderId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Simulación de pago falló");
      }

      // Pago exitoso - redirigir a success page
      const paymentId = currentOrderId;
      navigate(`/payment/success?payment_id=${paymentId}`);
    } catch (err) {
      console.error("Simulation error:", err);
      setCardError(err instanceof Error ? err.message : "Error en la simulación");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-base font-semibold text-text-muted">Cargando carrito...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12" role="alert">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-xl font-bold text-danger">Algo salió mal</h2>
            <p className="text-text-muted">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>Reintentar</Button>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
              >
                Ver productos
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show empty state when there's no active payment in progress.
  // After checkout(), the cart query is invalidated and returns 0 items,
  // but we still need to show the payment form (currentOrderId is set).
  if (items.length === 0 && !currentOrderId) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-20 text-center animate-fade-in">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-600/10 border border-brand-600/20">
            <Icon icon={ShoppingBag} size={44} className="text-brand-400 opacity-70" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Tu carrito está vacío</h2>
          <p className="text-sm text-text-muted mt-1.5">Explorá nuestro catálogo y encontrá algo rico</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white shadow-md px-8 py-3 text-sm font-bold transition-all duration-200"
        >
          <Icon icon={ShoppingBag} size={16} />
          Ver productos
        </Link>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
        <Icon icon={Loader2} size={40} className="animate-spin text-primary" />
        <p className="text-lg font-semibold text-text-primary">Redirigiendo a Mercado Pago...</p>
        <p className="text-sm text-text-muted">No cierres esta ventana</p>
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
              aria-label={`Item: ${item.product_name || `Producto ${item.product_id}`}`}
            >
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 border border-brand-600/15">
                    <Icon icon={Package} size={22} className="text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-primary">
                      {item.product_name || `Producto #${item.product_id}`}
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
          {paymentMethod === "card" && currentOrderId ? (
             <div className="space-y-4">
               <CardPaymentForm
                 amount={Number(total)}
                 orderId={currentOrderId}
                 payerEmail={user?.email ?? ""}
                 onSuccess={handleCardSuccess}
                 onError={handleCardError}
               />
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full"
                 disabled={isProcessing}
                 onClick={handleSimulatePayment}
               >
                 {isProcessing ? (
                   <Icon icon={Loader2} size={18} className="animate-spin" />
                 ) : (
                   <Icon icon={CreditCard} size={18} />
                 )}
                 {isProcessing ? "Simulando..." : "Simular Compra"}
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full"
                 onClick={handleBackToMethods}
               >
                 <Icon icon={ArrowLeft} size={16} />
                 Volver a métodos de pago
               </Button>
            </div>
          ) : (
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

                {cardError && (
                  <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
                    {cardError}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  {/* MercadoPago */}
                  <button
                    disabled={!shippingAddress.trim() || isProcessing}
                    onClick={handleMpCheckout}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white bg-[#009ee3] hover:bg-[#0090d0] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isProcessing ? (
                      <Icon icon={Loader2} size={18} className="animate-spin" />
                    ) : (
                      <Icon icon={CreditCard} size={18} />
                    )}
                    {isProcessing ? "Procesando..." : "Pagar con MercadoPago"}
                  </button>

                  {/* Tarjeta */}
                  <button
                    disabled={!shippingAddress.trim() || isProcessing}
                    onClick={handleCardCheckout}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isProcessing ? (
                      <Icon icon={Loader2} size={18} className="animate-spin" />
                    ) : (
                      <Icon icon={Landmark} size={18} />
                    )}
                    Pagar con Tarjeta
                  </button>

                  {/* Efectivo */}
                  <button
                    disabled={!shippingAddress.trim() || isProcessing}
                    onClick={handleCashCheckout}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isProcessing ? (
                      <Icon icon={Loader2} size={18} className="animate-spin" />
                    ) : (
                      <Icon icon={Banknote} size={18} />
                    )}
                    Pagar en efectivo
                  </button>
                </div>

                <Link
                  to="/products"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
                >
                  <Icon icon={ArrowLeft} size={16} />
                  Seguir comprando
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
