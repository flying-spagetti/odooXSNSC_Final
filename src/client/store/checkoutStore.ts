import { create } from 'zustand';

export interface CheckoutState {
  subscriptionId: string | null;
  step: 'cart' | 'address' | 'payment' | 'confirmation';
  address: {
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null;
  setSubscriptionId: (id: string) => void;
  setStep: (step: CheckoutState['step']) => void;
  setAddress: (address: CheckoutState['address']) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  subscriptionId: null,
  step: 'cart',
  address: null,
  setSubscriptionId: (id) => set({ subscriptionId: id }),
  setStep: (step) => set({ step }),
  setAddress: (address) => set({ address }),
  reset: () => set({ subscriptionId: null, step: 'cart', address: null }),
}));
