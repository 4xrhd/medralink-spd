import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY, USER_KEY, getTokenExpiry, isTokenExpired, setUnauthorizedHandler } from '../services/api.js';
import { User, UserRole } from '../types/index.js';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  [field: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Reads the saved session; an expired token or unreadable user counts as no session. */
function readStoredSession(): { token: string; user: User } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  if (!token || !raw || isTokenExpired(token)) return null;
  try {
    return { token, user: JSON.parse(raw) as User };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session] = useState(readStoredSession);
  const [user, setUser] = useState<User | null>(session?.user ?? null);
  const [token, setToken] = useState<string | null>(session?.token ?? null);
  // While a stored session is being confirmed with the server, protected pages wait
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(session));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const startSession = useCallback((receivedToken: string, receivedUser: User) => {
    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
  }, []);

  // Any 401 from the API ends the session; ProtectedRoute then sends the user to /login
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Confirm a restored session with the server (the account may be suspended or the role changed)
  useEffect(() => {
    if (!session) {
      logout();
      return;
    }
    const controller = new AbortController();
    api
      .get('/auth/me', { signal: controller.signal })
      .then((res) => {
        if (res.data?.data?.role !== session.user.role) logout();
      })
      .catch(() => undefined) // a 401 already signed out; offline keeps the cached session
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [session, logout]);

  // Sign out exactly when the token expires
  useEffect(() => {
    if (!token) return;
    const exp = getTokenExpiry(token);
    if (exp === null) return;
    const timer = window.setTimeout(logout, Math.max(0, exp * 1000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [token, logout]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data.data;
    startSession(receivedToken, receivedUser);
  };

  const register = async (data: RegisterPayload) => {
    const response = await api.post('/auth/register', data);
    const { token: receivedToken, user: receivedUser } = response.data.data;
    startSession(receivedToken, receivedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
