import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../store/paymentStore';
import { paymentApi } from '../api/paymentApi';
import { useAuthStore } from '../store/authStore';
import { Clock, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

type PollState = 'polling' | 'approved' | 'rejected' | 'timeout';

export default function PaymentPendingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setStatus } = usePaymentStore();
  const accessToken = useAuthStore((s) => s.accessToken);

  const orderId = params.get('order_id');
  const [pollState, setPollState] = useState<PollState>('polling');
  const [dots, setDots] = useState('.');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(0);
  const MAX_POLLS = 20; // Poll for up to ~50 seconds

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setStatus('pending');

    if (!orderId || !accessToken) {
      return;
    }

    const poll = async () => {
      attempts.current += 1;
      try {
        const info = await paymentApi.getOrderPaymentInfo(Number(orderId), accessToken);
        const paymentStatus = info.payment_status?.toLowerCase();
        const orderStatus = info.order_status?.toLowerCase();

        const isApproved =
          paymentStatus === 'approved' ||
          paymentStatus === 'succeeded' ||
          orderStatus === 'confirmado' ||
          orderStatus === 'pagado';

        const isRejected =
          paymentStatus === 'failed' ||
          orderStatus === 'cancelado' ||
          orderStatus === 'cancelled';

        if (isApproved) {
          setPollState('approved');
          setStatus('approved');
          return;
        }
        if (isRejected) {
          setPollState('rejected');
          setStatus('rejected');
          return;
        }

        if (attempts.current < MAX_POLLS) {
          pollRef.current = setTimeout(poll, 2500);
        } else {
          setPollState('timeout');
        }
      } catch {
        if (attempts.current < MAX_POLLS) {
          pollRef.current = setTimeout(poll, 2500);
        } else {
          setPollState('timeout');
        }
      }
    };

    poll();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [orderId, accessToken, setStatus]);

  // Redirect on approval
  useEffect(() => {
    if (pollState === 'approved') {
      const t = setTimeout(() => navigate(`/payment/success?order_id=${orderId}`), 1500);
      return () => clearTimeout(t);
    }
  }, [pollState, navigate, orderId]);

  if (pollState === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center animate-fade-in">
        <div className="bg-[rgba(16,185,129,0.15)] p-5 rounded-full border border-emerald-500/30 animate-scale-in">
          <Icon icon={CheckCircle} size={64} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary">¡Pago confirmado!</h1>
        <p className="text-text-muted">Redirigiendo{dots}</p>
      </div>
    );
  }

  if (pollState === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center animate-fade-in">
        <div className="bg-danger/15 p-5 rounded-full border border-danger/30 animate-scale-in">
          <Icon icon={XCircle} size={64} className="text-danger" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-display font-bold text-text-primary">Pago rechazado</h1>
          <p className="text-text-muted text-base">
            El pago no fue aprobado. Podés intentarlo nuevamente con otro método.
          </p>
        </div>
        <Button onClick={() => navigate('/cart')} variant="destructive" size="lg">
          Volver al carrito
        </Button>
      </div>
    );
  }

  if (pollState === 'timeout') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center animate-fade-in">
        <div className="bg-warning/15 p-5 rounded-full border border-warning/30">
          <Icon icon={Clock} size={64} className="text-warning" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Pago en revisión
          </h1>
          <p className="text-text-muted">
            Tu pago está siendo procesado por MercadoPago. Puede tardar unos minutos en confirmarse.
            Revisá el estado en &ldquo;Mis pedidos&rdquo;.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/orders')} variant="default" size="lg">
            Ver mis pedidos
          </Button>
          <Button
            onClick={() => { attempts.current = 0; setPollState('polling'); }}
            variant="outline"
            size="lg"
          >
            <Icon icon={RefreshCw} size={16} className="mr-1" />
            Verificar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  // Polling state (default)
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-warning/15 border border-warning/30">
        <Icon icon={Clock} size={36} className="text-warning" />
        <div className="absolute inset-0 rounded-full border-2 border-warning/50 animate-spin border-t-transparent" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
          Pago en proceso
        </h1>
        <p className="text-text-muted text-lg">
          MercadoPago está procesando tu pago. No cierres esta ventana.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-muted">
          <Icon icon={Loader2} size={16} className="animate-spin" />
          <span>Verificando estado{dots}</span>
        </div>
      </div>

      {orderId && (
        <p className="text-xs text-text-muted">Pedido #{orderId}</p>
      )}
    </div>
  );
}
