import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePaymentStore } from '../store/paymentStore';
import { paymentApi } from '../api/paymentApi';
import { useAuthStore } from '../store/authStore';
import { CheckCircle, ShoppingBag, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

const REDIRECT_SECONDS = 10;

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setStatus } = usePaymentStore();
  const accessToken = useAuthStore((s) => s.accessToken);

  const orderId = params.get('order_id');
  const isSimulated = params.get('simulated') === 'true';

  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(0);
  const MAX_POLLS = 5;

  useEffect(() => {
    setStatus('approved');

    // Poll in background only to fetch totalAmount — success screen shows immediately
    if (!orderId || isSimulated || !accessToken) return;

    const poll = async () => {
      attempts.current += 1;
      try {
        const info = await paymentApi.getOrderPaymentInfo(Number(orderId), accessToken);
        if (info.total_amount) setTotalAmount(info.total_amount);

        const isSettled =
          info.payment_status?.toLowerCase() === 'approved' ||
          info.order_status?.toLowerCase() === 'confirmado';

        if (!isSettled && attempts.current < MAX_POLLS) {
          pollRef.current = setTimeout(poll, 2500);
        }
      } catch {
        if (attempts.current < MAX_POLLS) {
          pollRef.current = setTimeout(poll, 2500);
        }
      }
    };

    poll();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [orderId, accessToken, isSimulated, setStatus]);

  // Countdown + auto-redirect
  useEffect(() => {
    const destination = orderId ? `/orders/${orderId}` : '/orders';

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(destination);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId, navigate]);

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

      {/* Countdown */}
      <p className="text-sm text-text-muted">
        Redirigiendo al detalle del pedido en{' '}
        <span className="font-semibold text-emerald-400">{countdown}s</span>...
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
        <Button
          onClick={() => navigate(orderId ? `/orders/${orderId}` : '/orders')}
          variant="default"
          size="lg"
          className="gap-2"
        >
          <Icon icon={ShoppingBag} size={18} />
          Ver detalle del pedido
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
