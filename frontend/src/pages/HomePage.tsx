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

  const featuredProducts = useMemo(() => {
    if (!sortedProducts) return [];
    return sortedProducts.slice(0, 3);
  }, [sortedProducts]);

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
    <div className="pb-16 animate-fade-in">
      {/* HERO SECTION */}
      <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] rounded-3xl overflow-hidden mb-12 bg-gradient-to-br from-brand-900 to-gray-900 flex items-center shadow-2xl">
        <div className="absolute inset-0 bg-black/40 z-10" />
        {/* Placeholder image that looks premium. Ideally a restaurant or food image. */}
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
          alt="Delicious Food"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        
        <div className="relative z-20 px-8 md:px-16 w-full max-w-4xl">
          <Badge className="bg-brand-500/20 text-brand-300 border border-brand-400/30 backdrop-blur-sm px-3 py-1 mb-6 inline-flex uppercase tracking-widest font-semibold">
            Experiencia Premium
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            Los mejores sabores, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-amber-200">
              directo a tu mesa
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl font-medium drop-shadow-md">
            Descubrí nuestro menú diseñado para paladares exigentes. Calidad superior, ingredientes frescos y entrega inmediata.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-brand-600 hover:bg-brand-500 text-white px-10 py-5 text-xl rounded-2xl font-black transition-all duration-300 shadow-[0_0_40px_-10px_rgba(234,88,12,0.6)] flex items-center gap-3 hover:scale-105 hover:-translate-y-1 active:scale-95"
            >
              Ver Catálogo
              <ArrowRight size={24} className="animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS & ERROR MESSAGES */}
      {successMessage && (
        <div className="mb-8 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-900/30 dark:border-emerald-800 animate-in fade-in slide-in-from-top-4">
          <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-8 flex items-center gap-2 p-3 bg-danger-bg border border-danger rounded-lg dark:bg-danger/10 dark:border-danger/30 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={18} className="text-danger" />
          <p className="text-sm font-medium text-danger">
            {errorMessage}
          </p>
        </div>
      )}

      {/* FEATURED / PROMOTIONS */}
      {featuredProducts.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-2">
                <Heart className="text-rose-500 fill-rose-500" size={24} />
                Nuestros Favoritos
              </h2>
              <p className="text-sm text-text-muted mt-1">Los platos más pedidos por nuestra comunidad</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <Card 
                key={`featured-${product.id}`} 
                className="group hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 border-border/50 hover:border-brand-500/50 overflow-hidden bg-gradient-to-b from-surface to-surface-alt"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative h-56 w-full overflow-hidden bg-surface-alt flex items-center justify-center">
                  <Badge className="absolute top-3 left-3 z-10 bg-rose-500 text-white border-none font-bold uppercase tracking-wide">
                    Top
                  </Badge>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <Icon icon={Package} size={48} className="text-text-muted group-hover:scale-110 transition-transform duration-700" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                
                <CardContent className="p-5">
                  <Link to={`/products/${product.id}`} className="hover:opacity-80 transition-opacity block mb-2">
                    <h3 className="font-display text-lg font-bold text-text-primary line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">{product.description}</p>
                  </Link>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-black text-brand-600">${Number(product.price).toFixed(2)}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={cartLoading || addingProductId === product.id}
                      className="bg-brand-100 hover:bg-brand-200 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-800/50 p-2.5 rounded-full transition-colors disabled:opacity-50"
                    >
                      {addingProductId === product.id ? (
                        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ShoppingCart size={20} />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CATALOG */}
      <div id="catalog-section" className="scroll-mt-24">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            Catálogo Completo
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Explora todas nuestras opciones y armá tu pedido perfecto
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedProducts && sortedProducts.length > 0 ? (
          sortedProducts.map((product: Product, index: number) => (
            <div 
              key={product.id}
              className="transition-all duration-500 ease-out hover:-translate-y-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card variant="interactive" className="h-full hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 border-transparent hover:border-brand-500/30">
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
