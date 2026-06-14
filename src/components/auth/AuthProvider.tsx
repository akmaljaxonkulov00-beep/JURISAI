'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, User } from '@/lib/simple-auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  getSubscriptionPlan: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.getUser());
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const hasActiveSubscription = auth.hasActiveSubscription();
  const getSubscriptionPlan = auth.getSubscriptionPlan();

  useEffect(() => {
    const unsubscribe = auth.subscribe((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await auth.login(email, password);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await auth.register(userData);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    auth.logout();
  };

  const updateProfile = async (updates: Partial<User>) => {
    setIsLoading(true);
    try {
      const result = await auth.updateProfile(updates);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    hasActiveSubscription,
    getSubscriptionPlan,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
