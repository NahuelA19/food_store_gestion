/**
 * OrderDetailPage — Full order detail with status management
 */

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { useOrder, useUpdateOrderStatus } from "../hooks/useOrders";
import type { OrderStatus } from "../types/order";
import {
  ArrowLeft,
  ChevronDown,
  User,
  Package,
  CreditCard,
} from "lucide-react";

const STATUS_FLOW: OrderStatus[] = ["payment_pending", "paid", "confirmed", "shipped", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "info" | "neutral" | "success" | "danger" }> = {
  payment_pending: { label: "Pendiente de Pago", variant: "warning" },
  payment_failed: { label: "Pago Fallido", variant: "danger" },
  paid: { label: "Pagado", variant: "info" },
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "info" },
  preparing: { label: "Preparando", variant: "neutral" },
  ready: { label: "Listo", variant: "success" },
  shipped: { label: "Enviado", variant: "info" },
  delivered: { label: "Entregado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { order: apiOrder, isLoading, error } = useOrder(orderId);
  const { updateStatus, isLoading: isUpdating } = useUpdateOrderStatus();

  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const order = useMemo(() => {
    if (apiOrder) return apiOrder;
    return null;
  }, [apiOrder]);

  const resolvedStatus = order ? order.status : currentStatus;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
          <Icon icon={Package} size={28} className="text-text-muted" />
        </div>
        <p className="text-lg font-semibold text-text-primary">
          Pedido no encontrado
        </p>
        <p className="text-sm text-text-muted mt-1">
          {error ? error : `El pedido #${id} no existe`}
        </p>
        <Link to="/orders">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft size={16} />
            Volver a pedidos
          </Button>
        </Link>
      </div>
    );
  }

  const nextStatuses = STATUS_FLOW.slice(
    STATUS_FLOW.indexOf(resolvedStatus as OrderStatus) + 1
  );

  const isAtEnd =
    resolvedStatus === "delivered" || resolvedStatus === "cancelled";
  const availableStatuses = isAtEnd ? [] : [...nextStatuses, "cancelled" as OrderStatus];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setStatusOpen(false);
    setStatusError(null);
    try {
      await updateStatus(order!.id, newStatus);
      setCurrentStatus(newStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Error al actualizar estado");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon icon={ArrowLeft} size={16} />
        Volver a pedidos
      </Link>

      {/* Order header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Pedido #{order.id}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {new Date(order.created_at).toLocaleString("es-AR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_CONFIG[resolvedStatus]?.variant || "neutral"} size="default">
            <span className="sr-only">Estado: </span>
            {STATUS_CONFIG[resolvedStatus]?.label || resolvedStatus}
          </Badge>

          {/* Status dropdown */}
          {availableStatuses.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-card px-3.5 py-2 text-sm font-semibold text-text-primary hover:border-brand-300 transition-all duration-200"
              >
                Cambiar estado
                <ChevronDown size={14} className="text-text-muted" />
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-surface-card p-1.5 shadow-dropdown animate-scale-in z-50">
                  {availableStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s as OrderStatus)}
                      disabled={isUpdating}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 disabled:opacity-50"
                    >
                      <Badge variant={STATUS_CONFIG[s]?.variant || "neutral"} size="sm">
                        {STATUS_CONFIG[s]?.label || s}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-base font-bold text-text-primary mb-4">
                Items del Pedido
              </h3>
              <div className="divide-y divide-border-light">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-alt">
                        <Icon icon={Package} size={16} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {item.product_name || `Producto #${item.product_id}`}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.quantity} x ${Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {statusError && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-danger">{statusError}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Customer info + Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary">
                Cliente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                    <Icon icon={User} size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Usuario #{order.user_id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-base font-bold text-text-primary mb-4">
                Resumen
              </h3>
              <div className="space-y-2">
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-text-primary">Total</span>
                    <span className="text-base font-bold text-brand-600">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Icon icon={CreditCard} size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {order.payment_status ? `Pago: ${order.payment_status}` : "Estado de pago"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {order.updated_at ? new Date(order.updated_at).toLocaleString("es-AR") : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
