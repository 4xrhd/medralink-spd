import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role: 'DOCTOR' | 'PATIENT' | 'ADMIN') => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('medralink_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('medralink_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data.data;
    localStorage.setItem('medralink_token', receivedToken);
    localStorage.setItem('medralink_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
  };

  const quickLogin = async (role: 'DOCTOR' | 'PATIENT' | 'ADMIN') => {
    let email = '';
    let password = '';
    if (role === 'DOCTOR') {
      email = 'dr.ahmed@medralink.com';
      password = 'doctor123';
    } else if (role === 'PATIENT') {
      email = 'rahim@gmail.com';
      password = 'patient123';
    } else if (role === 'ADMIN') {
      email = 'admin@medralink.com';
      password = 'admin123';
    }
    await login(email, password);
  };

  const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    const { token: receivedToken, user: receivedUser } = response.data.data;
    localStorage.setItem('medralink_token', receivedToken);
    localStorage.setItem('medralink_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
  };

  const logout = () => {
    localStorage.removeItem('medralink_token');
    localStorage.removeItem('medralink_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, quickLogin, register, logout }}>
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
