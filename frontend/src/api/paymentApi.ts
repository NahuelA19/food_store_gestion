const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const paymentApi = {
  async createPreference(orderId: number, authToken: string) {
    const res = await fetch(`${API_URL}/payments/preference?order_id=${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!res.ok) throw new Error('Failed to create payment preference');
    return res.json() as Promise<{ preference_id: string; init_point: string }>;
  },

  async processCardPayment(
    orderId: number,
    authToken: string,
    token: string,
    paymentMethodId: string,
    installments: number,
    payerEmail: string,
  ): Promise<{ status: string; status_detail: string; payment_id: number }> {
    const res = await fetch(`${API_URL}/payments/process-card?order_id=${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        payment_method_id: paymentMethodId,
        installments,
        payer_email: payerEmail,
      }),
    });
    if (!res.ok) throw new Error('Failed to process card payment');
    return res.json();
  },
};
