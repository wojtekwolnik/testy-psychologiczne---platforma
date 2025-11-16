
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../components/types';
import * as api from '../services/apiClient';

// --- Type Definitions ---

interface AuthContextValue {
  user: User | null;
  userFor2FA: User | null; // User pending 2FA verification
  isLoading: boolean;
  login: (email, password) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  logout: () => void;
  cancel2FA: () => void;
}

// --- Context Creation ---

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- Auth Provider Component ---

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userFor2FA, setUserFor2FA] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Effect to check for an existing session on initial load
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const currentUser = await api.checkAuthStatus();
        setUser(currentUser);
      } catch (error) {
        // No active session, which is a normal state
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      if (response.needs2FA) {
        setUserFor2FA(response.user);
        navigate('/2fa');
      } else {
        setUser(response.user);
        const redirectPath = response.user.role === UserRole.Admin ? '/admin/dashboard' : '/therapist/dashboard';
        navigate(redirectPath);
      }
    } catch (err) {
      // Re-throw the error to be caught in the component
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string) => {
    if (!userFor2FA) throw new Error("No user is pending 2FA verification.");
    setIsLoading(true);
    try {
      // The API will verify the code against the user's secret
      const verifiedUser = await api.verify2FA(userFor2FA.id, code);
      setUser(verifiedUser);
      setUserFor2FA(null); // Clear the pending user
      const redirectPath = verifiedUser.role === UserRole.Admin ? '/admin/dashboard' : '/therapist/dashboard';
      navigate(redirectPath);
    } catch (err) {
      throw err; // Re-throw to be handled by the 2FA page
    } finally {
      setIsLoading(false);
    }
  };
  
  const cancel2FA = () => {
    setUserFor2FA(null);
    navigate('/login');
  };

  const logout = async () => {
    setIsLoading(true);
    try {
        await api.logout();
        setUser(null);
        setUserFor2FA(null);
        navigate('/login');
    } catch (error) {
        console.error("Failed to logout:", error);
        // Still clear local state even if server logout fails
        setUser(null);
        setUserFor2FA(null);
        navigate('/login');
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
      {!isLoading ? children : <div className="flex justify-center items-center h-screen w-full"><div className="animate-spin rounded-full h-24 w-24 border-b-2 border-indigo-600"></div></div>}
    </AuthContext.Provider>
  );
};

// --- Custom Hook for easy context access ---

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
