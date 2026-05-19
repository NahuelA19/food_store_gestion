/**
 * OrderDetailPage — Full order detail with status management
 */

import { useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';
import { useOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { useAuthStore } from '../store/authStore';
import { paymentApi } from '../api/paymentApi';
import { usePaymentStore } from '../store/paymentStore';
import type { OrderStatus, StatusHistoryEntry } from '../types/order';
import { ArrowLeft, ChevronDown, User, Package, CreditCard, Clock, Banknote, RefreshCw, Loader2 } from 'lucide-react';

// Matches the actual FSM state values returned by the backend
const STATUS_FLOW: OrderStatus[] = ['pendiente', 'confirmed', 'en_prep', 'en_camino', 'delivered'] as unknown as OrderStatus[];

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'warning' | 'info' | 'neutral' | 'success' | 'danger' }
> = {
  // Backend FSM values (primary)
  pendiente: { label: 'Pendiente de Pago', variant: 'warning' },
  confirmed: { label: 'Confirmado', variant: 'info' },
  en_prep: { label: 'En Preparación', variant: 'neutral' },
  en_camino: { label: 'En Camino', variant: 'info' },
  delivered: { label: 'Entregado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
  // Legacy / alias values
  payment_pending: { label: 'Pendiente de Pago', variant: 'warning' },
  payment_failed: { label: 'Pago Fallido', variant: 'danger' },
  paid: { label: 'Pagado', variant: 'info' },
  pending: { label: 'Pendiente', variant: 'warning' },
  preparing: { label: 'Preparando', variant: 'neutral' },
  preparando: { label: 'Preparando', variant: 'neutral' },
  ready: { label: 'Listo', variant: 'success' },
  shipped: { label: 'Enviado', variant: 'info' },
};

const STATUS_DOT_COLOR: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmed: '#3b82f6',
  en_prep: '#6b7280',
  en_camino: '#6366f1',
  delivered: '#10b981',
  cancelled: '#ef4444',
  // Legacy aliases
  payment_pending: '#f59e0b',
  payment_failed: '#ef4444',
  paid: '#3b82f6',
  pending: '#f59e0b',
  preparing: '#6b7280',
  preparando: '#6b7280',
  ready: '#10b981',
  shipped: '#3b82f6',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const { user, accessToken } = useAuthStore();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isCustomer = !user?.role || ['customer', 'client', 'user'].includes(user.role.toLowerCase());
  const { order: apiOrder, isLoading, error, refetch } = useOrder(orderId);
  const { updateStatus, isLoading: isUpdating } = useUpdateOrderStatus();
  const { setPreference } = usePaymentStore();

  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    const is403 = error?.includes("Admin privileges required") || error?.includes("403");
    const is404 = error?.includes("not found") || error?.includes("no existe");
    const isNetwork = error?.includes("Failed to fetch") || error?.includes("NetworkError");

    let title = "Pedido no encontrado";
    let message = error ?? `El pedido #${id} no existe`;

    if (is403) {
      title = "Sin permisos";
      message = "No tenés permisos para ver este pedido";
    } else if (isNetwork) {
      title = "Error de conexión";
      message = "No se pudo conectar con el servidor. Intentá de nuevo.";
    } else if (is404) {
      title = "Pedido no encontrado";
      message = error ?? `El pedido #${id} no existe`;
    }

    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
          <Icon icon={Package} size={28} className="text-text-muted" />
        </div>
        <p className="text-lg font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-muted mt-1">{message}</p>
        <Link to="/orders">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft size={16} />
            Volver a pedidos
          </Button>
        </Link>
      </div>
    );
  }

  const nextStatuses = STATUS_FLOW.slice(STATUS_FLOW.indexOf(resolvedStatus as OrderStatus) + 1);

  const isAtEnd = resolvedStatus === 'delivered' || resolvedStatus === 'cancelled';
  const availableStatuses = isAtEnd ? [] : [...nextStatuses, 'cancelled' as OrderStatus];

  const handleRetryMp = async () => {
    if (!accessToken || !order) return;
    setPaymentActionLoading(true);
    setPaymentActionError(null);
    try {
      if (order.payment_method !== 'MERCADOPAGO') {
        await paymentApi.switchPaymentMethod(order.id, 'MERCADOPAGO', accessToken);
      }
      const { preference_id, init_point } = await paymentApi.createPreference(order.id, accessToken);
      setPreference(preference_id);
      flushSync(() => setIsRedirecting(true));
      window.location.href = init_point;
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Error al iniciar el pago');
      setPaymentActionLoading(false);
    }
  };

  const handleSwitchToCash = async () => {
    if (!accessToken || !order) return;
    setPaymentActionLoading(true);
    setPaymentActionError(null);
    try {
      await paymentApi.switchPaymentMethod(order.id, 'EFECTIVO', accessToken);
      await refetch();
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Error al cambiar método de pago');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setStatusOpen(false);
    setStatusError(null);
    try {
      await updateStatus({ id: order!.id, status: newStatus });
      setCurrentStatus(newStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  };

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
        <Icon icon={Loader2} size={40} className="animate-spin text-primary" />
        <p className="text-lg font-semibold text-text-primary">Redirigiendo a Mercado Pago...</p>
        <p className="text-sm text-text-muted">No cierres esta ventana</p>
      </div>
    );
  }

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
          <h1 className="font-display text-2xl font-bold text-text-primary">Pedido #{order.id}</h1>
          <p className="text-sm text-text-muted mt-1">
            {new Date(order.created_at).toLocaleString('es-AR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_CONFIG[resolvedStatus]?.variant || 'neutral'} size="default">
            <span className="sr-only">Estado: </span>
            {STATUS_CONFIG[resolvedStatus]?.label || resolvedStatus}
          </Badge>

          {/* Status dropdown — admin only */}
          {isAdmin && availableStatuses.length > 0 && (
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
                      <Badge variant={STATUS_CONFIG[s]?.variant || 'neutral'} size="sm">
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

      {/* Status Timeline */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text-primary">
                Historial de Estado
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Actualizado automáticamente cada 30 segundos
              </p>
            </div>
          </div>

          {order.status_history && order.status_history.length > 0 ? (
            <div className="relative pl-6">
              {(() => {
                const sortedHistory = [...order.status_history].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                const latestIndex = sortedHistory.length - 1;

                return sortedHistory.map((entry: StatusHistoryEntry, index: number) => {
                  const isLatest = index === latestIndex;
                  const config = STATUS_CONFIG[entry.estado_hasta] || {
                    label: entry.estado_hasta,
                    variant: 'neutral' as const,
                  };
                  const dotColor = STATUS_DOT_COLOR[entry.estado_hasta] || '#6b7280';

                  return (
                    <div
                      key={entry.id}
                      className={`relative pb-6 last:pb-0 ${!isLatest ? 'opacity-60' : ''}`}
                    >
                      {index !== latestIndex && (
                        <div
                          className="absolute left-[-19px] top-4 w-0.5 h-full bg-border"
                          style={{ marginLeft: '3px' }}
                        />
                      )}

                      <div className="absolute left-[-20px] top-0 flex items-center justify-center">
                        {isLatest ? (
                          <div className="relative">
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                backgroundColor: dotColor,
                                opacity: 0.3,
                                animation: 'status-pulse-ring 2s ease-out infinite',
                              }}
                            />
                            <div
                              className="relative w-4 h-4 rounded-full border-2 border-white shadow-md"
                              style={{
                                backgroundColor: dotColor,
                                animation: 'status-pulse 2s ease-in-out infinite',
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: dotColor }}
                          />
                        )}
                      </div>

                      <div className="ml-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={config.variant} size={isLatest ? 'default' : 'sm'}>
                            {isLatest && <span className="font-bold mr-1">●</span>}
                            {config.label}
                          </Badge>
                          {isLatest && (
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                              Estado actual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(entry.created_at).toLocaleString('es-AR')}
                        </p>
                        {entry.motivo && (
                          <p className="text-sm text-text-secondary mt-1.5 italic">
                            {String.fromCharCode(8220)}
                            {entry.motivo}
                            {String.fromCharCode(8221)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-text-muted">
                No hay historial de cambios de estado disponible
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
              <h3 className="font-display text-base font-bold text-text-primary">Cliente</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                    <Icon icon={User} size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {order.user_email || `Usuario #${order.user_id}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-base font-bold text-text-primary mb-4">Resumen</h3>
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
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Icon icon={order.payment_method === 'EFECTIVO' ? Banknote : CreditCard} size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {order.payment_method === 'EFECTIVO' ? 'Efectivo en local' : order.payment_method === 'MERCADOPAGO' ? 'MercadoPago' : 'Sin método asignado'}
                  </p>
                  <p className="text-xs text-text-muted capitalize">
                    {order.payment_status === 'approved' ? 'Pagado' : order.payment_status === 'pending' ? 'Pendiente de pago' : order.payment_status === 'failed' ? 'Pago fallido' : order.payment_status ?? ''}
                    {order.paid_at ? ` · ${new Date(order.paid_at).toLocaleString('es-AR')}` : ''}
                  </p>
                </div>
              </div>

              {/* Retry / switch actions — solo para clientes con pago pendiente o fallido */}
              {isCustomer && (order.payment_status === 'pending' || order.payment_status === 'failed') && resolvedStatus === 'pendiente' && (
                <div className="space-y-2 pt-1 border-t border-border">
                  {order.payment_method === 'EFECTIVO' ? (
                    <>
                      <p className="text-xs text-text-muted">Tu pedido será cobrado en el local por el cajero.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        disabled={paymentActionLoading}
                        onClick={handleRetryMp}
                      >
                        {paymentActionLoading ? <Icon icon={Loader2} size={15} className="animate-spin" /> : <Icon icon={CreditCard} size={15} />}
                        Pagar con MercadoPago en cambio
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2"
                        disabled={paymentActionLoading}
                        onClick={handleRetryMp}
                      >
                        {paymentActionLoading ? <Icon icon={Loader2} size={15} className="animate-spin" /> : <Icon icon={RefreshCw} size={15} />}
                        {order.payment_status === 'failed' ? 'Reintentar con MercadoPago' : 'Continuar pago con MercadoPago'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        disabled={paymentActionLoading}
                        onClick={handleSwitchToCash}
                      >
                        {paymentActionLoading ? <Icon icon={Loader2} size={15} className="animate-spin" /> : <Icon icon={Banknote} size={15} />}
                        Cambiar a efectivo
                      </Button>
                    </>
                  )}
                  {paymentActionError && (
                    <p className="text-xs text-danger font-medium">{paymentActionError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
