import { useEffect } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const { setStatus } = usePaymentStore();

  useEffect(() => {
    setStatus('rejected');
  }, [setStatus]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center">
      <div className="bg-danger/20 p-5 rounded-full border border-danger/50 shadow-lg backdrop-blur-md animate-scale-in">
        <Icon icon={XCircle} size={64} className="text-[color:var(--color-danger)]" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">Pago no procesado</h1>
        <p className="text-text-secondary text-lg">Podés reintentar el pago cuando quieras. Tu pedido sigue guardado en el carrito.</p>
      </div>
      <Button
        onClick={() => navigate('/cart')}
        variant="destructive"
        size="lg"
        className="mt-4 shadow-modal"
      >
        Volver al carrito
      </Button>
    </div>
  );
}
