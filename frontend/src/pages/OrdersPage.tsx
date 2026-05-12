/**
 * OrdersPage — Order list with status filtering
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { cn } from "@/lib/utils";
import { useOrders } from "../hooks/useOrders";
import type { Order as OrderType } from "../types/order";
import {
  Search,
  X,
  Package,
} from "lucide-react";

/* ─── Static demo data (fallback) ─── */

interface OrderRow {
  id: number;
  customer: string;
  status: string;
  total: number;
  date: string;
}

const FALLBACK_ORDERS: OrderRow[] = [
  { id: 1042, customer: "María García", status: "pending", total: 156.0, date: "2026-05-09" },
  { id: 1041, customer: "Carlos López", status: "confirmed", total: 89.5, date: "2026-05-09" },
  { id: 1040, customer: "Ana Martínez", status: "preparing", total: 234.0, date: "2026-05-09" },
  { id: 1039, customer: "Pedro Sánchez", status: "pending", total: 67.8, date: "2026-05-08" },
  { id: 1038, customer: "Laura Rodríguez", status: "confirmed", total: 192.0, date: "2026-05-08" },
  { id: 1037, customer: "Sofía Fernández", status: "delivered", total: 45.0, date: "2026-05-08" },
  { id: 1036, customer: "Diego Morales", status: "ready", total: 178.5, date: "2026-05-08" },
  { id: 1035, customer: "Valentina Torres", status: "cancelled", total: 92.0, date: "2026-05-07" },
  { id: 1034, customer: "Jorge Ruiz", status: "delivered", total: 215.0, date: "2026-05-07" },
  { id: 1033, customer: "Camila Vargas", status: "delivered", total: 134.5, date: "2026-05-07" },
  { id: 1032, customer: "Andrés Castro", status: "preparing", total: 78.0, date: "2026-05-07" },
  { id: 1031, customer: "Isabella Ríos", status: "pending", total: 299.0, date: "2026-05-06" },
];

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

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "payment_pending", label: "Pendiente Pago" },
  { key: "confirmed", label: "Confirmado" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregado" },
  { key: "cancelled", label: "Cancelado" },
];

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const apiStatus = activeFilter === "all" ? undefined : activeFilter;
  const { orders: apiOrders, isLoading, totalPages } = useOrders(page, apiStatus);

  const orders = useMemo((): OrderRow[] => {
    if (apiOrders.length > 0) {
      return apiOrders.map((o: OrderType) => ({
        id: o.id,
        customer: `Usuario #${o.user_id}`,
        status: o.status,
        total: Number(o.total_amount),
        date: o.created_at ? o.created_at.split("T")[0] : "",
      }));
    }
    return [];
  }, [apiOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders.length > 0 ? orders : FALLBACK_ORDERS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          `#${o.id}`.includes(q)
      );
    }

    return result;
  }, [orders, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Pedidos
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Gestiona los pedidos de todas las sucursales
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Icon
            icon={Search}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-surface-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <Icon icon={X} size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
              activeFilter === f.key
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
            )}
          >
            {f.key !== "all" ? (
              <Badge variant={STATUS_CONFIG[f.key].variant} size="sm" className="mr-1.5">
                {STATUS_CONFIG[f.key].label}
              </Badge>
            ) : (
              <span>Todos</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={Package} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">
                No se encontraron pedidos
              </p>
              <p className="text-sm text-text-muted mt-1">
                {searchQuery
                  ? "Intenta con otro término de búsqueda"
                  : "No hay pedidos con el filtro seleccionado"}
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Items
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-text-primary">
                            #{order.id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-primary">
                          {order.customer}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_CONFIG[order.status]?.variant || "neutral"} size="sm">
                            <span className="sr-only">Estado: </span>
                            {STATUS_CONFIG[order.status]?.label || order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          -
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {order.date}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-text-secondary">-</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-text-primary">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-muted">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
