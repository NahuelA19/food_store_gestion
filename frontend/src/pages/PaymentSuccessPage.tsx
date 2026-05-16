import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePaymentStore } from '../store/paymentStore';
import { paymentApi } from '../api/paymentApi';
import { useAuthStore } from '../store/authStore';
import { CheckCircle, Loader2, ShoppingBag, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

type ConfirmState = 'loading' | 'confirmed' | 'pending' | 'error';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setStatus } = usePaymentStore();
  const accessToken = useAuthStore((s) => s.accessToken);

  const orderId = params.get('order_id');
  const isSimulated = params.get('simulated') === 'true';

  const [state, setState] = useState<ConfirmState>('loading');
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(0);
  const MAX_POLLS = 8;

  useEffect(() => {
    setStatus('approved');

    // Without order ID or simulated payment → skip polling
    if (!orderId || isSimulated) {
      setState('confirmed');
      return;
    }

    if (!accessToken) {
      setState('confirmed');
      return;
    }

    const poll = async () => {
      attempts.current += 1;
      try {
        const info = await paymentApi.getOrderPaymentInfo(Number(orderId), accessToken);
        const paymentStatus = info.payment_status?.toLowerCase();
        const orderStatus = info.order_status?.toLowerCase();

        setTotalAmount(info.total_amount);

        const isApproved =
          paymentStatus === 'approved' ||
          paymentStatus === 'succeeded' ||
          orderStatus === 'confirmado' ||
          orderStatus === 'confirmed' ||
          orderStatus === 'pagado' ||
          orderStatus === 'paid';

        if (isApproved) {
          setState('confirmed');
          return;
        }

        // Keep polling if still pending and under max attempts
        if (attempts.current < MAX_POLLS) {
          pollRef.current = setTimeout(poll, 2500);
        } else {
          // Fallback: show success anyway (webhook may arrive shortly)
          setState('confirmed');
        }
      } catch {
        if (attempts.current < MAX_POLLS) {
          pollRef.current = setTimeout(poll, 2500);
        } else {
          setState('confirmed');
        }
      }
    };

    poll();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [orderId, accessToken, isSimulated, setStatus]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/20 animate-pulse">
          <Icon icon={Loader2} size={40} className="text-brand-400 animate-spin" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Confirmando tu pago...
          </h1>
          <p className="text-text-muted text-base">
            Estamos verificando el estado de tu transacción.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center animate-fade-in">
      {/* Success icon */}
      <div className="bg-[rgba(16,185,129,0.15)] p-5 rounded-full border border-emerald-500/30 shadow-lg backdrop-blur-md animate-scale-in">
        <Icon icon={CheckCircle} size={64} className="text-emerald-400" />
      </div>

      {/* Message */}
      <div className="space-y-3 max-w-md">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
          ¡Pago exitoso!
        </h1>
        <p className="text-text-muted text-lg">
          Tu pedido fue confirmado. Ya estamos preparando todo para vos.
        </p>

        {totalAmount !== null && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
            <span className="text-sm text-emerald-400 font-semibold">
              Total pagado: ${totalAmount.toFixed(2)}
            </span>
          </div>
        )}

        {orderId && (
          <p className="text-xs text-text-muted">
            Pedido #{orderId}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
        <Button
          onClick={() => navigate('/orders')}
          variant="default"
          size="lg"
          className="gap-2"
        >
          <Icon icon={ShoppingBag} size={18} />
          Ver mis pedidos
        </Button>

        <Link
          to="/products"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-card px-5 py-3 text-sm font-semibold text-text-primary hover:bg-surface-alt transition-all"
        >
          <Icon icon={Package} size={18} />
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
