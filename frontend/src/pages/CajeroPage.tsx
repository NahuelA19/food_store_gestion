/**
 * CajeroPage — Panel del Cajero
 *
 * Muestra todos los pedidos activos (excepto CANCELADO y ENTREGADO).
 * Permite cambiar estado y registrar cobros en efectivo.
 */

import { useState, useCallback } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/authStore";
import { Package, X, ChefHat, Clock } from "lucide-react";
import type { OrderDetail } from "../types/order";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "info" | "neutral" | "success" | "danger" }> = {
  pendiente: { label: "Pendiente", variant: "warning" },
  pending: { label: "Pendiente", variant: "warning" },
  confirmado: { label: "Confirmado", variant: "info" },
  confirmed: { label: "Confirmado", variant: "info" },
  en_prep: { label: "En preparación", variant: "neutral" },
  preparando: { label: "En preparación", variant: "neutral" },
  listo: { label: "Listo para despachar", variant: "success" },
  en_camino: { label: "En camino", variant: "info" },
  shipped: { label: "En camino", variant: "info" },
  entregado: { label: "Entregado", variant: "success" },
  delivered: { label: "Entregado", variant: "success" },
  cancelado: { label: "Cancelado", variant: "danger" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

const ACTIVE_STATUSES = ["pendiente", "pending", "confirmed", "confirmado", "en_prep", "preparando", "listo", "en_camino", "shipped"];

// Returns the FSM estado_codigo from a display status
function toFSMStatus(s: string): string {
  const map: Record<string, string> = {
    pending: "PENDIENTE",
    pendiente: "PENDIENTE",
    confirmed: "CONFIRMADO",
    confirmado: "CONFIRMADO",
    en_prep: "EN_PREP",
    preparando: "EN_PREP",
    listo: "LISTO",
    en_camino: "EN_CAMINO",
    enviado: "EN_CAMINO",
    shipped: "EN_CAMINO",
    entregado: "ENTREGADO",
    delivered: "ENTREGADO",
    cancelado: "CANCELADO",
    cancelled: "CANCELADO",
  };
  return map[s.toLowerCase()] ?? s.toUpperCase();
}

function useAllOrders() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders?limit=100`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ items: OrderDetail[] }>(res);
      // Filter to active statuses only
      const active = (data.items ?? []).filter((o) =>
        ACTIVE_STATUSES.includes((o.status as string).toLowerCase())
      );
      setOrders(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar pedidos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { orders, isLoading, error, fetchOrders };
}

export function CajeroPage() {
  const { orders, isLoading, error, fetchOrders } = useAllOrders();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load on mount
  if (!hasLoaded) {
    setHasLoaded(true);
    fetchOrders();
  }

  async function fetchOrderDetail(id: number) {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderDetail>(res);
  }

  async function handleStatusChange(orderId: number, newStatus: string) {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      await handleResponse(res);
      const updated = await fetchOrderDetail(orderId);
      setSelectedOrder(updated);
      await fetchOrders();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setActionLoading(false);
      setConfirmCancel(false);
    }
  }

  async function handlePayCash(orderId: number) {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pay-cash`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      await handleResponse(res);
      const updated = await fetchOrderDetail(orderId);
      setSelectedOrder(updated);
      await fetchOrders();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al registrar pago");
    } finally {
      setActionLoading(false);
    }
  }

  const statusKey = (s: string) => s?.toLowerCase() ?? "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Panel del Cajero
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Pedidos activos — haz click en uno para gestionarlo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading}>
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border-l-4 border-danger bg-danger/10 p-3 text-sm font-medium text-danger-dark">
          {error}
        </div>
      )}

      <div className={cn("flex gap-6", selectedOrder ? "flex-col lg:flex-row" : "")}>
        {/* Orders table */}
        <div className={cn("flex-1", selectedOrder ? "lg:w-1/2" : "w-full")}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                    <Icon icon={Package} size={28} className="text-text-muted" />
                  </div>
                  <p className="text-lg font-semibold text-text-primary">No hay pedidos activos</p>
                  <p className="text-sm text-text-muted mt-1">Los pedidos nuevos aparecerán aquí</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Pedido</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Cliente</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Total</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Estado</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Pago</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => { setSelectedOrder(order); setActionError(null); setConfirmCancel(false); }}
                          className={cn(
                            "border-b border-border last:border-0 cursor-pointer transition-colors active:bg-brand-500/20 dark:active:bg-brand-900/40",
                            selectedOrder?.id === order.id
                              ? "bg-brand-500/20 dark:bg-brand-900/30"
                              : "hover:bg-surface-alt/50"
                          )}
                        >
                          <td className="px-4 py-3 font-semibold text-text-primary">#{order.id}</td>
                          <td className="px-4 py-3 text-text-secondary">{order.user_email ?? `#${order.user_id}`}</td>
                          <td className="px-4 py-3 font-semibold text-text-primary">${Number(order.total_amount).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_CONFIG[statusKey(order.status)]?.variant ?? "neutral"} size="sm">
                              {STATUS_CONFIG[statusKey(order.status)]?.label ?? order.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{order.payment_method ?? "-"}</td>
                          <td className="px-4 py-3 text-text-secondary">{order.created_at?.split("T")[0] ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order detail panel */}
        {selectedOrder && (
          <div className="lg:w-96 shrink-0">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-text-primary">
                    Pedido #{selectedOrder.id}
                  </h2>
                  <button
                    onClick={() => { setSelectedOrder(null); setConfirmCancel(false); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-alt hover:text-text-primary transition-all"
                  >
                    <Icon icon={X} size={16} />
                  </button>
                </div>

                {/* Status + payment */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={STATUS_CONFIG[statusKey(selectedOrder.status)]?.variant ?? "neutral"} size="sm">
                    {STATUS_CONFIG[statusKey(selectedOrder.status)]?.label ?? selectedOrder.status}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {selectedOrder.payment_method === "MERCADOPAGO"
                      ? "MercadoPago"
                      : selectedOrder.payment_method === "EFECTIVO"
                      ? "Efectivo"
                      : selectedOrder.payment_method ?? "Sin método"}
                  </Badge>
                  {selectedOrder.payment_status && (
                    <Badge variant={selectedOrder.payment_status === "approved" ? "success" : "warning"} size="sm">
                      {selectedOrder.payment_status === "approved" ? "Pagado" : "Pago pendiente"}
                    </Badge>
                  )}
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Ítems</p>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <ul className="space-y-1.5">
                      {selectedOrder.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary font-medium">
                            {item.quantity}x {item.product_name ?? `Producto #${item.product_id}`}
                          </span>
                          <span className="text-text-secondary">${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text-muted">Sin ítems cargados</p>
                  )}
                  <div className="border-t border-border mt-2 pt-2 flex items-center justify-between font-bold text-text-primary">
                    <span>Total</span>
                    <span>${Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Status history */}
                {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Historial</p>
                    <ul className="space-y-1">
                      {selectedOrder.status_history.map((h) => (
                        <li key={h.id} className="text-xs text-text-secondary">
                          <span className="font-medium text-text-primary">{h.estado_hasta}</span>
                          {h.motivo && <span> — {h.motivo}</span>}
                          <span className="ml-1 text-text-muted">{h.created_at?.split("T")[0]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error */}
                {actionError && (
                  <div className="rounded-lg border-l-4 border-danger bg-danger/10 p-2.5 text-xs font-medium text-danger-dark">
                    {actionError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  {/* Pay cash button */}
                  {selectedOrder.payment_method === "EFECTIVO" && selectedOrder.payment_status === "pending" && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                      disabled={actionLoading}
                      onClick={() => handlePayCash(selectedOrder.id)}
                    >
                      Cobrar ${Number(selectedOrder.total_amount).toFixed(2)} en efectivo
                    </Button>
                  )}

                  {/* Status transitions for cajero */}
                  {(() => {
                    const fsm = toFSMStatus(selectedOrder.status as string);
                    const isPaid = selectedOrder.payment_status === "approved";
                    return (
                      <>
                        {(fsm === "CONFIRMADO" || fsm === "EN_PREP") && (
                          <div className="rounded-lg border border-border bg-surface-alt px-4 py-3 flex items-start gap-3">
                            <Icon
                              icon={fsm === "EN_PREP" ? ChefHat : Clock}
                              size={18}
                              className="mt-0.5 shrink-0 text-text-muted"
                            />
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                {fsm === "EN_PREP" ? "En preparación" : "Pendiente de cocina"}
                              </p>
                              <p className="text-xs text-text-muted mt-0.5">
                                {fsm === "EN_PREP"
                                  ? "El chef está preparando el pedido. El botón de despacho se habilitará cuando marque el pedido como listo."
                                  : "El pedido aún no fue tomado por cocina. El botón de despacho se habilitará cuando el chef finalice la preparación."}
                              </p>
                            </div>
                          </div>
                        )}
                        {fsm === "LISTO" && (
                          <>
                            {!isPaid && (
                              <p className="text-xs text-warning font-medium text-center">
                                El pedido no puede despacharse hasta que el pago esté confirmado.
                              </p>
                            )}
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={actionLoading || !isPaid}
                              onClick={() => handleStatusChange(selectedOrder.id, "en_camino")}
                            >
                              Despachar (en camino)
                            </Button>
                          </>
                        )}
                        {fsm === "EN_CAMINO" && (
                          <>
                            {!isPaid && (
                              <p className="text-xs text-warning font-medium text-center">
                                El pedido no puede entregarse hasta que el pago esté confirmado.
                              </p>
                            )}
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={actionLoading || !isPaid}
                              onClick={() => handleStatusChange(selectedOrder.id, "delivered")}
                            >
                              Marcar como entregado
                            </Button>
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* Cancel */}
                  {!["ENTREGADO", "CANCELADO"].includes(toFSMStatus(selectedOrder.status as string)) && (
                    <>
                      {!confirmCancel ? (
                        <Button
                          variant="ghost"
                          className="w-full text-danger hover:bg-danger/10"
                          disabled={actionLoading}
                          onClick={() => setConfirmCancel(true)}
                        >
                          Cancelar pedido
                        </Button>
                      ) : (
                        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 space-y-2">
                          <p className="text-sm font-semibold text-danger">¿Confirmar cancelación?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-danger hover:bg-danger/90 text-white"
                              disabled={actionLoading}
                              onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                            >
                              Sí, cancelar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              disabled={actionLoading}
                              onClick={() => setConfirmCancel(false)}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
