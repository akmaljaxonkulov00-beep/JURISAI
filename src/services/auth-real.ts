// Real Authentication Service with Supabase
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at: string;
  last_login?: string;
  subscription_plan?: string;
  subscription_expires_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Get current auth state
  getAuthState(): AuthState {
    return {
      user: this.user,
      token: this.token,
      isAuthenticated: !!this.token && !!this.user,
      isLoading: false
    };
  }

  // Real login with Supabase
  async login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        // Create profile if doesn't exist
        if (!profile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: 'user',
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Profile creation error:', insertError);
            return false;
          }

          this.user = newProfile;
        } else {
          // Update last login
          const { error: updateError } = await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Login update error:', updateError);
          }

          this.user = profile;
        }

        this.token = data.session?.access_token || null;
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', this.token || '');
          localStorage.setItem('auth_user', JSON.stringify(this.user));
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Real registration with Supabase
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'user'
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: userData.name,
            role: userData.role || 'user',
            created_at: new Date().toISOString(),
            subscription_plan: 'free'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return false;
        }

        // Auto login after registration
        return await this.login(userData.email, userData.password);
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  // Real logout with Supabase
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.token = null;
    this.user = null;

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<boolean> {
    if (!this.user) return false;

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.user.id);

      if (error) {
        console.error('Profile update error:', error);
        return false;
      }

      // Update local user data
      this.user = { ...this.user, ...updates };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      }

      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get token
  getToken(): string | null {
    return this.token;
  }
}

export const authService = AuthService.getInstance();
export type { User, AuthState };

// React hook for auth - FIXED INITIALIZATION
export function useAuth() {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Auth hook - initializing...');
      
      // Check current session with Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      if (session?.user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        const user = profile || {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: session.user.user_metadata?.role || 'user',
          created_at: session.user.created_at || new Date().toISOString()
        };

        setAuthState({
          user,
          token: session.access_token,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const user = profile || {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: session.user.user_metadata?.role || 'user',
            created_at: session.user.created_at || new Date().toISOString()
          };

          setAuthState({
            user,
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const success = await authService.login(email, password);
    
    if (success) {
      const state = authService.getAuthState();
      setAuthState({ ...state, isLoading: false });
      console.log('Login successful - Auth state updated:', state);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.log('Login failed - Auth state reset to unauthenticated');
    }
    
    return success;
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const success = await authService.register(userData);
    
    if (success) {
      const state = authService.getAuthState();
      setAuthState({ ...state, isLoading: false });
      console.log('Login successful - Auth state updated:', state);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.log('Login failed - Auth state reset to unauthenticated');
    }
    
    return success;
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await authService.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateProfile = async (updates: Partial<User>) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const success = await authService.updateProfile(updates);
    
    if (success) {
      const state = authService.getAuthState();
      setAuthState({ ...state, isLoading: false });
      console.log('Login successful - Auth state updated:', state);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.log('Login failed - Auth state reset to unauthenticated');
    }
    
    return success;
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile
  };
}

// Server-side session check
export async function getServerSession(): Promise<{ user: User | null }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return { user: null };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const user = profile || {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      role: session.user.user_metadata?.role || 'user',
      created_at: session.user.created_at || new Date().toISOString()
    };

    return { user };
  } catch (error) {
    console.error('Server session error:', error);
    return { user: null };
  }
}
