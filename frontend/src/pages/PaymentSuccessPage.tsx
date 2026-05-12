import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../store/paymentStore';
import { CheckCircle } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <CheckCircle className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-bold">¡Pago exitoso!</h1>
      <p className="text-gray-600">Tu pedido ha sido confirmado</p>
      <button
        onClick={() => navigate('/orders')}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Ver mis pedidos
      </button>
    </div>
  );
}
