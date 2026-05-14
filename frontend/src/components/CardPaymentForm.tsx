import { useEffect, useState } from "react";
import { paymentApi } from "../api/paymentApi";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent } from "./ui/Card";
import { Icon } from "./ui/Icon";
import { Loader2, AlertTriangle } from "lucide-react";

interface CardPaymentFormProps {
  amount: number;
  orderId: number;
  payerEmail: string;
  onSuccess: (paymentId: number) => void;
  onError: (error: string) => void;
}

/** Lazy-loaded MercadoPago Brick wrapper.
 *
 * Only rendered when VITE_MP_PUBLIC_KEY is present.
 * Imports the SDK dynamically so it doesn't crash when the env var is missing.
 */
function MpBrickLazy(props: {
  amount: number;
  payerEmail: string;
  onReady: () => void;
  onSubmit: (formData: {
    token: string;
    payment_method_id: string;
    installments: number;
    payer: { email?: string };
  }) => void;
  onError: (err: unknown) => void;
}) {
  const [BrickComponent, setBrickComponent] = useState<
    typeof import("@mercadopago/sdk-react").CardPayment | null
  >(null);
  const [loadError, setLoadError] = useState(false);

  // Dynamically import the SDK once (only if PUBLIC_KEY exists)
  useEffect(() => {
    const mpKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!mpKey) return;

    import("@mercadopago/sdk-react")
      .then((mod) => {
        mod.initMercadoPago(mpKey, { locale: "es-AR" });
        setBrickComponent(() => mod.CardPayment);
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) {
    return (
      <div className="rounded-lg bg-danger/10 p-4 text-center text-sm text-danger">
        <Icon icon={AlertTriangle} size={20} className="mx-auto mb-2" />
        Error al cargar el SDK de MercadoPago
      </div>
    );
  }

  if (!BrickComponent) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted">
        <Loader2 size={18} className="animate-spin" />
        Cargando formulario de pago...
      </div>
    );
  }

  return (
    <BrickComponent
      initialization={{ amount: props.amount, payer: { email: props.payerEmail } }}
      onSubmit={props.onSubmit}
      onReady={props.onReady}
      onError={props.onError}
    />
  );
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

  const hasMpPublicKey = Boolean(import.meta.env.VITE_MP_PUBLIC_KEY);

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
        {!hasMpPublicKey && (
          <div className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-800">
            <Icon icon={AlertTriangle} size={20} className="mx-auto mb-2" />
            <p className="font-semibold">Modo de prueba</p>
            <p className="mt-1 text-amber-600">
              No hay credenciales de MercadoPago configuradas.{" "}
              Us&aacute; el bot&oacute;n <strong>Simular Compra</strong> m&aacute;s
              abajo para probar el flujo de pago.
            </p>
          </div>
        )}

        {!brickReady && !submitting && hasMpPublicKey && (
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

        {hasMpPublicKey && (
          <div className={submitting ? "pointer-events-none opacity-50" : ""}>
            <MpBrickLazy
              amount={amount}
              payerEmail={payerEmail}
              onReady={() => setBrickReady(true)}
              onSubmit={handleSubmit}
              onError={(err) => onError(err instanceof Error ? err.message : String(err))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
