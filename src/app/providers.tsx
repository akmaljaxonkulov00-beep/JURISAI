'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  subscription_plan?: string;
  subscription_expires_at?: string;
}

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

// Mock user data
const mockUsers: User[] = [
  {
    id: 'test-admin-1',
    email: 'admin@jurisai.uz',
    name: 'Admin User',
    role: 'ADMIN',
    subscription_plan: 'premium',
    subscription_expires_at: '2024-12-31'
  },
  {
    id: 'test-user-1',
    email: 'user@jurisai.uz',
    name: 'Test User',
    role: 'USER',
    subscription_plan: 'pro',
    subscription_expires_at: '2024-06-30'
  },
  {
    id: 'demo-user',
    email: 'demo@jurisai.uz',
    name: 'Demo User',
    role: 'USER',
    subscription_plan: 'free'
  }
];

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const hasActiveSubscription = user?.subscription_expires_at ? 
    new Date(user.subscription_expires_at) > new Date() : false;
  const getSubscriptionPlan = user?.subscription_plan || 'free';

  useEffect(() => {
    // Check localStorage on mount
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('jurisai_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user in mock data
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (!foundUser) {
        return { success: false, error: 'Foydalanuvchi topilmadi' };
      }

      // In real app, verify password here
      if (password !== 'password123') {
        return { success: false, error: 'Noto\'g\'ri parol' };
      }

      // Set user
      setUser(foundUser);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('jurisai_user', JSON.stringify(foundUser));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login xatosi' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' };
      }

      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        email: userData.email,
        name: userData.name,
        role: 'USER',
        subscription_plan: 'free'
      };

      // Add to mock users (in real app, save to database)
      mockUsers.push(newUser);

      // Auto login after registration
      setUser(newUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('jurisai_user', JSON.stringify(newUser));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Ro\'yxatdan o\'tish xatosi' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jurisai_user');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    setIsLoading(true);
    try {
      if (!user) {
        return { success: false, error: 'Foydalanuvchi tizimga kirmagan' };
      }

      // Update user data
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update in mock users
      const userIndex = mockUsers.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        mockUsers[userIndex] = updatedUser;
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('jurisai_user', JSON.stringify(updatedUser));
      }

      return { success: true };
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
