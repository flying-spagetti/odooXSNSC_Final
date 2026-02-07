import { create } from 'zustand';
import { ProductVariant, Product } from '@/lib/api';

export interface CartItem {
  variantId: string;
  variant: ProductVariant & { product?: Product };
  quantity: number;
  planId: string; // Recurring plan ID (Monthly, 6 Months, Yearly)
  planName: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  intervalCount: number; // 1 for monthly, 6 for 6 months, 12 for yearly
  unitPrice: number; // Price per month
  totalPrice: number; // Total price for the selected period
  discount?: number; // Discount percentage
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'totalPrice'>) => void;
  removeItem: (variantId: string, planId: string) => void;
  updateQuantity: (variantId: string, planId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  _hasHydrated: boolean;
  _setHasHydrated: (state: boolean) => void;
}

const CART_STORAGE_KEY = 'cart-storage';

const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  _hasHydrated: false,
  _setHasHydrated: (state) => set({ _hasHydrated: state }),

  addItem: (item) => {
    const existingItem = get().items.find(
      (i) => i.variantId === item.variantId && i.planId === item.planId
    );

    if (existingItem) {
      // Update quantity if item already exists
      get().updateQuantity(item.variantId, item.planId, existingItem.quantity + item.quantity);
    } else {
      // Calculate total price based on billing period
      const months = item.billingPeriod === 'MONTHLY' ? item.intervalCount : item.intervalCount;
      const totalPrice = item.unitPrice * months * item.quantity;
      
      // Apply discount if available
      const discountedPrice = item.discount
        ? totalPrice * (1 - item.discount / 100)
        : totalPrice;

      const newItems = [
        ...get().items,
        {
          ...item,
          totalPrice: discountedPrice,
        },
      ];
      set({ items: newItems });
      saveCartToStorage(newItems);
    }
  },

  removeItem: (variantId, planId) => {
    const newItems = get().items.filter(
      (item) => !(item.variantId === variantId && item.planId === planId)
    );
    set({ items: newItems });
    saveCartToStorage(newItems);
  },

  updateQuantity: (variantId, planId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId, planId);
      return;
    }

    const newItems = get().items.map((item) => {
      if (item.variantId === variantId && item.planId === planId) {
        const months = item.billingPeriod === 'MONTHLY' ? item.intervalCount : item.intervalCount;
        const totalPrice = item.unitPrice * months * quantity;
        const discountedPrice = item.discount
          ? totalPrice * (1 - item.discount / 100)
          : totalPrice;
        return { ...item, quantity, totalPrice: discountedPrice };
      }
      return item;
    });
    set({ items: newItems });
    saveCartToStorage(newItems);
  },

  clearCart: () => {
    set({ items: [] });
    saveCartToStorage([]);
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },
}));

// Hydrate cart from localStorage on mount - use a safer approach
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after React is initialized
  setTimeout(() => {
    try {
      const storedItems = loadCartFromStorage();
      if (storedItems && Array.isArray(storedItems)) {
        useCartStore.setState({ items: storedItems, _hasHydrated: true });
      } else {
        useCartStore.setState({ _hasHydrated: true });
      }
    } catch (error) {
      console.warn('Failed to hydrate cart from localStorage:', error);
      useCartStore.setState({ _hasHydrated: true });
    }
  }, 0);
}
