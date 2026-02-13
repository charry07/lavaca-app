import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { User } from '@lavaca/shared';
import { api } from '../services/api';

const AUTH_KEY = 'lavaca_user';

type AuthStep = 'phone' | 'otp' | 'register' | 'done';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  authStep: AuthStep;
  pendingPhone: string | null;
  devCode: string | null;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<void>;
  register: (displayName: string, username: string, documentId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => Promise<void>;
  resetAuth: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  authStep: 'phone',
  pendingPhone: null,
  devCode: null,
  sendOTP: async () => {},
  verifyOTP: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  resetAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Restore user from AsyncStorage on mount
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
        // ignore parse errors
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

  const sendOTP = useCallback(async (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '').trim();
    const result = await api.sendOTP(cleanPhone);
    setPendingPhone(cleanPhone);
    setDevCode(result.dev_code);
    setAuthStep('otp');
  }, []);

  const verifyOTP = useCallback(async (code: string) => {
    if (!pendingPhone) throw new Error('No pending phone');
    const result = await api.verifyOTP(pendingPhone, code);
    if (!result.verified) throw new Error('Invalid OTP');

    if (result.isRegistered && result.user) {
      // Existing user — auto login (data recovery)
      await persistUser(result.user);
    } else {
      // New user — need to complete registration
      setAuthStep('register');
    }
  }, [pendingPhone]);

  const register = useCallback(async (displayName: string, username: string, documentId: string) => {
    if (!pendingPhone) throw new Error('No pending phone');
    const u = await api.register({ phone: pendingPhone, displayName, username, documentId });
    await persistUser(u);
  }, [pendingPhone]);

  const logout = useCallback(async () => {
    setUser(null);
    setAuthStep('phone');
    setPendingPhone(null);
    setDevCode(null);
    await storage.removeItem(AUTH_KEY);
  }, []);

  const updateProfile = useCallback(async (data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => {
    if (!user) return;
    const updated = await api.updateUser(user.id, data);
    await persistUser(updated);
  }, [user]);

  const resetAuth = useCallback(() => {
    setAuthStep('phone');
    setPendingPhone(null);
    setDevCode(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading, authStep, pendingPhone, devCode,
      sendOTP, verifyOTP, register, logout, updateProfile, resetAuth,
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
