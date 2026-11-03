'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '../components/types';
import { login as authLogin, logout as authLogout, checkAuth, verify2FA as authVerify2FA } from '@/app/actions/authActions';

interface AuthContextValue {
  user: User | null;
  userFor2FA: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  logout: () => void;
  cancel2FA: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userFor2FA, setUserFor2FA] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/therapist') || pathname?.startsWith('/report');

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const currentUser = await checkAuth();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authLogin(email, password);

      if (!response.success || !response.user) {
        throw new Error(response.error || 'Login failed');
      }

      setUser(response.user);
      const redirectPath = response.user.role === UserRole.Admin ? '/admin/dashboard' : '/therapist/dashboard';
      router.push(redirectPath);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string) => {
    if (!userFor2FA) throw new Error("No user is pending 2FA verification.");
    setIsLoading(true);
    try {
      const response = await authVerify2FA(userFor2FA.id, code);
      if (response.success && response.user) {
        setUser(response.user);
        setUserFor2FA(null);
        const redirectPath = response.user.role === UserRole.Admin ? '/admin/dashboard' : '/therapist/dashboard';
        router.push(redirectPath);
      } else {
        throw new Error(response.error || 'Verification failed');
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancel2FA = () => {
    setUserFor2FA(null);
    router.push('/login');
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authLogout();
      setUser(null);
      setUserFor2FA(null);
      router.push('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
      setUser(null);
      setUserFor2FA(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    userFor2FA,
    isLoading,
    login,
    verify2FA,
    logout,
    cancel2FA,
  };

  return (
    <AuthContext.Provider value={value}>
      {(!isLoading || !isProtectedRoute) ? (
        children
      ) : (
        <div className="flex justify-center items-center h-screen w-full bg-background" role="status" aria-label="Weryfikacja sesji">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
