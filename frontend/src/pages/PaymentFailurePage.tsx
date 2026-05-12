import { useEffect } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const { setStatus } = usePaymentStore();

  useEffect(() => {
    setStatus('rejected');
  }, [setStatus]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <XCircle className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-bold">Pago no procesado</h1>
      <p className="text-gray-600">Podés reintentar el pago cuando quieras</p>
      <button
        onClick={() => navigate('/cart')}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Volver al carrito
      </button>
    </div>
  );
}
