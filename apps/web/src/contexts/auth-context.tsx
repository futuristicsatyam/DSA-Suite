'use client';

import React, {
  createContext, useCallback, useContext,
  useEffect, useState,
} from 'react';
import { authApi, AuthUser } from '@/lib/auth';
import { setAccessToken } from '@/lib/utils';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — silently restore session from refresh cookie
 useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const { data } = await authApi.refresh();
      if (cancelled) return;
      setAccessToken(data.accessToken);
      const { data: me } = await authApi.me();
      if (cancelled) return;
      setUser(me);
    } catch {
      if (!cancelled) setUser(null);
    } finally {
      if (!cancelled) setIsLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const { data } = await authApi.login(identifier, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, logout, refreshUser, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
