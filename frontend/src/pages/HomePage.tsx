/**
 * HomePage — Dashboard for both admin and regular users
 * - Admin: Shows KPIs, orders, branches
 * - User: Shows product catalog
 */

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { useDashboardStats } from "../hooks/useDashboard";
import { useOrders } from "../hooks/useOrders";
import { useBranches } from "../hooks/useBranches";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import type { Branch } from "../types/branch";
import type { Product } from "../types/product";
import { OrdersByStatusChart } from "../components/OrdersByStatusChart";
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
  ShoppingCart,
  Check,
  AlertCircle,
  Heart,
} from "lucide-react";
import { StoreHero } from "../components/layout/StoreHero";

/* ─── ADMIN DASHBOARD COMPONENT ─── */

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

interface BranchSummary {
  id: number;
  name: string;
  address: string;
  status: "active" | "inactive";
}

const STATUS_LABELS: { [key: string]: string } = {
  PENDIENTE: "Pendiente de Pago",
  pendiente: "Pendiente de Pago",
  pending: "Pendiente de Pago",
  PAYMENT_PENDING: "Pendiente de Pago",
  pago_pendiente: "Pendiente de Pago",
  CONFIRMADO: "Confirmado",
  confirmado: "Confirmado",
  EN_PREP: "En Preparación",
  en_prep: "En Preparación",
  EN_CAMINO: "Enviado",
  en_camino: "Enviado",
  SHIPPED: "Enviado",
  shipped: "Enviado",
  ENTREGADO: "Entregado",
  entregado: "Entregado",
  CANCELADO: "Cancelado",
  cancelado: "Cancelado",
};

const STATUS_VARIANTS: { [key: string]: "warning" | "info" | "success" | "danger" } = {
  PENDIENTE: "warning",
  pendiente: "warning",
  pending: "warning",
  PAYMENT_PENDING: "warning",
  pago_pendiente: "warning",
  CONFIRMADO: "info",
  confirmado: "info",
  EN_PREP: "info",
  en_prep: "info",
  EN_CAMINO: "info",
  en_camino: "info",
  SHIPPED: "info",
  shipped: "info",
  ENTREGADO: "success",
  entregado: "success",
  CANCELADO: "danger",
  cancelado: "danger",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

function AdminDashboardPage() {
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
          change: `${stats.orders_today_change >= 0 ? "+" : ""}${stats.orders_today_change}%`,
          positive: stats.orders_today_change >= 0,
          color: "text-brand-600 bg-brand-100 dark:bg-brand-900/30",
        },
        {
          icon: DollarSign,
          label: "Ingresos Hoy",
          value: `$${stats.total_revenue_today.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          change: `${stats.revenue_today_change >= 0 ? "+" : ""}${stats.revenue_today_change}%`,
          positive: stats.revenue_today_change >= 0,
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
          change: `${stats.pending_orders_change >= 0 ? "+" : ""}${stats.pending_orders_change}%`,
          positive: stats.pending_orders_change <= 0,
          color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        },
        {
          icon: Package,
          label: "Total Productos",
          value: String(stats.total_products),
          change: `+${stats.total_products_change}`,
          positive: true,
          color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
        },
        {
          icon: TrendingUp,
          label: "Mes Actual",
          value: `$${stats.monthly_revenue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          change: `${stats.monthly_revenue_change >= 0 ? "+" : ""}${stats.monthly_revenue_change}%`,
          positive: stats.monthly_revenue_change >= 0,
          color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
        },
      ];
    }
    return FALLBACK_KPI;
  }, [stats]);

  // Only use real orders — don't link to fallback IDs that don't exist in the DB
  const recentOrders = useMemo((): OrderRow[] => {
    return apiOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.user_email || `Usuario #${o.user_id}`,
      status: o.status,
      total: Number(o.total_amount),
    }));
  }, [apiOrders]);

  // Only use real branches — don't link to fallback IDs that don't exist in the DB
  const branchesSummary = useMemo((): BranchSummary[] => {
    return apiBranches.map((b: Branch) => ({
      id: b.id,
      name: b.name,
      address: b.address || "",
      status: b.is_active ? "active" : "inactive",
    }));
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

      {/* KPI METRICS ROW */}
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

      {/* QUICK ACTIONS */}
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

      {/* TWO COLUMN LAYOUT */}
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
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                          No hay pedidos recientes
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
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
                            <Badge
                              variant={STATUS_VARIANTS[order.status.toLowerCase()] || "neutral"}
                              size="sm"
                            >
                              {STATUS_LABELS[order.status.toLowerCase()] || order.status}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders by Status Chart */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-text-primary">
            Estado de Pedidos
          </h2>
          <Card>
            <CardContent className="p-4">
              <OrdersByStatusChart
                data={stats?.orders_by_status ?? {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BRANCH OVERVIEW */}
      <div>
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">
          Resumen de Sucursales
        </h2>
        {branchesSummary.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-10">
              <p className="text-sm text-text-muted">No hay sucursales registradas</p>
            </CardContent>
          </Card>
        ) : (
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
                        variant={
                          branch.status === "active" ? "success" : "danger"
                        }
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
        )}
      </div>
    </div>
  );
}

/* ─── USER SHOP PAGE ─── */

function UserShopPage() {
  const { products, isLoading } = useProducts();
  const { addItem, isLoading: cartLoading } = useCart();
  const { items: wishlistItems, toggle: toggleWishlist } = useWishlist();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [favLoadingId, setFavLoadingId] = useState<number | null>(null);

  // Base set from server data, plus optimistic local overrides for instant feedback
  const baseFavIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.product_id)),
    [wishlistItems],
  );
  const [optimisticFavs, setOptimisticFavs] = useState<Set<number> | null>(null);
  const favoriteIds = optimisticFavs ?? baseFavIds;

  // Sort: favorited products first
  const sortedProducts = useMemo(() => {
    if (!products || favoriteIds.size === 0) return products;
    return [...products].sort((a, b) => {
      const aFav = favoriteIds.has(a.id) ? 1 : 0;
      const bFav = favoriteIds.has(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [products, favoriteIds]);

  // When server data catches up with optimistic state, clear the overlay
  useEffect(() => {
    if (!optimisticFavs) return;
    let shouldClear = true;
    for (const id of optimisticFavs) {
      if (baseFavIds.has(id) !== optimisticFavs.has(id)) {
        shouldClear = false;
        break;
      }
    }
    if (shouldClear) setOptimisticFavs(null);
  }, [baseFavIds, optimisticFavs]);

  const handleToggleFavorite = async (productId: number) => {
    setFavLoadingId(productId);

    // Optimistic: flip heart immediately
    setOptimisticFavs((prev) => {
      const current = prev ?? baseFavIds;
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

    // Fire real toggle — refetch will sync server state in background
    await toggleWishlist(productId);

    setFavLoadingId(null);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setAddingProductId(product.id);
      
      await addItem(product.id, 1);
      
      setSuccessMessage(`"${product.name}" agregado al carrito`);
      setAddingProductId(null);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al agregar al carrito";
      setErrorMessage(message);
      setAddingProductId(null);
      console.error("Error adding to cart:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col w-full bg-[#0c0a09]">
      <StoreHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 space-y-8">
        {/* Page header (optional now since we have a hero, but keeping a section title) */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">
            Más Populares
          </h2>
        </div>

      {/* Toast: Success */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl backdrop-blur-sm animate-slide-up">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <Check size={16} className="text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-emerald-400">
            {successMessage}
          </p>
        </div>
      )}

      {/* Toast: Error */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-xl backdrop-blur-sm animate-slide-up">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/20">
            <AlertCircle size={16} className="text-danger" />
          </div>
          <p className="text-sm font-semibold text-danger">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {sortedProducts && sortedProducts.length > 0 ? (
          sortedProducts.map((product: Product) => (
            <div
              key={product.id}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-surface/60 backdrop-blur-md border border-white/10 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ease-out"
            >
              {/* Image area */}
              <Link
                to={`/products/${product.id}`}
                className="relative w-full h-52 bg-gradient-to-br from-brand-900/40 to-accent/10 overflow-hidden block"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon
                      icon={Package}
                      size={52}
                      className="text-brand-300/50 group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Favorite button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(product.id);
                  }}
                  disabled={favLoadingId === product.id}
                  className={`absolute top-3 right-3 rounded-full p-2 bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    favLoadingId === product.id ? "animate-pulse scale-90" : "hover:scale-110 hover:bg-black/60"
                  } ${
                    favoriteIds.has(product.id)
                      ? "text-red-400"
                      : "text-white/60 hover:text-red-400"
                  }`}
                  aria-label={
                    favoriteIds.has(product.id)
                      ? "Quitar de favoritos"
                      : "Agregar a favoritos"
                  }
                >
                  <Heart
                    size={16}
                    className={`transition-all duration-200 ${
                      favoriteIds.has(product.id) ? "fill-red-400" : "fill-none"
                    }`}
                  />
                </button>
              </Link>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Category badge */}
                {(product as Product & { category?: { name: string } }).category && (
                  <span className="inline-flex self-start items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
                    {(product as Product & { category?: { name: string } }).category!.name}
                  </span>
                )}

                {/* Name + description */}
                <Link to={`/products/${product.id}`} className="flex-1 group/link">
                  <p className="font-display font-bold text-text-primary text-base leading-tight line-clamp-2 group-hover/link:text-accent transition-colors duration-200">
                    {product.name}
                  </p>
                  {product.description && (
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </Link>

                {/* Footer: price + button */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <p className="text-xl font-black font-display text-accent">
                    ${Number(product.price).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={cartLoading || addingProductId === product.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {addingProductId === product.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="hidden sm:inline">Agregando...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        <span className="hidden sm:inline">Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-alt/50">
              <Package size={36} className="text-text-muted opacity-50" />
            </div>
            <p className="text-lg font-semibold text-text-primary">Sin productos disponibles</p>
            <p className="text-sm text-text-muted">Volvé más tarde para ver nuestro catálogo</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/* ─── MAIN HOMEPAGE COMPONENT ─── */

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Si es usuario normal, mostrar catálogo de productos
  if (!isAdmin) {
    return <UserShopPage />;
  }

  // Si es admin, mostrar dashboard
  return <AdminDashboardPage />;
}
