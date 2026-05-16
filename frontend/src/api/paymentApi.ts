const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface PaymentPreference {
  preference_id: string;
  init_point: string;
}

export interface OrderPaymentInfo {
  order_id: number;
  order_status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  paid_at: string | null;
  total_amount: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  last_payment: {
    mp_payment_id: string;
    mp_status: string;
    mp_status_detail: string;
    monto: number;
    created_at: string;
  } | null;
}

export const paymentApi = {
  /** Create a MercadoPago preference and get the checkout URL. */
  async createPreference(orderId: number, authToken: string): Promise<PaymentPreference> {
    const res = await fetch(`${API_URL}/payments/preference?order_id=${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to create payment preference');
    }
    return res.json();
  },

  /** Process a direct card payment using a tokenized card from MercadoPago SDK. */
  async processCardPayment(
    orderId: number,
    authToken: string,
    token: string,
    paymentMethodId: string,
    installments: number,
    payerEmail: string,
  ): Promise<{ status: string; status_detail: string; id: number }> {
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to process card payment');
    }
    return res.json();
  },

  /** Get payment info for an order (polling after redirect from MP). */
  async getOrderPaymentInfo(orderId: number, authToken: string): Promise<OrderPaymentInfo> {
    const res = await fetch(`${API_URL}/payments/order/${orderId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to get payment info');
    }
    return res.json();
  },
};
