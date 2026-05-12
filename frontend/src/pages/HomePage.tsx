/**
 * HomePage — Admin dashboard with KPIs, pending orders, and branch overview
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { useDashboardStats } from "../hooks/useDashboard";
import { useOrders } from "../hooks/useOrders";
import { useBranches } from "../hooks/useBranches";
import type { Branch } from "../types/branch";
import {
  ShoppingBag,
  Package,
  ArrowRight,
  DollarSign,
  Clock,
  Building2,
  TrendingUp,
  PlusCircle,
  FolderPlus,
  ListOrdered,
  Store,
} from "lucide-react";

/* ─── Static demo data (fallback) ─── */

interface KpiCard {
  icon: typeof Package;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color: string;
}

const FALLBACK_KPI: KpiCard[] = [
  {
    icon: ShoppingBag,
    label: "Pedidos Hoy",
    value: "48",
    change: "+12%",
    positive: true,
    color: "text-brand-600 bg-brand-100 dark:bg-brand-900/30",
  },
  {
    icon: DollarSign,
    label: "Ingresos Hoy",
    value: "$4,289",
    change: "+18%",
    positive: true,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    icon: Building2,
    label: "Sucursales Activas",
    value: "3",
    change: "100%",
    positive: true,
    color: "text-sky-600 bg-sky-100 dark:bg-sky-900/30",
  },
  {
    icon: Clock,
    label: "Pendientes",
    value: "12",
    change: "-5%",
    positive: true,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: Package,
    label: "Total Productos",
    value: "1,247",
    change: "+8",
    positive: true,
    color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
  },
  {
    icon: TrendingUp,
    label: "Mes Actual",
    value: "$48.5K",
    change: "+8.2%",
    positive: true,
    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
  },
];

interface OrderRow {
  id: number;
  customer: string;
  status: string;
  total: number;
}

const FALLBACK_ORDERS: OrderRow[] = [
  { id: 1042, customer: "María García", status: "pending", total: 156.0 },
  { id: 1041, customer: "Carlos López", status: "confirmed", total: 89.5 },
  { id: 1040, customer: "Ana Martínez", status: "preparing", total: 234.0 },
  { id: 1039, customer: "Pedro Sánchez", status: "pending", total: 67.8 },
  { id: 1038, customer: "Laura Rodríguez", status: "confirmed", total: 192.0 },
];

const STATUS_LABELS: Record<string, string> = {
  payment_pending: "Pendiente",
  payment_failed: "Pago Fallido",
  paid: "Pagado",
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_VARIANTS: Record<string, "warning" | "info" | "neutral" | "success" | "danger"> = {
  payment_pending: "warning",
  payment_failed: "danger",
  paid: "success",
  pending: "warning",
  confirmed: "info",
  preparing: "neutral",
  ready: "success",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

interface BranchSummary {
  id: number;
  name: string;
  address: string;
  status: "active" | "inactive";
}

const FALLBACK_BRANCHES: BranchSummary[] = [
  { id: 1, name: "Sucursal Central", address: "Av. Corrientes 1234", status: "active" },
  { id: 2, name: "Sucursal Norte", address: "Av. Cabildo 5678", status: "active" },
  { id: 3, name: "Sucursal Sur", address: "Av. Boedo 9012", status: "active" },
];

/* ─── Skeleton component ─── */

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Card>
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Card>
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { orders: apiOrders, isLoading: ordersLoading } = useOrders(1);
  const { branches: apiBranches, isLoading: branchesLoading } = useBranches();

  const loading = statsLoading && ordersLoading && branchesLoading;

  const kpiCards = useMemo((): KpiCard[] => {
    if (stats) {
      return [
        {
          icon: ShoppingBag,
          label: "Pedidos Hoy",
          value: String(stats.total_orders_today),
          change: "",
          positive: true,
          color: "text-brand-600 bg-brand-100 dark:bg-brand-900/30",
        },
        {
          icon: DollarSign,
          label: "Ingresos Hoy",
          value: `$${stats.total_revenue_today.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          change: "",
          positive: true,
          color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
          icon: Building2,
          label: "Sucursales Activas",
          value: String(stats.active_branches),
          change: "100%",
          positive: true,
          color: "text-sky-600 bg-sky-100 dark:bg-sky-900/30",
        },
        {
          icon: Clock,
          label: "Pendientes",
          value: String(stats.pending_orders),
          change: "",
          positive: true,
          color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        },
        {
          icon: Package,
          label: "Total Productos",
          value: String(stats.total_products),
          change: "",
          positive: true,
          color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
        },
        {
          icon: TrendingUp,
          label: "Mes Actual",
          value: `$${stats.monthly_revenue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          change: "",
          positive: true,
          color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
        },
      ];
    }
    return FALLBACK_KPI;
  }, [stats]);

  const recentOrders = useMemo((): OrderRow[] => {
    if (apiOrders.length > 0) {
      return apiOrders.slice(0, 5).map((o) => ({
        id: o.id,
        customer: `Usuario #${o.user_id}`,
        status: o.status,
        total: Number(o.total_amount),
      }));
    }
    return FALLBACK_ORDERS;
  }, [apiOrders]);

  const branchesSummary = useMemo((): BranchSummary[] => {
    if (apiBranches.length > 0) {
      return apiBranches.map((b: Branch) => ({
        id: b.id,
        name: b.name,
        address: b.address || "",
        status: b.is_active ? "active" as const : "inactive" as const,
      }));
    }
    return FALLBACK_BRANCHES;
  }, [apiBranches]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Panel de Control
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen general de tu restaurante
        </p>
      </div>

      {/* ═══ KPI METRICS ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon icon={stat.icon} size={20} />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    stat.positive
                      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "text-danger bg-danger-bg"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {stat.value}
              </p>
              <p className="text-sm text-text-muted mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="flex flex-wrap gap-3">
        <Link to="/products/new">
          <Button variant="default" className="gap-2">
            <PlusCircle size={16} />
            Nuevo Producto
          </Button>
        </Link>
        <Link to="/categories/new">
          <Button variant="default" className="gap-2">
            <FolderPlus size={16} />
            Nueva Categoría
          </Button>
        </Link>
        <Link to="/orders">
          <Button variant="secondary" className="gap-2">
            <ListOrdered size={16} />
            Ver Pedidos
          </Button>
        </Link>
        <Link to="/branches">
          <Button variant="outline" className="gap-2">
            <Store size={16} />
            Gestionar Sucursales
          </Button>
        </Link>
      </div>

      {/* ═══ TWO COLUMN LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-text-primary">
              Pedidos Recientes
            </h2>
            <Link
              to="/orders"
              className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Ver todos
              <Icon icon={ArrowRight} size={14} />
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
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
                      <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border-light last:border-0 hover:bg-surface-alt/50 transition-colors"
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
                          <Badge variant={STATUS_VARIANTS[order.status] || "neutral"} size="sm">
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          -
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-text-primary">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-text-primary">
            Actividad Reciente
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 pb-3 border-b border-border-light last:border-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <Icon icon={ShoppingBag} size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary">
                        Pedido #{order.id} — {order.customer}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-4">
                  Sin actividad reciente
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ BRANCH OVERVIEW ═══ */}
      <div>
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">
          Resumen de Sucursales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branchesSummary.map((branch) => (
            <Link key={branch.id} to={`/branches/${branch.id}`}>
              <Card variant="interactive">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                      <Icon icon={Building2} size={20} />
                    </div>
                    <Badge
                      variant={branch.status === "active" ? "success" : "danger"}
                      size="sm"
                    >
                      {branch.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="font-display text-base font-bold text-text-primary">
                    {branch.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {branch.address}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
