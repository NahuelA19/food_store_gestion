import { create } from 'zustand';

type PaymentStatus = 'idle' | 'pending' | 'approved' | 'rejected' | 'error';

interface PaymentState {
  preferenceId: string | null;
  status: PaymentStatus;
  paymentMethod: string | null;
  setPreference: (preferenceId: string) => void;
  setStatus: (status: PaymentStatus) => void;
  clear: () => void;
}

export const usePaymentStore = create<PaymentState>()((set) => ({
  preferenceId: null,
  status: 'idle',
  paymentMethod: null,
  setPreference: (preferenceId) => set({ preferenceId, status: 'pending' }),
  setStatus: (status) => set({ status }),
  clear: () => set({ preferenceId: null, status: 'idle', paymentMethod: null }),
}));
