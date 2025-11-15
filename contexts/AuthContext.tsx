
import React, { createContext, useContext, ReactNode } from 'react';
import { User, UserRole } from '../components/types';

// This is a mock authentication context to allow the application to build for preview purposes.
// It simulates a logged-in admin user.

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockAdmin: User = {
    id: 'mock-admin-id',
    name: 'Admin Preview',
    email: 'admin@preview.com',
    role: UserRole.Admin,
  };

  const value: AuthContextValue = {
    user: mockAdmin,
    isLoading: false,
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
