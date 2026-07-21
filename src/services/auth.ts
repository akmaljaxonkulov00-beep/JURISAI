// Authentication Service
import React from 'react';
import { api } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at: string;
  last_login?: string;
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
      isAuthenticated: !!this.token,
      isLoading: false
    };
  }

  // Login
  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await api.login(email, password);
      
      if (response && response.data) {
        const data = response.data as { user: User; token: string };
        const { user, token } = data;
        
        this.token = token;
        this.user = user;
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Register
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<boolean> {
    try {
      const response = await api.register(userData);
      
      if (response && response.data) {
        const data = response.data as { user: User; token: string };
        const { user, token } = data;
        
        this.token = token;
        this.user = user;
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Call logout API
      if (this.token) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      this.token = null;
      this.user = null;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }

  // Refresh token
  async refreshToken(): Promise<boolean> {
    try {
      if (!this.token) return false;
      
      const response = await api.refreshToken();
      
      if (response && response.data) {
        const data = response.data as { token: string };
        const { token } = data;
        
        this.token = token;
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await this.logout();
      return false;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  // Update user profile
  async updateProfile(profileData: Record<string, any>): Promise<boolean> {
    try {
      if (!this.token) return false;
      
      const response = await api.updateUserProfile(profileData);
      
      if (response && response.data) {
        this.user = response.data as any;
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(this.user));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }

  // Initialize auth state from URL (for OAuth redirects)
  async initializeFromUrl(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    
    if (token && userData) {
      try {
        this.token = token;
        this.user = JSON.parse(decodeURIComponent(userData)) as User;
        
        // Store in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(this.user));
        
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        
        return true;
      } catch (error) {
        console.error('URL auth initialization error:', error);
        return false;
      }
    }
    
    return false;
  }

  // Get auth headers for API calls
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Validate token (basic check)
  isTokenValid(): boolean {
    if (!this.token) return false;
    
    try {
      // Basic JWT validation (check if token is not expired)
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const authService = AuthService.getInstance();

// Export auth service
export { authService };

// Export types
export type { User, AuthState };

// Export hooks for React components
export const useAuth = () => {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  React.useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = async () => {
      console.log('Auth hook - initializing...');
      const state = authService.getAuthState();
      console.log('Auth hook - initial state:', state);
      setAuthState({ ...state, isLoading: false });
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const success = await authService.login(email, password);
    
    if (success) {
      const state = authService.getAuthState();
      setAuthState({ ...state, isLoading: false });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
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
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
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

  const updateProfile = async (profileData: Record<string, any>) => {
    const success = await authService.updateProfile(profileData);
    
    if (success) {
      const state = authService.getAuthState();
      setAuthState(prev => ({ ...prev, user: state.user }));
    }
    
    return success;
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    hasRole: authService.hasRole.bind(authService),
    getAuthHeaders: authService.getAuthHeaders.bind(authService)
  };
};
