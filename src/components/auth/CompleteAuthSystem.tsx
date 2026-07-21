'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Mail, 
  Lock, 
  User, 
  Shield, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Home, 
  Settings, 
  LogOut, 
  RefreshCw,
  Key,
  Crown,
  BarChart,
  Clock,
  Activity,
  Users,
  Database,
  FileText,
  CreditCard,
  Bell,
  Search,
  Menu,
  X,
  Download,
  Upload,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Save,
  Plus,
  Minus,
  Check,
  Info,
  HelpCircle,
  CreditCard as CreditCardIcon
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
  profile?: {
    avatar?: string;
    phone?: string;
    address?: string;
    bio?: string;
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  statistics?: {
    loginCount: number;
    lastActivity: string;
    totalSessions: number;
    averageSessionDuration: number;
    documentsCreated: number;
    aiRequests: number;
    paymentsProcessed: number;
  };
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    security: boolean;
  };
  preferences?: {
    theme: 'light' | 'dark';
    language: 'uz' | 'en' | 'ru';
    timezone: string;
    dateFormat: string;
    currency: string;
  };
}

interface AuthCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
  twoFactorCode: string;
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  adminCode?: string;
}

interface PasswordResetData {
  email: string;
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface SessionData {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

export default function CompleteAuthSystem() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin-login' | 'forgot-password' | 'two-factor'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([]);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Login form state
  const [loginCredentials, setLoginCredentials] = useState<AuthCredentials>({
    email: '',
    password: '',
    rememberMe: false,
    twoFactorCode: ''
  });

  // Registration form state
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    adminCode: ''
  });

  // Password reset form state
  const [passwordResetData, setPasswordResetData] = useState<PasswordResetData>({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setIsClient(true);
    checkAuthStatus();
    initializeDefaultUsers();
  }, []);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  
  const initializeDefaultUsers = () => {
    if (typeof window !== 'undefined') {
      // Always clear and recreate users to fix the issue
      localStorage.removeItem('users');
      
      const defaultUsers = [
        {
          id: '1',
          name: 'Super Admin',
          email: 'admin@jurisai.com',
          password: 'admin123',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          subscription: 'premium',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          profile: {
            avatar: '',
            phone: '+998901234567',
            address: 'Toshkent, Uzbekistan',
            bio: 'System Administrator',
            website: 'https://jurisai.com',
            social: {
              twitter: '@jurisai',
              linkedin: 'jurisai',
              github: 'jurisai'
            }
          },
          statistics: {
            loginCount: 0,
            lastActivity: new Date().toISOString(),
            totalSessions: 0,
            averageSessionDuration: 0,
            documentsCreated: 0,
            aiRequests: 0,
            paymentsProcessed: 0
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
            marketing: false,
            security: true
          },
          preferences: {
            theme: 'light',
            language: 'uz',
            timezone: 'Asia/Tashkent',
            dateFormat: 'DD/MM/YYYY',
            currency: 'UZS'
          }
        },
        {
          id: '2',
          name: 'Admin User',
          email: 'admin2@jurisai.com',
          password: 'admin123',
          role: 'ADMIN',
          status: 'ACTIVE',
          subscription: 'pro',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          profile: {
            avatar: '',
            phone: '+998901234568',
            address: 'Toshkent, Uzbekistan',
            bio: 'Administrator',
            website: '',
            social: {}
          },
          statistics: {
            loginCount: 0,
            lastActivity: new Date().toISOString(),
            totalSessions: 0,
            averageSessionDuration: 0,
            documentsCreated: 0,
            aiRequests: 0,
            paymentsProcessed: 0
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
            marketing: false,
            security: true
          },
          preferences: {
            theme: 'light',
            language: 'uz',
            timezone: 'Asia/Tashkent',
            dateFormat: 'DD/MM/YYYY',
            currency: 'UZS'
          }
        },
        {
          id: '3',
          name: 'Test User',
          email: 'user@jurisai.com',
          password: 'user123',
          role: 'USER',
          status: 'ACTIVE',
          subscription: 'free',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          profile: {
            avatar: '',
            phone: '+998901234569',
            address: 'Toshkent, Uzbekistan',
            bio: 'Regular User',
            website: '',
            social: {}
          },
          statistics: {
            loginCount: 0,
            lastActivity: new Date().toISOString(),
            totalSessions: 0,
            averageSessionDuration: 0,
            documentsCreated: 0,
            aiRequests: 0,
            paymentsProcessed: 0
          },
          notifications: {
            email: true,
            push: false,
            sms: false,
            marketing: false,
            security: true
          },
          preferences: {
            theme: 'light',
            language: 'uz',
            timezone: 'Asia/Tashkent',
            dateFormat: 'DD/MM/YYYY',
            currency: 'UZS'
          }
        }
      ];

      localStorage.setItem('users', JSON.stringify(defaultUsers));
      console.log('Default users initialized:', defaultUsers.map(u => u.email));
    }
  };

  const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
          setActiveSessions(JSON.parse(localStorage.getItem('activeSessions') || '[]'));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  };

  const loadActiveSessions = () => {
    if (typeof window !== 'undefined') {
      const sessions = JSON.parse(localStorage.getItem('activeSessions') || '[]');
      setActiveSessions(sessions);
    }
  };

  const updateUserActivity = (userId: string) => {
    if (typeof window !== 'undefined') {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex !== -1) {
        if (!users[userIndex].statistics) {
          users[userIndex].statistics = {
            loginCount: 0,
            lastActivity: new Date().toISOString(),
            totalSessions: 0,
            averageSessionDuration: 0,
            documentsCreated: 0,
            aiRequests: 0,
            paymentsProcessed: 0
          };
        }
        users[userIndex].statistics.lastActivity = new Date().toISOString();
        users[userIndex].statistics.totalSessions += 1;
        localStorage.setItem('users', JSON.stringify(users));
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

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      console.log('Available users:', users);
      console.log('Trying to login with:', loginCredentials.email);

      const user = users.find((u: any) => u.email === loginCredentials.email);

      if (!user) {
        setError(`Foydalanuvchi topilmadi: ${loginCredentials.email}`);
        console.log('User not found. Available emails:', users.map((u: any) => u.email));
        incrementLoginAttempts();
        return;
      }

      if (user.password !== loginCredentials.password) {
        setError('Noto\'g\'ri parol');
        incrementLoginAttempts();
        return;
      }

      if (user.status === 'SUSPENDED') {
        setError('Hisobingiz bloklangan');
        return;
      }

      if (user.status === 'INACTIVE') {
        setError('Hisobingiz faol emas. Admin bilan bog\'laning.');
        return;
      }

      // Update user statistics
      user.lastLogin = new Date().toISOString();
      if (!user.statistics) {
        user.statistics = {
          loginCount: 0,
          lastActivity: new Date().toISOString(),
          totalSessions: 0,
          averageSessionDuration: 0,
          documentsCreated: 0,
          aiRequests: 0,
          paymentsProcessed: 0
        };
      }
      user.statistics.loginCount += 1;
      user.statistics.lastActivity = new Date().toISOString();
      
      localStorage.setItem('users', JSON.stringify(users));

      // Create new session
      const newSession: SessionData = {
        id: Date.now().toString(),
        device: navigator.userAgent,
        browser: getBrowserName(),
        location: 'Toshkent, Uzbekistan',
        ipAddress: '192.168.1.1',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isActive: true
      };

      const sessions = JSON.parse(localStorage.getItem('activeSessions') || '[]');
      sessions.push(newSession);
      localStorage.setItem('activeSessions', JSON.stringify(sessions));

      // Set current user
      const authUser: AuthUser = {
        ...user,
        permissions: getPermissions(user.role)
      };

      setCurrentUser(authUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(authUser));
      setSuccess('Muvaffaqiyatli login qilindi!');

      // Reset login attempts
      setLoginAttempts(0);

      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 1000);

    } catch (error) {
      setError('Login xatolik yuz berdi');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementLoginAttempts = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setError('Juda ko\'p urinishlar. Qayta urinib ko\'ring.');
      setLoginAttempts(0); // Reset attempts after 3 tries
    }
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  };

  const getPermissions = (role: string): string[] => {
    switch (role) {
      case 'SUPER_ADMIN':
        return ['all'];
      case 'ADMIN':
        return ['manage_users', 'view_analytics', 'manage_content'];
      case 'USER':
        return ['view_content', 'create_documents'];
      default:
        return [];
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use real Supabase authentication
      const { useAuth } = await import('@/services/auth-real');
      const authHook = useAuth();
      
      const success = await authHook.login(loginCredentials.email, loginCredentials.password);
      
      if (!success) {
        setError('Login xatolik yuz berdi');
        return;
      }

      // Get auth state after login
      if (authHook.isAuthenticated && authHook.user) {
        setSuccess('Muvaffaqiyatli login qilindi!');
        
        // Redirect based on role
        setTimeout(() => {
          if (authHook.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }, 1000);
      }

    } catch (error) {
      setError('Ro\'yxatdan o\'tish xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === passwordResetData.email);

      if (!user) {
        setError('Bu email bilan foydalanuvchi topilmadi');
        return;
      }

      // Generate reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('resetCode', resetCode);
      localStorage.setItem('resetEmail', passwordResetData.email);

      setSuccess(`Tasdiqlash kodi yuborildi: ${resetCode}`);
      setPasswordResetData(prev => ({ ...prev, code: '' }));

    } catch (error) {
      setError('Parolni tiklash xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const storedCode = localStorage.getItem('resetCode');
      const storedEmail = localStorage.getItem('resetEmail');

      if (!storedCode || storedCode !== passwordResetData.code) {
        setError('Noto\'g\'ri tasdiqlash kodi');
        return;
      }

      if ((passwordResetData.newPassword || '') !== (passwordResetData.confirmPassword || '')) {
        setError('Yangi parollar mos kelmadi');
        return;
      }

      if ((passwordResetData.newPassword || '').length < 8) {
        setError('Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak');
        return;
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === storedEmail);

      if (userIndex === -1) {
        setError('Foydalanuvchi topilmadi');
        return;
      }

      users[userIndex].password = passwordResetData.newPassword || '';
      localStorage.setItem('users', JSON.stringify(users));

      localStorage.removeItem('resetCode');
      localStorage.removeItem('resetEmail');

      setSuccess('Parol muvaffaqiyatli o\'zgartirildi!');
      setActiveTab('login');

    } catch (error) {
      setError('Parolni o\'zgartirish xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('login');
    window.location.href = '/signin';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ');
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Xush kelibsiz, {currentUser.name}!</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.href = '/pricing'} 
                  variant="outline"
                  className="flex items-center"
                >
                  <CreditCardIcon className="w-4 h-4 mr-2" />
                  Tariflar
                </Button>
                <Button onClick={handleLogout} variant="outline">
                  <LogOut className="w-4 h-4 mr-2" />
                  Chiqish
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusBadgeColor(currentUser.status)}>
                        {currentUser.status}
                      </Badge>
                    </div>
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <Badge className="bg-purple-100 text-purple-800">
                        {currentUser.role}
                      </Badge>
                    </div>
                    <Crown className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Subscription</p>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {currentUser.subscription}
                      </Badge>
                    </div>
                    <CreditCard className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="w-5 h-5 mr-2" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Login Count</span>
                      <span className="font-semibold">{currentUser.statistics?.loginCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Sessions</span>
                      <span className="font-semibold">{currentUser.statistics?.totalSessions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity</span>
                      <span className="font-semibold">{formatDateTime(currentUser.statistics?.lastActivity || '')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSessions.slice(-3).reverse().map((session) => (
                      <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{session.browser}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(session.loginTime)}</p>
                        </div>
                        <Badge className={session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {session.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">JurisAI</CardTitle>
            <p className="text-gray-600">Huquqiy AI Platformasi</p>
          </CardHeader>

          <CardContent>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kirish
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ro'yxatdan o'tish
              </button>
              <button
                onClick={() => setActiveTab('admin-login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'admin-login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-600" />
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
                      placeholder="Email (masalan: admin@jurisai.com)"
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
                      placeholder="Parol"
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
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot-password')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                                      >
                    Parolni unutdingizmi?
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Options
                  </Button>
                </div>

                {showAdvancedOptions && (
                  <div className="p-3 bg-gray-50 rounded-md space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">2FA Kod (ixtiyoriy)</label>
                      <Input
                        type="text"
                        placeholder="6 xonali kod"
                        value={loginCredentials.twoFactorCode}
                        onChange={(e) => setLoginCredentials(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                        maxLength={6}
                                              />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Kirilmoqda...' : 'Kirish'}
                </Button>

                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600 mb-2">Yoki advokat sifatida:</div>
                  <div className="flex space-x-2">
                    <a
                      href="/lawyer-login"
                      className="flex-1 text-sm bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      Advokat kirish
                    </a>
                    <a
                      href="/demo-lawyer"
                      className="flex-1 text-sm bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center"
                    >
                      Demo advokat
                    </a>
                  </div>
                </div>
              </form>
            )}

            {/* Registration Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center mb-4">
                  <User className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Ro'yxatdan o'tish</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                    <Input
                      type="text"
                      placeholder="Ism"
                      value={registrationData.firstName}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                    <Input
                      type="text"
                      placeholder="Familiya"
                      value={registrationData.lastName}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
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
                      placeholder="Parolni tasdiqlash"
                      value={registrationData.confirmPassword}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 pr-10"
                      required
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={registrationData.agreeToTerms}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    <a href="#" className="text-blue-600 hover:text-blue-800">Foydalanish shartlari</a> bilan roziman
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Ro\'yxatdan o\'tilmoqda...' : 'Ro\'yxatdan o\'tish'}
                </Button>
              </form>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin-login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center mb-4">
                  <Shield className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Admin Kirish</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="Admin email"
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

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm text-blue-800">
                    <strong>Test foydalanuvchilar:</strong><br/>
                    DOT Super Admin: admin@jurisai.com / admin123<br/>
                    DOT Admin: admin2@jurisai.com / admin123<br/>
                    DOT User: user@jurisai.com / user123
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Kirilmoqda...' : 'Admin sifatida kirish'}
                </Button>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'forgot-password' && (
              <form onSubmit={passwordResetData.code ? handlePasswordResetConfirm : handlePasswordReset} className="space-y-4">
                <div className="text-center mb-4">
                  <Key className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Parolni Tiklash</h3>
                </div>

                {!passwordResetData.code ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={passwordResetData.email}
                          onChange={(e) => setPasswordResetData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Yuborilmoqda...' : 'Kod yuborish'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tasdiqlash kodi</label>
                      <Input
                        type="text"
                        placeholder="6 xonali kod"
                        value={passwordResetData.code}
                        onChange={(e) => setPasswordResetData(prev => ({ ...prev, code: e.target.value }))}
                        maxLength={6}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Yangi parol"
                          value={passwordResetData.newPassword || ''}
                          onChange={(e) => setPasswordResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="pl-10 pr-10"
                          required
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parolni tasdiqlash</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Yangi parolni tasdiqlash"
                          value={passwordResetData.confirmPassword || ''}
                          onChange={(e) => setPasswordResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-10 pr-10"
                          required
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

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Saqlanmoqda...' : 'Parolni o\'zgartirish'}
                    </Button>
                  </>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Login ga qaytish
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
