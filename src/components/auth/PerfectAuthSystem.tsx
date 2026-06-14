'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  Crown,
  Key,
  Settings,
  BarChart
} from 'lucide-react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  subscription: 'free' | 'pro' | 'premium';
  createdAt: string;
  lastLogin: string;
  permissions: string[];
}

interface AuthCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'USER' | 'ADMIN';
  adminCode?: string;
  agreeToTerms: boolean;
}

export default function PerfectAuthSystem() {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin-login'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Login form state
  const [loginCredentials, setLoginCredentials] = useState<AuthCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });

  // Registration form state
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    adminCode: '',
    agreeToTerms: false
  });

  useEffect(() => {
    setIsClient(true);
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication logic
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === loginCredentials.email);

      if (!user) {
        setError('Foydalanuvchi topilmadi');
        return;
      }

      if (user.password !== loginCredentials.password) {
        setError('Noto\'g\'ri parol');
        return;
      }

      if (user.status === 'SUSPENDED') {
        setError('Hisobingiz bloklangan');
        return;
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      localStorage.setItem('users', JSON.stringify(users));

      // Set current user
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        subscription: user.subscription,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        permissions: getPermissions(user.role)
      };

      setCurrentUser(authUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(authUser));
      setSuccess('Muvaffaqiyatli login qilindi!');

      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1000);

    } catch (error) {
      setError('Login xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (registrationData.password !== registrationData.confirmPassword) {
        setError('Parollar mos kelmadi');
        return;
      }

      if (registrationData.password.length < 6) {
        setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
        return;
      }

      if (!registrationData.agreeToTerms) {
        setError('Shartnomalarni qabul qilishingiz kerak');
        return;
      }

      // Check admin code for admin registration
      if (registrationData.role === 'ADMIN') {
        if (registrationData.adminCode !== 'ADMIN123') {
          setError('Noto\'g\'ri admin kod');
          return;
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find((u: any) => u.email === registrationData.email)) {
        setError('Bu email allaqachon ro\'yxatdan o\'tgan');
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password,
        role: registrationData.role,
        status: 'ACTIVE',
        subscription: 'free',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      setSuccess('Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Endi login qiling.');
      setActiveTab('login');

    } catch (error) {
      setError('Ro\'yxatdan o\'tish xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setIsAuthenticated(false);
      window.location.href = '/signin';
    }
  };

  const getPermissions = (role: string): string[] => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          'user_management', 'analytics_view', 'analytics_edit', 
          'payment_management', 'system_settings', 'database_access',
          'user_support', 'content_management', 'admin_management'
        ];
      case 'ADMIN':
        return [
          'user_management', 'analytics_view', 'payment_management',
          'system_settings', 'user_support', 'content_management'
        ];
      case 'USER':
      default:
        return ['profile_view', 'profile_edit', 'ai_chat', 'document_generation'];
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Hisobga kirilgan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{currentUser.name}</div>
              <div className="text-gray-600">{currentUser.email}</div>
              <div className="flex justify-center space-x-2 mt-2">
                <Badge className={getRoleBadgeColor(currentUser.role)}>
                  {currentUser.role}
                </Badge>
                <Badge className={getStatusBadgeColor(currentUser.status)}>
                  {currentUser.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Ruxsatlar:</strong>
              </div>
              <div className="flex flex-wrap gap-1">
                {currentUser.permissions.map((permission, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {permission.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Tezkor harakatlar:</strong>
              </div>
              <div className="space-y-2">
                {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/admin'}
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={handleLogout}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Chiqish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">JurisAI</h1>
          <p className="text-gray-600">Huquqiy texnologiya platformasi</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'login' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'register' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Ro'yxatdan o'tish</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-login')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'admin-login' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={loginCredentials.email}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                      id="login-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Parolingiz"
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                      id="login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={loginCredentials.rememberMe}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-600">Eslab qolish</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                    Parolni unutdingizmi?
                  </a>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Kirilmoqda...' : 'Kirish'}
                </Button>
              </form>
            )}

            {/* Registration Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="To'liq ismingiz"
                      value={registrationData.name}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
                      required
                      id="register-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                      id="register-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Parol"
                      value={registrationData.password}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                      id="register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parolni tasdiqlash</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Parolni qayta kiriting"
                      value={registrationData.confirmPassword}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                      id="register-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hisob turi</label>
                  <select
                    value={registrationData.role}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">Oddiy foydalanuvchi</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {registrationData.role === 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin kod</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Admin kod"
                        value={registrationData.adminCode}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, adminCode: e.target.value }))}
                        className="pl-10"
                        id="register-admin-code"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Admin uchun maxsus kod</p>
                  </div>
                )}

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={registrationData.agreeToTerms}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    <a href="#" className="text-blue-600 hover:text-blue-800">Shartnomalar</a> ni qabul qilaman
                  </span>
                </label>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Ro\'yxatdan o\'tilmoqda...' : 'Ro\'yxatdan o\'tish'}
                </Button>
              </form>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin-login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center mb-4">
                  <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Admin Login</h3>
                  <p className="text-sm text-gray-600">Admin panelga kirish</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={loginCredentials.email}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                      id="admin-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Admin parol"
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                      id="admin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Faqat adminlar kirishi mumkin
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Kirilmoqda...' : 'Admin sifatida kirish'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
