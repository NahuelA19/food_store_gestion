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

const FALLBACK_ORDERS: OrderRow[] = [
  {
    id: 1001,
    customer: "Juan García",
    status: "CONFIRMADO",
    total: 450.0,
  },
  {
    id: 1002,
    customer: "María López",
    status: "EN_PREP",
    total: 320.5,
  },
  {
    id: 1003,
    customer: "Carlos Martínez",
    status: "EN_CAMINO",
    total: 580.75,
  },
  {
    id: 1004,
    customer: "Ana Rodríguez",
    status: "PENDIENTE",
    total: 210.0,
  },
  {
    id: 1005,
    customer: "Pedro Sánchez",
    status: "ENTREGADO",
    total: 645.25,
  },
];

interface BranchSummary {
  id: number;
  name: string;
  address: string;
  status: "active" | "inactive";
}

const FALLBACK_BRANCHES: BranchSummary[] = [
  {
    id: 1,
    name: "Centro Comercial",
    address: "Av. Principal 123, Centro",
    status: "active",
  },
  {
    id: 2,
    name: "Zona Norte",
    address: "Calle 45 No. 567, Norte",
    status: "active",
  },
  {
    id: 3,
    name: "Zona Sur",
    address: "Av. Sur 890, Sur",
    status: "inactive",
  },
];

const STATUS_LABELS: { [key: string]: string } = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREP: "En Preparación",
  EN_CAMINO: "En Camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const STATUS_VARIANTS: { [key: string]: "warning" | "info" | "success" | "danger" } = {
  PENDIENTE: "warning",
  CONFIRMADO: "info",
  EN_PREP: "info",
  EN_CAMINO: "info",
  ENTREGADO: "success",
  CANCELADO: "danger",
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
        customer: o.user_email || `Usuario #${o.user_id}`,
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
        status: b.is_active ? "active" : "inactive",
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
                    {recentOrders.map((order) => (
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
                            variant={STATUS_VARIANTS[order.status] || "neutral"}
                            size="sm"
                          >
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

        {/* Orders by Status Chart */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-text-primary">
            Estado de Pedidos
          </h2>
          <Card>
            <CardContent className="p-4">
              {stats ? (
                <OrdersByStatusChart data={stats.orders_by_status} />
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-text-muted">Cargando datos...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BRANCH OVERVIEW */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Nuestros Productos
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Explora nuestro catálogo y agrega productos a tu carrito
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-900/30 dark:border-emerald-800">
          <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-danger-bg border border-danger rounded-lg dark:bg-danger/10 dark:border-danger/30">
          <AlertCircle size={18} className="text-danger" />
          <p className="text-sm font-medium text-danger">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedProducts && sortedProducts.length > 0 ? (
          sortedProducts.map((product: Product) => (
            <div key={product.id}>
              <Card variant="interactive" className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Image Placeholder */}
                  <Link
                    to={`/products/${product.id}`}
                    className="relative w-full h-40 bg-surface-alt rounded-lg mb-3 flex items-center justify-center hover:bg-surface-alt/80 transition-colors group"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Icon icon={Package} size={40} className="text-text-muted group-hover:scale-110 transition-transform" />
                    )}

                    {/* Favorite heart button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleFavorite(product.id);
                      }}
                      disabled={favLoadingId === product.id}
                      className={`absolute top-2 right-2 rounded-full p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        favLoadingId === product.id ? "animate-pulse" : "hover:scale-110"
                      } ${
                        favoriteIds.has(product.id)
                          ? "text-red-500"
                          : "text-gray-400 hover:text-red-400"
                      }`}
                      aria-label={
                        favoriteIds.has(product.id)
                          ? "Quitar de favoritos"
                          : "Agregar a favoritos"
                      }
                    >
                      <Heart
                        size={18}
                        className={`transition-all duration-200 ${
                          favoriteIds.has(product.id) ? "fill-red-500" : "fill-none"
                        }`}
                      />
                    </button>
                  </Link>

                  {/* Product Info */}
                  <Link to={`/products/${product.id}`} className="flex-1 hover:opacity-80 transition-opacity">
                    <p className="font-semibold text-text-primary line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </Link>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="font-bold text-brand-600">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={cartLoading || addingProductId === product.id}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingProductId === product.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          <span className="hidden sm:inline">Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-text-muted">No hay productos disponibles</p>
          </div>
        )}
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
