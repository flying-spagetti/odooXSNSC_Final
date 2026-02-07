import { create } from 'zustand';
import { User, authApi } from '@/lib/api';

/**
 * Decode a JWT payload without a library (browser-safe).
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT token has expired (with a 60-second buffer).
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true; // no expiry claim → treat as expired
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowInSeconds + 60; // 60 s buffer
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // No stored credentials → not authenticated
    if (!token || !userStr) {
      set({ isInitializing: false });
      return;
    }

    // Check if the JWT has expired on the client side first
    if (isTokenExpired(token)) {
      console.warn('JWT token expired, clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      return;
    }

    // Optimistically restore from localStorage so the UI renders immediately
    try {
      const cachedUser = JSON.parse(userStr) as User;
      set({ user: cachedUser, token, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ isInitializing: false });
      return;
    }

    // Verify with the server in the background
    try {
      const { data } = await authApi.getMe();
      // Update with fresh user data from the server
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isInitializing: false });
    } catch {
      // Token is invalid / revoked on the server → log out
      console.warn('Server rejected token, clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
