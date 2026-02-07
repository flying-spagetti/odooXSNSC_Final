import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code: string; message: string; details?: any }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'ADMIN' | 'INTERNAL' | 'PORTAL';
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  _count?: { variants: number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  description?: string;
  basePrice: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface RecurringPlan {
  id: string;
  name: string;
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  intervalCount: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionLine {
  id: string;
  subscriptionId: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  discountId?: string;
  taxRateId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  variant?: ProductVariant & { product?: Product };
  discount?: Discount;
  taxRate?: TaxRate;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  userId: string;
  planId: string;
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED';
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  orderDate?: string;
  expirationDate?: string;
  quotationTemplate?: string;
  paymentTermDays?: number;
  paymentMethod?: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'OTHER';
  paymentDone: boolean;
  salespersonId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; name: string };
  plan?: RecurringPlan;
  salesperson?: { id: string; email: string; name: string };
  lines?: SubscriptionLine[];
  invoices?: Invoice[];
  _count?: { lines: number; invoices: number };
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  taxAmount: string;
  lineTotal: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED';
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  paidAmount: string;
  notes?: string;
  createdAt: string;
  subscription?: Subscription;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'OTHER';
  reference?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  name: string;
  code?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: string;
  description?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  minPurchaseAmount?: string;
  applicableProductIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  
  signup: (email: string, password: string, name: string) =>
    api.post<{ user: User; token: string }>('/auth/signup', { email, password, name }),
  
  getMe: () => api.get<{ user: User }>('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string; token?: string }>('/auth/forgot-password', { email }),
  
  verifyResetToken: (token: string) =>
    api.post<{ valid: boolean; email: string; name: string }>('/auth/verify-reset-token', { token }),
  
  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password }),
  
  checkEmail: (email: string) =>
    api.post<{ exists: boolean }>('/auth/check-email', { email }),
};

// User APIs
export const userApi = {
  list: (params?: { role?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),
  
  get: (id: string) =>
    api.get<{ user: User }>(`/admin/users/${id}`),
  
  create: (data: { email: string; password: string; name: string; role: 'INTERNAL' | 'PORTAL' }) =>
    api.post<{ user: User }>('/admin/users', data),
  
  updateProfile: (id: string, data: { name?: string; phone?: string; address?: string }) =>
    api.patch<{ user: User }>(`/admin/users/${id}/profile`, data),
};

// Product APIs
export const productApi = {
  list: (params?: { search?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),
  
  get: (id: string) =>
    api.get<{ product: Product }>(`/products/${id}`),
  
  create: (data: { name: string; description?: string; image?: File }) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.image) formData.append('image', data.image);
    return api.post<{ product: Product }>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  update: (id: string, data: { name?: string; description?: string; isActive?: boolean; image?: File }) => {
    if (data.image) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('image', data.image);
      return api.patch<{ product: Product }>(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.patch<{ product: Product }>(`/products/${id}`, data);
  },
  
  listVariants: (productId: string) =>
    api.get<{ variants: ProductVariant[] }>(`/products/${productId}/variants`),
  
  createVariant: (productId: string, data: { name: string; sku: string; basePrice: number; description?: string; image?: File }) => {
    if (data.image) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('sku', data.sku);
      formData.append('basePrice', data.basePrice.toString());
      if (data.description) formData.append('description', data.description);
      formData.append('image', data.image);
      return api.post<{ variant: ProductVariant }>(`/products/${productId}/variants`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post<{ variant: ProductVariant }>(`/products/${productId}/variants`, data);
  },
  
  updateVariant: (productId: string, variantId: string, data: { name?: string; basePrice?: number; description?: string; isActive?: boolean }) =>
    api.patch<{ variant: ProductVariant }>(`/products/${productId}/variants/${variantId}`, data),
};

// Recurring Plan APIs
export const planApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<RecurringPlan>>('/plans', { params }),
  
  get: (id: string) =>
    api.get<{ plan: RecurringPlan }>(`/plans/${id}`),
  
  create: (data: { name: string; billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; intervalCount?: number; description?: string }) =>
    api.post<{ plan: RecurringPlan }>('/plans', data),
  
  update: (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.patch<{ plan: RecurringPlan }>(`/plans/${id}`, data),
};

// Subscription APIs
export const subscriptionApi = {
  list: (params?: { userId?: string; status?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<Subscription>>('/subscriptions', { params }),
  
  get: (id: string) =>
    api.get<{ subscription: Subscription }>(`/subscriptions/${id}`),
  
  create: (data: {
    userId: string;
    planId: string;
    notes?: string;
    quotationTemplate?: string;
    expirationDate?: string;
    paymentTermDays?: number;
    paymentMethod?: string;
    salespersonId?: string;
  }) =>
    api.post<{ subscription: Subscription }>('/subscriptions', data),
  
  update: (id: string, data: {
    quotationTemplate?: string;
    expirationDate?: string;
    paymentTermDays?: number;
    paymentMethod?: string;
    paymentDone?: boolean;
    salespersonId?: string;
    notes?: string;
  }) =>
    api.patch<{ subscription: Subscription }>(`/subscriptions/${id}`, data),

  delete: (id: string) =>
    api.delete(`/subscriptions/${id}`),

  cancel: (id: string) =>
    api.post<{ subscription: Subscription }>(`/subscriptions/${id}/actions/cancel`, {}),

  renew: (id: string) =>
    api.post<{ subscription: Subscription }>(`/subscriptions/${id}/actions/renew`, {}),
  
  addLine: (id: string, data: { variantId: string; quantity: number; unitPrice: number; discountId?: string; taxRateId?: string; notes?: string }) =>
    api.post<{ line: SubscriptionLine }>(`/subscriptions/${id}/lines`, data),
  
  quote: (id: string) =>
    api.post<{ subscription: Subscription }>(`/subscriptions/${id}/actions/quote`, {}),
  
  confirm: (id: string, startDate?: string) =>
    api.post<{ subscription: Subscription }>(`/subscriptions/${id}/actions/confirm`, { startDate }),
  
  activate: (id: string) =>
    api.post<{ subscription: Subscription }>(`/subscriptions/${id}/actions/activate`, {}),
  
  close: (id: string, endDate?: string) =>
    api.post<{ subscription: Subscription }>(`/subscriptions/${id}/actions/close`, { endDate }),
  
  generateInvoice: (id: string, periodStart: string) =>
    api.post<{ invoice: Invoice }>(`/subscriptions/${id}/invoices/generate`, null, {
      params: { periodStart },
    }),
};

// Invoice APIs
export const invoiceApi = {
  list: (params?: { subscriptionId?: string; status?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<Invoice>>('/invoices', { params }),
  
  get: (id: string) =>
    api.get<{ invoice: Invoice }>(`/invoices/${id}`),
  
  confirm: (id: string) =>
    api.post<{ invoice: Invoice }>(`/invoices/${id}/actions/confirm`, {}),
  
  cancel: (id: string) =>
    api.post<{ invoice: Invoice }>(`/invoices/${id}/actions/cancel`, {}),
  
  restore: (id: string) =>
    api.post<{ invoice: Invoice }>(`/invoices/${id}/actions/restore`, {}),
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/invoices/${id}`),
  
  recordPayment: (id: string, data: { amount: number; paymentMethod: string; reference?: string; notes?: string; paymentDate?: string }) =>
    api.post<{ payment: Payment }>(`/invoices/${id}/payments`, data),
  
  listPayments: (id: string) =>
    api.get<{ payments: Payment[] }>(`/invoices/${id}/payments`),
};

// Tax APIs
export const taxApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<TaxRate>>('/taxes', { params }),
  
  get: (id: string) =>
    api.get<{ taxRate: TaxRate }>(`/taxes/${id}`),
  
  create: (data: { name: string; rate: number; description?: string }) =>
    api.post<{ taxRate: TaxRate }>('/taxes', data),
  
  update: (id: string, data: { name?: string; rate?: number; description?: string; isActive?: boolean }) =>
    api.patch<{ taxRate: TaxRate }>(`/taxes/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/taxes/${id}`),
};

// Report APIs
export const reportApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api.get<{ summary: ReportSummary }>('/reports/summary', { params }),

  getSubscriptionMetrics: () =>
    api.get<{ metrics: { status: string; count: number }[] }>('/reports/subscriptions/metrics'),
};

export interface ReportSummary {
  activeSubscriptionsCount: number;
  totalRevenue: number;
  totalPayments: number;
  overdueInvoicesCount: number;
  draftInvoicesCount: number;
  confirmedInvoicesCount: number;
  paidInvoicesCount: number;
}

// Subscription Template types
export interface SubscriptionTemplateLine {
  id: string;
  templateId: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  discountId?: string;
  taxRateId?: string;
  variant?: ProductVariant & { product?: Product };
  discount?: Discount;
  taxRate?: TaxRate;
}

export interface SubscriptionTemplate {
  id: string;
  name: string;
  validityDays: number;
  planId: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: RecurringPlan;
  lines?: SubscriptionTemplateLine[];
}

// Template APIs
export const templateApi = {
  list: (params?: { isActive?: boolean; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<SubscriptionTemplate>>('/templates', { params }),

  get: (id: string) =>
    api.get<{ template: SubscriptionTemplate }>(`/templates/${id}`),

  create: (data: {
    name: string;
    validityDays: number;
    planId: string;
    description?: string;
    lines?: { variantId: string; quantity: number; unitPrice: number; discountId?: string; taxRateId?: string }[];
  }) => api.post<{ template: SubscriptionTemplate }>('/templates', data),

  update: (id: string, data: {
    name?: string;
    validityDays?: number;
    planId?: string;
    description?: string;
    isActive?: boolean;
  }) => api.patch<{ template: SubscriptionTemplate }>(`/templates/${id}`, data),

  delete: (id: string) =>
    api.delete(`/templates/${id}`),

  addLine: (id: string, data: { variantId: string; quantity: number; unitPrice: number; discountId?: string; taxRateId?: string }) =>
    api.post<{ line: SubscriptionTemplateLine }>(`/templates/${id}/lines`, data),

  removeLine: (id: string, lineId: string) =>
    api.delete(`/templates/${id}/lines/${lineId}`),
};

// Discount APIs
export const discountApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<Discount>>('/discounts', { params }),
  
  get: (id: string) =>
    api.get<{ discount: Discount }>(`/discounts/${id}`),
  
  create: (data: {
    name: string;
    code?: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    description?: string;
    startDate?: string;
    endDate?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    minPurchaseAmount?: number;
    applicableProductIds?: string[];
  }) =>
    api.post<{ discount: Discount }>('/discounts', data),
  
  update: (id: string, data: {
    name?: string;
    code?: string;
    type?: 'PERCENTAGE' | 'FIXED';
    value?: number;
    description?: string;
    startDate?: string;
    endDate?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    minPurchaseAmount?: number;
    applicableProductIds?: string[];
    isActive?: boolean;
  }) =>
    api.patch<{ discount: Discount }>(`/discounts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/discounts/${id}`),
  
  validateCode: (data: {
    code: string;
    cartItems: Array<{ variantId: string; quantity: number; unitPrice: number }>;
    userId?: string;
  }) =>
    api.post<{ valid: boolean; discount?: Discount; discountAmount?: number; message?: string }>('/discounts/validate', data),
};

// Payment APIs (Razorpay)
export const paymentApi = {
  createOrder: (data: {
    invoiceId?: string;
    subscriptionId?: string;
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }) => api.post<{ order: any; invoiceId?: string; subscriptionId?: string }>('/payments/create-order', data),

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    invoiceId: string;
  }) => api.post<{ success: boolean; payment: any; invoice: any }>('/payments/verify', data),

  getPayment: (paymentId: string) =>
    api.get<{ payment: any }>(`/payments/${paymentId}`),

  getOrder: (orderId: string) =>
    api.get<{ order: any }>(`/payments/orders/${orderId}`),
};
