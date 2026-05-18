import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "../../context/CartContext";
import { useCartUIStore } from "../../store/cartUIStore";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  Loader2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import type { CartItemResponse } from "../../types/cart";

/* ─── Palette for product color placeholders ─── */
const ITEM_COLORS = [
  "from-indigo-500/30 to-purple-500/30",
  "from-brand-500/30 to-teal-500/30",
  "from-rose-500/30 to-pink-500/30",
  "from-amber-500/30 to-orange-500/30",
  "from-emerald-500/30 to-teal-500/30",
];
function itemColor(id: number) {
  return ITEM_COLORS[id % ITEM_COLORS.length];
}

/* ─── Single cart item row ─── */

interface CartItemRowProps {
  item: CartItemResponse;
  onIncrease: (item: CartItemResponse) => Promise<void>;
  onDecrease: (item: CartItemResponse) => Promise<void>;
  onRemove: (item: CartItemResponse) => Promise<void>;
}

function CartItemRow({ item, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const [loadingInc, setLoadingInc] = useState(false);
  const [loadingDec, setLoadingDec] = useState(false);
  const [loadingRem, setLoadingRem] = useState(false);

  const handleIncrease = async () => {
    setLoadingInc(true);
    try { await onIncrease(item); } finally { setLoadingInc(false); }
  };

  const handleDecrease = async () => {
    setLoadingDec(true);
    try { await onDecrease(item); } finally { setLoadingDec(false); }
  };

  const handleRemove = async () => {
    setLoadingRem(true);
    try { await onRemove(item); } finally { setLoadingRem(false); }
  };

  const subtotal = Number(item.unit_price) * item.quantity;

  return (
    <div
      className="flex items-center gap-3 py-3 last:border-0"
      style={{ borderBottom: "1px solid var(--cd-border)" }}
    >
      {/* Color placeholder */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
          itemColor(item.product_id)
        )}
      >
        <Icon icon={Package} size={20} className="text-white/70" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--cd-text)" }}
        >
          {item.product_name || `Producto #${item.product_id}`}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--cd-text-sub)" }}>
          ${Number(item.unit_price).toFixed(2)} c/u
        </p>

        {/* Qty controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleDecrease}
            disabled={loadingDec || loadingInc}
            className="flex h-6 w-6 items-center justify-center rounded-md transition-all disabled:opacity-40"
            style={{
              background: "var(--cd-qty-bg)",
              color: "var(--cd-qty-color)",
            }}
            aria-label="Disminuir cantidad"
          >
            {loadingDec
              ? <Loader2 size={10} className="animate-spin" />
              : <Minus size={10} />
            }
          </button>

          <span
            className="min-w-[1.5rem] text-center text-sm font-bold"
            style={{ color: "var(--cd-text)" }}
          >
            {item.quantity}
          </span>

          <button
            onClick={handleIncrease}
            disabled={loadingInc || loadingDec}
            className="flex h-6 w-6 items-center justify-center rounded-md transition-all disabled:opacity-40"
            style={{
              background: "var(--cd-qty-bg)",
              color: "var(--cd-qty-color)",
            }}
            aria-label="Aumentar cantidad"
          >
            {loadingInc
              ? <Loader2 size={10} className="animate-spin" />
              : <Plus size={10} />
            }
          </button>
        </div>
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-sm font-bold" style={{ color: "var(--cd-price)" }}>
          ${subtotal.toFixed(2)}
        </span>
        <button
          onClick={handleRemove}
          disabled={loadingRem}
          className="transition-colors"
          style={{ color: "var(--cd-remove)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cd-remove-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cd-remove)")}
          aria-label="Eliminar del carrito"
        >
          {loadingRem
            ? <Loader2 size={14} className="animate-spin" />
            : <Trash2 size={14} />
          }
        </button>
      </div>
    </div>
  );
}

/* ─── Main CartDrawer ─── */

export function CartDrawer() {
  const { isOpen, close } = useCartUIStore();
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartContext();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [clearLoading, setClearLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const handleIncrease = async (item: CartItemResponse) => {
    await updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = async (item: CartItemResponse) => {
    if (item.quantity <= 1) {
      await removeItem(item.id);
    } else {
      await updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = async (item: CartItemResponse) => {
    await removeItem(item.id);
  };

  const handleClear = async () => {
    if (!window.confirm("¿Vaciar el carrito?")) return;
    setClearLoading(true);
    try { await clearCart(); } finally { setClearLoading(false); }
  };

  const handleCheckout = () => {
    close();
    navigate("/cart");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={cn(
          "cart-drawer",
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col transition-transform duration-300 ease-in-out",
          "shadow-2xl backdrop-blur-2xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ borderLeft: "1px solid var(--cd-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--cd-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "var(--cd-icon-bg)",
                color: "var(--cd-icon-color)",
              }}
            >
              <Icon icon={ShoppingCart} size={18} />
            </div>
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: "var(--cd-text)" }}
              >
                Tu Carrito
              </h2>
              <p className="text-xs" style={{ color: "var(--cd-text-muted)" }}>
                {itemCount === 0
                  ? "Vacío"
                  : `${itemCount} ${itemCount === 1 ? "producto" : "productos"}`}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
            style={{ color: "var(--cd-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--cd-text)";
              e.currentTarget.style.background = "var(--cd-icon-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--cd-text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Cerrar carrito"
          >
            <Icon icon={X} size={18} />
          </button>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-5 py-2 scrollbar-thin">
          {isLoading && items.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--cd-icon-color)" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                style={{ background: "var(--cd-icon-bg)", color: "var(--cd-icon-color)" }}
              >
                <Icon icon={ShoppingBag} size={28} />
              </div>
              <p className="text-base font-semibold" style={{ color: "var(--cd-text)" }}>
                Carrito vacío
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--cd-text-sub)" }}>
                Agregá productos para empezar
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                style={{
                  borderColor: "var(--cd-icon-color)",
                  color: "var(--cd-icon-color)",
                }}
                onClick={() => { close(); navigate("/products"); }}
              >
                Ver productos
              </Button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — only show when items exist */}
        {items.length > 0 && (
          <div
            className="px-5 py-4 space-y-4"
            style={{ borderTop: "1px solid var(--cd-border)" }}
          >
            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between" style={{ color: "var(--cd-text-sub)" }}>
                <span>Subtotal</span>
                <span>${Number(subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ color: "var(--cd-text-sub)" }}>
                <span>IVA (10%)</span>
                <span>${Number(tax).toFixed(2)}</span>
              </div>
              <div
                className="flex justify-between text-base font-bold pt-2"
                style={{ borderTop: "1px solid var(--cd-border)" }}
              >
                <span style={{ color: "var(--cd-text)" }}>Total</span>
                <span style={{ color: "var(--cd-total-price)" }}>
                  ${Number(total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="default"
                className="w-full"
                onClick={handleCheckout}
              >
                Continuar compra
                <Icon icon={ArrowRight} size={16} className="ml-1" />
              </Button>
              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all"
                style={{ color: "var(--cd-clear-color)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--cd-clear-hover-color)";
                  e.currentTarget.style.background = "var(--cd-clear-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--cd-clear-color)";
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={handleClear}
                disabled={clearLoading}
              >
                {clearLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Trash2 size={14} />
                }
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
