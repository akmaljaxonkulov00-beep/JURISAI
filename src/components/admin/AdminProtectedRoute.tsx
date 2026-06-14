'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/authMiddleware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, AlertTriangle, Lock, Crown, Users, Settings } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export default function AdminProtectedRoute({ 
  children, 
  requireSuperAdmin = false, 
  requiredPermissions = [],
  fallback 
}: AdminProtectedRouteProps) {
  const { user, isAuthenticated, hasPermission, hasRole, logout } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      setIsLoading(true);

      // Check if user is authenticated
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      // Check if user has admin role
      if (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN')) {
        setIsLoading(false);
        return;
      }

      // Check if super admin is required
      if (requireSuperAdmin && !hasRole('SUPER_ADMIN')) {
        setIsLoading(false);
        return;
      }

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
        if (!hasAllPermissions) {
          setIsLoading(false);
          return;
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [isAuthenticated, hasRole, hasPermission, requireSuperAdmin, requiredPermissions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Admin tekshiruvi o'tkazilmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Ruxsat berilmadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <p className="text-gray-700 mb-2">
                Bu sahifaga kirish uchun admin ruxsatlari kerak.
              </p>
              <p className="text-sm text-gray-600">
                Sizning rolingiz: {user?.role || 'Noma\'lum'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Kerakli ruxsatlar:</strong>
              </div>
              <div className="flex flex-wrap gap-1">
                {requiredPermissions.length > 0 ? (
                  requiredPermissions.map((permission, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs ${
                        hasPermission(permission)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {permission.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    Admin role
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={logout}
                className="w-full"
                variant="destructive"
              >
                <Shield className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            </div>

            {user && (
              <div className="text-center text-sm text-gray-500">
                <p>Joriy foydalanuvchi: {user.name}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component for admin protection
export function withAdminProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireSuperAdmin?: boolean;
    requiredPermissions?: string[];
  }
) {
  return function AdminProtectedComponent(props: P) {
    return (
      <AdminProtectedRoute
        requireSuperAdmin={options?.requireSuperAdmin}
        requiredPermissions={options?.requiredPermissions}
      >
        <Component {...props} />
      </AdminProtectedRoute>
    );
  };
}

// Admin-specific protection components
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute requiredPermissions={['user_management']}>
      {children}
    </AdminProtectedRoute>
  );
}

export function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute requireSuperAdmin>
      {children}
    </AdminProtectedRoute>
  );
}

export function AnalyticsAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute requiredPermissions={['analytics_view']}>
      {children}
    </AdminProtectedRoute>
  );
}

export function PaymentAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute requiredPermissions={['payment_management']}>
      {children}
    </AdminProtectedRoute>
  );
}

export function SystemAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute requiredPermissions={['system_settings']}>
      {children}
    </AdminProtectedRoute>
  );
}
