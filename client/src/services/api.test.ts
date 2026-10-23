import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { getTokenExpiry, isTokenExpired, setUnauthorizedHandler } from './api.js';

const tokenWith = (payload: object) => `h.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.s`;

describe('JWT expiry helpers', () => {
  it('reads exp from the payload', () => {
    expect(getTokenExpiry(tokenWith({ exp: 1_900_000_000 }))).toBe(1_900_000_000);
  });

  it('treats unreadable tokens as having no expiry', () => {
    expect(getTokenExpiry('not-a-jwt')).toBeNull();
    expect(isTokenExpired('not-a-jwt')).toBe(false);
  });

  it('knows when a token has expired', () => {
    const token = tokenWith({ exp: 1000 });
    expect(isTokenExpired(token, 999_000)).toBe(false);
    expect(isTokenExpired(token, 1_000_000)).toBe(true);
  });
});

describe('401 handling', () => {
  afterEach(() => setUnauthorizedHandler(null));

  const fail = (url: string) => {
    const handlers = (api.interceptors.response as unknown as { handlers: Array<{ rejected: (e: unknown) => Promise<unknown> }> }).handlers;
    return handlers[0].rejected({ config: { url }, response: { status: 401 } }).catch(() => undefined);
  };

  it('ends the session once for parallel 401s on API calls', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await Promise.all([fail('/patients'), fail('/dashboard')]);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('leaves a failed sign-in to the login form', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await fail('/auth/login');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
