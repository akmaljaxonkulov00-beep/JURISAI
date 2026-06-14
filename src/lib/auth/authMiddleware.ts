'use client';

import React from 'react';
import { AuthUser } from '@/components/auth/EnhancedAuthSystem';

export interface AuthMiddlewareContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  logout: () => void;
}

export class AuthMiddleware {
  private static instance: AuthMiddleware;
  private user: AuthUser | null = null;
  private isLoading: boolean = false;

  private constructor() {
    this.checkAuthStatus();
  }

  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  private checkAuthStatus(): void {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          this.user = null;
        }
      }
    }
  }

  public getUser(): AuthUser | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return this.user !== null && this.user.status === 'ACTIVE';
  }

  public hasPermission(permission: string): boolean {
    if (!this.user) return false;
    return this.user.permissions.includes(permission);
  }

  public hasRole(role: string): boolean {
    if (!this.user) return false;
    return this.user.role === role;
  }

  public isAdmin(): boolean {
    return this.hasRole('ADMIN') || this.hasRole('SUPER_ADMIN');
  }

  public isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  public logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      this.user = null;
      window.location.href = '/signin';
    }
  }

  public requireAuth(): boolean {
    if (!this.isAuthenticated()) {
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
      return false;
    }
    return true;
  }

  public requireAdmin(): boolean {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
      return false;
    }
    return true;
  }

  public requireSuperAdmin(): boolean {
    if (!this.requireAuth()) return false;
    if (!this.isSuperAdmin()) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
      return false;
    }
    return true;
  }

  public requirePermission(permission: string): boolean {
    if (!this.requireAuth()) return false;
    if (!this.hasPermission(permission)) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
      return false;
    }
    return true;
  }

  public getAuthContext(): AuthMiddlewareContext {
    return {
      user: this.user,
      isAuthenticated: this.isAuthenticated(),
      isLoading: this.isLoading,
      hasPermission: (permission: string) => this.hasPermission(permission),
      hasRole: (role: string) => this.hasRole(role),
      logout: () => this.logout()
    };
  }

  public updateUser(user: AuthUser): void {
    this.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  public setLoading(loading: boolean): void {
    this.isLoading = loading;
  }
}

// React Hook for using AuthMiddleware
export function useAuth(): AuthMiddlewareContext {
  const auth = AuthMiddleware.getInstance();
  return auth.getAuthContext();
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAdmin?: boolean;
    requireSuperAdmin?: boolean;
    requiredPermissions?: string[];
  }
) {
  return function AuthenticatedComponent(props: P) {
    const auth = useAuth();
    const [isAuthorized, setIsAuthorized] = React.useState(false);

    React.useEffect(() => {
      const checkAuthorization = () => {
        if (!auth.isAuthenticated) {
          if (typeof window !== 'undefined') {
            window.location.href = '/signin';
          }
          return;
        }

        if (options?.requireAdmin && !auth.hasRole('ADMIN') && !auth.hasRole('SUPER_ADMIN')) {
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
          }
          return;
        }

        if (options?.requireSuperAdmin && !auth.hasRole('SUPER_ADMIN')) {
          if (typeof window !== 'undefined') {
            window.location.href = '/admin';
          }
          return;
        }

        if (options?.requiredPermissions) {
          const hasAllPermissions = options.requiredPermissions.every(permission => 
            auth.hasPermission(permission)
          );
          if (!hasAllPermissions) {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard';
            }
            return;
          }
        }

        setIsAuthorized(true);
      };

      checkAuthorization();
    }, [auth, options]);

    if (!isAuthorized) {
      return React.createElement('div', {
        className: 'min-h-screen bg-gray-50 flex items-center justify-center'
      }, [
        React.createElement('div', {
          key: 'loading',
          className: 'text-center'
        }, [
          React.createElement('div', {
            key: 'spinner',
            className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'
          }),
          React.createElement('p', {
            key: 'text',
            className: 'text-gray-600'
          }, 'Tekshirilmoqda...')
        ])
      ]);
    }

    return React.createElement(Component, props);
  };
}

// Permission constants
export const PERMISSIONS = {
  // User permissions
  PROFILE_VIEW: 'profile_view',
  PROFILE_EDIT: 'profile_edit',
  
  // AI permissions
  AI_CHAT: 'ai_chat',
  DOCUMENT_GENERATION: 'document_generation',
  IRAC_ANALYSIS: 'irac_analysis',
  
  // Admin permissions
  USER_MANAGEMENT: 'user_management',
  ANALYTICS_VIEW: 'analytics_view',
  ANALYTICS_EDIT: 'analytics_edit',
  PAYMENT_MANAGEMENT: 'payment_management',
  SYSTEM_SETTINGS: 'system_settings',
  DATABASE_ACCESS: 'database_access',
  USER_SUPPORT: 'user_support',
  CONTENT_MANAGEMENT: 'content_management',
  ADMIN_MANAGEMENT: 'admin_management'
} as const;

// Role constants
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
} as const;

// Default permissions by role
export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.DOCUMENT_GENERATION,
    PERMISSIONS.IRAC_ANALYSIS
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.PAYMENT_MANAGEMENT,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.USER_SUPPORT,
    PERMISSIONS.CONTENT_MANAGEMENT,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.DOCUMENT_GENERATION,
    PERMISSIONS.IRAC_ANALYSIS
  ],
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
} as const;
