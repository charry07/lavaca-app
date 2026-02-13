import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@lavaca/shared';
import { api } from '../services/api';

const AUTH_KEY = 'lavaca_user';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  register: (phone: string, displayName: string, username: string, documentId?: string) => Promise<void>;
  login: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed: User = JSON.parse(stored);
          setUser(parsed);
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
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
  };

  const register = useCallback(async (phone: string, displayName: string, username: string, documentId?: string) => {
    const u = await api.register({ phone, displayName, username, documentId });
    await persistUser(u);
  }, []);

  const login = useCallback(async (phone: string) => {
    const u = await api.login(phone);
    await persistUser(u);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  }, []);

  const updateProfile = useCallback(async (data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => {
    if (!user) return;
    const updated = await api.updateUser(user.id, data);
    await persistUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
