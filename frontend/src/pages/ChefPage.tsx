/**
 * ChefPage — Panel del Chef
 *
 * Sección 1: Pedidos en estado CONFIRMADO o EN_PREP para preparar.
 * Sección 2: Stock de productos con opción de reponer.
 * Auto-refresh cada 30 segundos.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/authStore";
import { Package, ChefHat, RotateCcw } from "lucide-react";
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

interface InventoryProduct {
  id: number;
  name: string;
  stock_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  product_id: number;
}

const KITCHEN_STATUSES = ["confirmed", "confirmado", "en_prep", "preparando", "listo"];

function toFSMStatus(s: string): string {
  const map: Record<string, string> = {
    confirmed: "CONFIRMADO",
    confirmado: "CONFIRMADO",
    en_prep: "EN_PREP",
    preparando: "EN_PREP",
    listo: "LISTO",
  };
  return map[s.toLowerCase()] ?? s.toUpperCase();
}

type ActiveTab = "pedidos" | "stock";

export function ChefPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("pedidos");

  // --- Pedidos state ---
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // --- Stock state ---
  const [products, setProducts] = useState<{ id: number; name: string; inventory: InventoryProduct | null }[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [reponerModal, setReponerModal] = useState<{ productId: number; inventoryId: number; name: string; currentStock: number } | null>(null);
  const [reponerQty, setReponerQty] = useState(1);
  const [reponerLoading, setReponerLoading] = useState(false);
  const [reponerError, setReponerError] = useState<string | null>(null);
  const [soloLowStock, setSoloLowStock] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders?limit=100`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ items: OrderDetail[] }>(res);
      const kitchenOrders = (data.items ?? []).filter((o) =>
        KITCHEN_STATUSES.includes((o.status as string).toLowerCase())
      );
      setOrders(kitchenOrders);
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "Error al cargar pedidos");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    setStockLoading(true);
    setStockError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/products/?limit=100`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ items: { id: number; name: string; inventory: InventoryProduct | null }[] }>(res);
      setProducts(data.items ?? []);
    } catch (e) {
      setStockError(e instanceof Error ? e.message : "Error al cargar stock");
    } finally {
      setStockLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchStock();
  }, [fetchOrders, fetchStock]);

  // Auto-refresh pedidos every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function handleStatusChange(orderId: number, newStatus: string) {
    setActionLoading(orderId);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      await handleResponse(res);
      await fetchOrders();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReponer() {
    if (!reponerModal) return;
    setReponerLoading(true);
    setReponerError(null);
    try {
      const product = products.find((p) => p.id === reponerModal.productId);
      const currentStock = product?.inventory?.stock_quantity ?? reponerModal.currentStock;
      const newStock = currentStock + reponerQty;
      const threshold = product?.inventory?.low_stock_threshold ?? 10;
      const res = await fetch(`${API_BASE_URL}/inventory/${reponerModal.productId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stock_quantity: newStock, low_stock_threshold: threshold }),
      });
      await handleResponse(res);
      await fetchStock();
      setReponerModal(null);
      setReponerQty(1);
    } catch (e) {
      setReponerError(e instanceof Error ? e.message : "Error al reponer stock");
    } finally {
      setReponerLoading(false);
    }
  }

  const filteredProducts = soloLowStock
    ? products.filter((p) => p.inventory && p.inventory.stock_quantity <= p.inventory.low_stock_threshold)
    : products;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Panel del Chef
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gestión de cocina y stock
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { fetchOrders(); fetchStock(); }}
          disabled={ordersLoading || stockLoading}
        >
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("pedidos")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px",
            activeTab === "pedidos"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          <Icon icon={ChefHat} size={16} />
          Pedidos de Cocina
          {orders.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
              {orders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px",
            activeTab === "stock"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          <Icon icon={Package} size={16} />
          Stock
        </button>
      </div>

      {/* Pedidos de Cocina */}
      {activeTab === "pedidos" && (
        <div>
          {actionError && (
            <div className="mb-4 rounded-lg border-l-4 border-danger bg-danger/10 p-3 text-sm font-medium text-danger-dark">
              {actionError}
            </div>
          )}
          {ordersError && (
            <div className="mb-4 rounded-lg border-l-4 border-danger bg-danger/10 p-3 text-sm font-medium text-danger-dark">
              {ordersError}
            </div>
          )}
          {ordersLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={ChefHat} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">No hay pedidos para preparar</p>
              <p className="text-sm text-text-muted mt-1">
                Los pedidos confirmados aparecerán aquí. Se actualiza cada 30 seg.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => {
                const fsm = toFSMStatus(order.status as string);
                const isConfirmado = fsm === "CONFIRMADO";
                const isEnPrep = fsm === "EN_PREP";
                const isListo = fsm === "LISTO";
                const loading = actionLoading === order.id;

                return (
                  <Card key={order.id} className={cn(
                    "border-2 transition-colors",
                    isEnPrep ? "border-yellow-400 dark:border-yellow-600" :
                    isListo ? "border-green-400 dark:border-green-600" : "border-border"
                  )}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-base font-bold text-text-primary">
                          Pedido #{order.id}
                        </span>
                        <Badge
                          variant={isEnPrep ? "warning" : isListo ? "success" : "info"}
                          size="sm"
                        >
                          {isEnPrep ? "En preparación" : isListo ? "Listo" : "Confirmado"}
                        </Badge>
                      </div>

                      <p className="text-xs text-text-muted">
                        {order.created_at?.replace("T", " ").slice(0, 16) ?? "-"}
                      </p>

                      {/* Items */}
                      <ul className="space-y-1">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-2 text-sm">
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-[11px] font-bold">
                                {item.quantity}
                              </span>
                              <span className="text-text-primary font-medium">
                                {item.product_name ?? `#${item.product_id}`}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-text-muted">Sin ítems cargados</li>
                        )}
                      </ul>

                      {/* Action button */}
                      {isConfirmado && (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={loading}
                          onClick={() => handleStatusChange(order.id, "en_prep")}
                        >
                          {loading ? "..." : "Comenzar preparación"}
                        </Button>
                      )}
                      {isEnPrep && (
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={loading}
                          onClick={() => handleStatusChange(order.id, "listo")}
                        >
                          {loading ? "..." : "Marcar como listo"}
                        </Button>
                      )}
                      {isListo && (
                        <p className="text-xs text-center font-semibold text-green-600 dark:text-green-400">
                          ✓ Listo para despachar — esperando al cajero
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stock */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          {stockError && (
            <div className="rounded-lg border-l-4 border-danger bg-danger/10 p-3 text-sm font-medium text-danger-dark">
              {stockError}
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-primary">
              <input
                type="checkbox"
                checked={soloLowStock}
                onChange={(e) => setSoloLowStock(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand-500"
              />
              Solo bajo stock
            </label>
          </div>

          <Card>
            <CardContent className="p-0">
              {stockLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                    <Icon icon={Package} size={28} className="text-text-muted" />
                  </div>
                  <p className="text-lg font-semibold text-text-primary">Sin productos</p>
                  <p className="text-sm text-text-muted mt-1">No hay productos con el filtro seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Producto</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Stock</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Umbral</th>
                        <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const inv = product.inventory;
                        const isLow = inv ? inv.stock_quantity <= inv.low_stock_threshold : false;
                        return (
                          <tr
                            key={product.id}
                            className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-semibold text-text-primary">{product.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-bold", isLow ? "text-danger" : "text-text-primary")}>
                                  {inv?.stock_quantity ?? "-"}
                                </span>
                                {isLow && (
                                  <Badge variant="danger" size="sm">Bajo stock</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-text-secondary">{inv?.low_stock_threshold ?? "-"}</td>
                            <td className="px-4 py-3 text-right">
                              {inv ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReponerModal({
                                      productId: product.id,
                                      inventoryId: inv.id,
                                      name: product.name,
                                      currentStock: inv.stock_quantity,
                                    });
                                    setReponerQty(1);
                                    setReponerError(null);
                                  }}
                                >
                                  <Icon icon={RotateCcw} size={14} className="mr-1" />
                                  Reponer
                                </Button>
                              ) : (
                                <span className="text-text-muted text-xs">Sin inventario</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reponer modal */}
      {reponerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-card p-6 shadow-lg space-y-4 animate-scale-in">
            <h3 className="font-display text-lg font-bold text-text-primary">
              Reponer stock
            </h3>
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{reponerModal.name}</span>
              {" — stock actual: "}
              <span className="font-bold">{reponerModal.currentStock}</span>
            </p>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Cantidad a agregar
              </label>
              <input
                type="number"
                min={1}
                value={reponerQty}
                onChange={(e) => setReponerQty(Math.max(1, Number(e.target.value)))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {reponerError && (
              <div className="rounded-lg border-l-4 border-danger bg-danger/10 p-2.5 text-xs font-medium text-danger-dark">
                {reponerError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={reponerLoading || reponerQty < 1}
                onClick={handleReponer}
              >
                {reponerLoading ? "Guardando..." : `Agregar ${reponerQty} unidades`}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={reponerLoading}
                onClick={() => { setReponerModal(null); setReponerError(null); }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
