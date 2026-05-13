import { useState } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { paymentApi } from "../api/paymentApi";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent } from "./ui/Card";
import { Loader2 } from "lucide-react";

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: "es-AR" });

interface CardPaymentFormProps {
  amount: number;
  orderId: number;
  payerEmail: string;
  onSuccess: (paymentId: number) => void;
  onError: (error: string) => void;
}

export function CardPaymentForm({
  amount,
  orderId,
  payerEmail,
  onSuccess,
  onError,
}: CardPaymentFormProps) {
  const [brickReady, setBrickReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const handleSubmit = async (formData: {
    token: string;
    payment_method_id: string;
    installments: number;
    payer: { email?: string };
  }) => {
    if (!accessToken) {
      onError("No autenticado");
      return;
    }

    setSubmitting(true);
    try {
      const result = await paymentApi.processCardPayment(
        orderId,
        accessToken,
        formData.token,
        formData.payment_method_id,
        formData.installments,
        formData.payer.email ?? payerEmail,
      );
      onSuccess(result.payment_id);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al procesar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-4 p-6">
        {!brickReady && !submitting && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Cargando formulario de pago...
          </div>
        )}

        {submitting && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Procesando pago...
          </div>
        )}

        <div className={submitting ? "pointer-events-none opacity-50" : ""}>
          <CardPayment
            initialization={{ amount, payer: { email: payerEmail } }}
            onSubmit={handleSubmit}
            onReady={() => setBrickReady(true)}
            onError={(err) => onError(err instanceof Error ? err.message : String(err))}
          />
        </div>
      </CardContent>
    </Card>
  );
}
