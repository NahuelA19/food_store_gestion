import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../store/paymentStore';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setStatus } = usePaymentStore();

  useEffect(() => {
    setStatus('approved');
    const paymentId = params.get('payment_id');
    if (paymentId) {
      // Opcional: notificar al backend
    }
  }, [params, setStatus]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center">
      <div className="bg-success/20 p-5 rounded-full border border-success/50 shadow-lg backdrop-blur-md animate-scale-in">
        <Icon icon={CheckCircle} size={64} className="text-[color:var(--color-success)]" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">¡Pago exitoso!</h1>
        <p className="text-text-secondary text-lg">Tu pedido ha sido confirmado y ya lo estamos preparando.</p>
      </div>
      <Button
        onClick={() => navigate('/orders')}
        variant="default"
        size="lg"
        className="mt-4 shadow-modal bg-[color:var(--color-success)] hover:bg-[color:var(--color-success-text)] text-white"
      >
        Ver mis pedidos
      </Button>
    </div>
  );
}
