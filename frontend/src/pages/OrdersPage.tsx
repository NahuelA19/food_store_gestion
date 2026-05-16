/**
 * OrdersPage — Order list with status + branch filtering and server-side search
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { cn } from "@/lib/utils";
import { useOrders } from "../hooks/useOrders";
import { useBranches } from "../hooks/useBranches";
import { useAuthStore } from "../store/authStore";
import type { Order as OrderType } from "../types/order";
import { Search, X, Package, Building2, ChevronDown } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "info" | "neutral" | "success" | "danger" }> = {
  pendiente: { label: "Pendiente de Pago", variant: "warning" },
  pending: { label: "Pendiente de Pago", variant: "warning" },
  payment_pending: { label: "Pendiente de Pago", variant: "warning" },
  pago_fallido: { label: "Pago Fallido", variant: "danger" },
  payment_failed: { label: "Pago Fallido", variant: "danger" },
  pagado: { label: "Pagado", variant: "info" },
  paid: { label: "Pagado", variant: "info" },
  confirmado: { label: "Confirmado", variant: "info" },
  confirmed: { label: "Confirmado", variant: "info" },
  preparando: { label: "Preparando", variant: "neutral" },
  preparing: { label: "Preparando", variant: "neutral" },
  en_prep: { label: "Preparando", variant: "neutral" },
  listo: { label: "Listo", variant: "success" },
  ready: { label: "Listo", variant: "success" },
  enviado: { label: "Enviado", variant: "info" },
  en_camino: { label: "Enviado", variant: "info" },
  shipped: { label: "Enviado", variant: "info" },
  entregado: { label: "Entregado", variant: "success" },
  delivered: { label: "Entregado", variant: "success" },
  cancelado: { label: "Cancelado", variant: "danger" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "payment_pending", label: "Pendiente Pago" },
  { key: "confirmed", label: "Confirmado" },
  { key: "preparing", label: "Preparando" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregado" },
  { key: "cancelled", label: "Cancelado" },
];

interface OrderRow {
  id: number;
  customer: string;
  status: string;
  total: number;
  date: string;
  branch_id?: number;
}

export function OrdersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const { branches } = useBranches();

  // Debounce search input 350 ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(inputValue);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Reset page on filter change
  const handleFilterChange = (key: string) => {
    setActiveFilter(key);
    setPage(1);
  };

  // Close branch dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const apiStatus = activeFilter === "all" ? undefined : activeFilter;
  const { orders: apiOrders, isLoading, totalPages } = useOrders(
    page,
    apiStatus,
    debouncedSearch || undefined,
    isAdmin ? selectedBranchId : undefined
  );

  const orders = useMemo((): OrderRow[] =>
    apiOrders.map((o: OrderType) => ({
      id: o.id,
      customer: o.user_email || `Usuario #${o.user_id}`,
      status: o.status,
      total: Number(o.total_amount),
      date: o.created_at ? o.created_at.split("T")[0] : "",
      branch_id: o.branch_id ?? undefined,
    })),
  [apiOrders]);

  const selectedBranchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.name ?? "Sucursal"
    : "Todas las sucursales";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Pedidos</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestioná los pedidos de todas las sucursales
        </p>
      </div>

      {/* Search + Branch filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Icon
            icon={Search}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, estado..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-surface-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(""); setDebouncedSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <Icon icon={X} size={14} />
            </button>
          )}
        </div>

        {/* Branch filter — admin only */}
        {isAdmin && (
          <div ref={branchDropdownRef} className="relative">
            <button
              onClick={() => setBranchDropdownOpen((v) => !v)}
              className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border bg-surface-card text-sm font-semibold text-text-primary hover:border-brand-300 transition-all duration-200 min-w-[200px]"
            >
              <Icon icon={Building2} size={15} className="text-text-muted shrink-0" />
              <span className="flex-1 text-left truncate">{selectedBranchName}</span>
              <Icon
                icon={ChevronDown}
                size={14}
                className={cn("text-text-muted transition-transform duration-200 shrink-0", branchDropdownOpen && "rotate-180")}
              />
            </button>
            {branchDropdownOpen && (
              <div className="dropdown absolute left-0 top-full mt-1.5 w-56 rounded-xl p-1.5 animate-scale-in z-50">
                <button
                  onClick={() => { setSelectedBranchId(undefined); setPage(1); setBranchDropdownOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                    !selectedBranchId
                      ? "bg-brand-500/25 text-brand-200"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  Todas las sucursales
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBranchId(b.id); setPage(1); setBranchDropdownOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                      selectedBranchId === b.id
                        ? "bg-brand-500/25 text-brand-200"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
              activeFilter === f.key
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
            )}
          >
            {f.key !== "all" ? (
              <Badge variant={STATUS_CONFIG[f.key]?.variant ?? "neutral"} size="sm">
                {STATUS_CONFIG[f.key]?.label ?? f.label}
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
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={Package} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">
                No se encontraron pedidos
              </p>
              <p className="text-sm text-text-muted mt-1">
                {debouncedSearch
                  ? "Intentá con otro término de búsqueda"
                  : activeFilter !== "all"
                  ? "No hay pedidos con el estado seleccionado"
                  : "No hay pedidos registrados"}
              </p>
              {debouncedSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setInputValue(""); setDebouncedSearch(""); }}
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
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Pedido</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider hidden md:table-cell">Fecha</th>
                    {isAdmin && (
                      <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
                    )}
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">#{order.id}</span>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{order.customer}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={STATUS_CONFIG[order.status.toLowerCase()]?.variant ?? "neutral"}
                          size="sm"
                        >
                          {STATUS_CONFIG[order.status.toLowerCase()]?.label ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                        {order.date}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                          {order.branch_id
                            ? branches.find((b) => b.id === order.branch_id)?.name ?? `#${order.branch_id}`
                            : "-"}
                        </td>
                      )}
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
