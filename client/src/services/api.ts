import axios from 'axios';

export const TOKEN_KEY = 'medralink_token';
export const USER_KEY = 'medralink_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Seconds since epoch at which a JWT expires, or null when it cannot be read. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  const exp = getTokenExpiry(token);
  return exp !== null && exp * 1000 <= nowMs;
}

// AuthProvider registers what happens when the session ends, so React state and routing stay in charge
let onUnauthorized: (() => void) | null = null;
let unauthorizedPending = false;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    // A failed sign-in or password reset is a form error, not an expired session
    const isAuthForm = /\/auth\/(login|register|forgot-password|reset-password)/.test(url);
    if (error.response?.status === 401 && !isAuthForm && !unauthorizedPending) {
      unauthorizedPending = true; // parallel 401s trigger one sign-out
      queueMicrotask(() => {
        unauthorizedPending = false;
      });
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** True when a request was cancelled because the component that made it went away. */
export const isCancelled = (err: unknown): boolean => axios.isCancel(err);

/** Prefers the first field-level validation message, then the server message, then the fallback. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: { message: string }[] } } })?.response?.data;
  return data?.errors?.[0]?.message || data?.message || fallback;
}

export default api;
