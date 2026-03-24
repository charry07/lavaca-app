import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { User } from '@lavaca/types';
import { api } from '../services/api';

const AUTH_KEY = 'lavaca_user';

type AuthStep = 'phone' | 'pin' | 'register' | 'reset' | 'done';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  authStep: AuthStep;
  pendingPhone: string | null;
  pendingAuthEmail: string | null;
  checkPhone: (phone: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  register: (displayName: string, username: string, documentId: string, pin: string, email: string) => Promise<void>;
  resetPin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => Promise<void>;
  resetAuth: () => void;
  goToReset: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  authStep: 'phone',
  pendingPhone: null,
  pendingAuthEmail: null,
  checkPhone: async () => {},
  loginWithPin: async () => {},
  register: async () => {},
  resetPin: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
  updateProfile: async () => {},
  resetAuth: () => {},
  goToReset: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [pendingAuthEmail, setPendingAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(AUTH_KEY);
        if (stored) {
          const parsed: User = JSON.parse(stored);
          setUser(parsed);
          setAuthStep('done');
        }
      } catch {
        // ignore parse/storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistUser = async (u: User) => {
    setUser(u);
    setAuthStep('done');
    await storage.setItem(AUTH_KEY, JSON.stringify(u));
  };

  const checkPhone = useCallback(async (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '').trim();
    const result = await api.checkPhone(cleanPhone);
    setPendingPhone(cleanPhone);
    setPendingAuthEmail(result.authEmail);
    setAuthStep(result.exists ? 'pin' : 'register');
  }, []);

  const loginWithPin = useCallback(async (pin: string) => {
    if (!pendingAuthEmail) throw new Error('No pending auth email');
    const u = await api.loginWithPin(pendingAuthEmail, pin);
    await persistUser(u);
  }, [pendingAuthEmail]);

  const register = useCallback(async (displayName: string, username: string, documentId: string, pin: string, email: string) => {
    if (!pendingPhone) throw new Error('No pending phone');
    const u = await api.register({ phone: pendingPhone, displayName, username, documentId, pin, email });
    await persistUser(u);
  }, [pendingPhone]);

  const resetPin = useCallback(async (email: string) => {
    await api.resetPin(email);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setAuthStep('phone');
    setPendingPhone(null);
    setPendingAuthEmail(null);
    await storage.removeItem(AUTH_KEY);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    await api.deleteUser(user.id);
    setUser(null);
    setAuthStep('phone');
    setPendingPhone(null);
    setPendingAuthEmail(null);
    await storage.removeItem(AUTH_KEY);
  }, [user]);

  const updateProfile = useCallback(async (data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => {
    if (!user) return;
    const updated = await api.updateUser(user.id, data);
    await persistUser(updated);
  }, [user]);

  const resetAuth = useCallback(() => {
    setAuthStep('phone');
    setPendingPhone(null);
    setPendingAuthEmail(null);
  }, []);

  const goToReset = useCallback(() => {
    setAuthStep('reset');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading, authStep, pendingPhone, pendingAuthEmail,
      checkPhone, loginWithPin, register, resetPin,
      logout, deleteAccount, updateProfile, resetAuth, goToReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
