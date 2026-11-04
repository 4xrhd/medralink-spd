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

/** Fetches a protected PDF through the API client and saves it under the given file name. */
async function fetchProtectedBlob(path: string): Promise<Blob> {
  try {
    const res = await api.get<Blob>(path, { responseType: 'blob' });
    return res.data;
  } catch (err) {
    // Error bodies arrive as a Blob here; turn them back into JSON so the real reason is shown
    const response = (err as { response?: { data?: unknown } })?.response;
    if (response?.data instanceof Blob) {
      try {
        response.data = JSON.parse(await response.data.text());
      } catch {
        response.data = undefined;
      }
    }
    throw err;
  }
}

/**
 * Opens a protected PDF or image in a new tab. The tab is opened before the request so the
 * browser's pop-up blocker still counts it as part of the click.
 */
export async function openProtectedFile(path: string): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await fetchProtectedBlob(path));
    if (tab) tab.location.href = url;
    else window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

export async function downloadPdf(path: string, filename: string): Promise<void> {
  const url = URL.createObjectURL(await fetchProtectedBlob(path));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before releasing the blob
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default api;
