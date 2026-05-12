const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const paymentApi = {
  async createPreference(orderId: number, token: string) {
    const res = await fetch(`${API_URL}/pagos/preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    if (!res.ok) throw new Error('Failed to create payment preference');
    return res.json() as Promise<{ preference_id: string; init_point: string }>;
  },
};
