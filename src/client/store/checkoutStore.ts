import { create } from 'zustand';
import { Discount } from '@/lib/api';

export interface AppliedDiscount {
  discount: Discount;
  discountAmount: number;
}

export interface CheckoutState {
  subscriptionId: string | null;
  step: 'cart' | 'address' | 'payment' | 'confirmation';
  address: {
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null;
  appliedDiscount: AppliedDiscount | null;
  setSubscriptionId: (id: string) => void;
  setStep: (step: CheckoutState['step']) => void;
  setAddress: (address: CheckoutState['address']) => void;
  setAppliedDiscount: (discount: AppliedDiscount | null) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  subscriptionId: null,
  step: 'cart',
  address: null,
  appliedDiscount: null,
  setSubscriptionId: (id) => set({ subscriptionId: id }),
  setStep: (step) => set({ step }),
  setAddress: (address) => set({ address }),
  setAppliedDiscount: (discount) => set({ appliedDiscount: discount }),
  reset: () => set({ subscriptionId: null, step: 'cart', address: null, appliedDiscount: null }),
}));
