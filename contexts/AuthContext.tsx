
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../components/types';

// A more realistic AuthContext that holds user state and provides login/logout functions.

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the user profile from an API
    // For now, we simulate an async check and default to a logged-out state.
    setTimeout(() => {
        // To simulate being logged in for development, you can uncomment the following lines:
        /*
        setUser({
            id: 'mock-admin-id',
            name: 'Admin User',
            email: 'admin@example.com',
            role: UserRole.Admin,
        });
        */
        setIsLoading(false);
    }, 500);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = () => {
    // In a real app, you would also clear any tokens from localStorage/cookies
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
