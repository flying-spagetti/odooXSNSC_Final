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
  role: 'ADMIN' | 'INTERNAL' | 'PORTAL';
  isActive: boolean;
  createdAt: string;
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; name: string };
  plan?: { id: string; name: string; billingPeriod: string; intervalCount: number };
  lines?: any[];
  _count?: { lines: number; invoices: number };
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
  createdAt: string;
  subscription?: Subscription;
  lines?: any[];
  payments?: any[];
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
};

// Subscription APIs
export const subscriptionApi = {
  list: (params?: { userId?: string; status?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<Subscription>>('/subscriptions', { params }),
  
  get: (id: string) =>
    api.get<{ subscription: Subscription }>(`/subscriptions/${id}`),
  
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
};
