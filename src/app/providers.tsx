'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { firebaseAuth } from '@/services/firebase-auth';
import type { AuthUser } from '@/services/firebase-auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  getSubscriptionPlan: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const hasActiveSubscription = user?.subscription_expires_at ? 
    new Date(user.subscription_expires_at) > new Date() : false;
  const getSubscriptionPlan = user?.subscription_plan || 'free';

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = firebaseAuth.onAuthChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await firebaseAuth.signIn(email, password);
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true };
      }
      return { success: false, error: result.error || 'Login xatosi' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Login xatosi' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await firebaseAuth.signUp(userData.email, userData.password, userData.name);
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true };
      }
      return { success: false, error: result.error || 'Ro\'yxatdan o\'tish xatosi' };
    } catch (error) {
      return { success: false, error: 'Ro\'yxatdan o\'tish xatosi' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await firebaseAuth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    setIsLoading(true);
    try {
      if (!user) {
        return { success: false, error: 'Foydalanuvchi tizimga kirmagan' };
      }

      const result = await firebaseAuth.updateProfile(updates);
      if (result.success) {
        // Update local state
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      }
      return result;
    } catch (error) {
      return { success: false, error: 'Profilni yangilash xatosi' };
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

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
