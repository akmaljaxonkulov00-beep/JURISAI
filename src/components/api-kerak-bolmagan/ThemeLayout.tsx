'use client';

import React, { useState } from 'react';
import { Search, Bell, Globe, User, ArrowLeft, Home as HomeIcon, BookOpen, Award, Settings, Scale, GitBranch, Play, MessageCircle, GraduationCap, Target, Gavel, Users, BarChart3, CheckCircle, Trophy, Star, Database, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== HEADER COMPONENT ====================
interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUser?: boolean;
  showLanguage?: boolean;
  className?: string;
}

export function Header({ 
  title = 'JurisAI', 
  subtitle = 'Huquqiy ta\'lim platformasi',
  showSearch = true,
  showNotifications = true,
  showUser = true,
  showLanguage = true,
  className 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const mockNotifications = [
    { id: 1, text: 'Yangi topshiriq qo\'shildi', time: '5 daqiqa oldin', read: false },
    { id: 2, text: 'IRAC tahlili tugallandi', time: '1 soat oldin', read: false },
    { id: 3, text: 'Kurs yangilandi', time: '2 soat oldin', read: true }
  ];

  return (
    <header className={cn('bg-white px-8 py-4 border-b border-gray-100', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Filter
              </button>
            </form>
          )}
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            {showNotifications && (
              <div className="relative">
                <button 
                  className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800">Bildirishnomalar</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockNotifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={cn('p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer', 
                            !notification.read && 'bg-blue-50')}
                        >
                          <p className="text-sm text-gray-800">{notification.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Barchasini ko'rish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Language Selector */}
            {showLanguage && (
              <button className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5" />
                <span className="text-sm">UZ</span>
              </button>
            )}
            
            {/* User Profile */}
            {showUser && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ==================== SIDEBAR COMPONENT ====================
interface SidebarProps {
  currentPage?: string;
  showDailyGoal?: boolean;
  showStats?: boolean;
  className?: string;
}

export function Sidebar({ 
  currentPage = 'home', 
  showDailyGoal = true,
  showStats = true,
  className 
}: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Bosh sahifa', icon: <HomeIcon className="w-5 h-5" />, href: '/' },
    { id: 'case-solver', label: 'Case Solver', icon: <Scale className="w-5 h-5" />, href: '/case-solver' },
    { id: 'decision-tree', label: 'Decision Tree', icon: <GitBranch className="w-5 h-5" />, href: '/decision-tree' },
    { id: 'virtual-court', label: 'Virtual Sud', icon: <Gavel className="w-5 h-5" />, href: '/virtual-court' },
    { id: 'simulator', label: 'Simulyator', icon: <Play className="w-5 h-5" />, href: '/simulator' },
    { id: 'ai-assistant', label: 'AI Yordamchi', icon: <MessageCircle className="w-5 h-5" />, href: '/ai-assistant' },
    { id: 'my-courses', label: 'Mening kurslarim', icon: <GraduationCap className="w-5 h-5" />, href: '/my-courses' },
    { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" />, href: '/profile' },
    { id: 'professional-tools', label: 'Pro Vositalar', icon: <Star className="w-5 h-5" />, href: '/professional-tools' },
    { id: 'legal-database', label: 'Qonunlar bazasi', icon: <Database className="w-5 h-5" />, href: '/legal-database' },
    { id: 'community', label: 'Jamiyat', icon: <Users className="w-5 h-5" />, href: '/community' },
    { id: 'statistics', label: 'Statistika', icon: <BarChart3 className="w-5 h-5" />, href: '/statistics' },
    { id: 'tasks', label: 'Topshiriqlar', icon: <CheckCircle className="w-5 h-5" />, href: '/tasks' },
    { id: 'achievements', label: 'Yutuqlar', icon: <Trophy className="w-5 h-5" />, href: '/achievements' },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings className="w-5 h-5" />, href: '#' }
  ];

  const isActive = (id: string) => {
    return currentPage === id;
  };

  const dailyGoalProgress = 75; // Mock data
  const mockStats = {
    totalXP: 3450,
    currentLevel: 13,
    completedTasks: 12,
    totalTasks: 16,
    studyStreak: 5
  };

  return (
    <div className={cn('w-64 bg-white border-r border-gray-100 min-h-screen', className)}>
      <div className="p-6">
        {/* Daily Goal Block */}
        {showDailyGoal && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800">Kunlik maqsad</h3>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mb-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${dailyGoalProgress}%` }}></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">3/4 topshiriq bajarildi</p>
          </div>
        )}

        {/* Stats Block */}
        {showStats && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Statistika</h3>
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jami XP:</span>
                <span className="text-sm font-bold text-blue-600">{mockStats.totalXP.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Daraja:</span>
                <span className="text-sm font-bold text-green-600">{mockStats.currentLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Topshiriqlar:</span>
                <span className="text-sm font-bold text-orange-600">{mockStats.completedTasks}/{mockStats.totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Seriya:</span>
                <span className="text-sm font-bold text-purple-600">{mockStats.studyStreak} kun</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive(item.id)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ==================== LAYOUT COMPONENT ====================
interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  headerProps?: Partial<HeaderProps>;
  sidebarProps?: Partial<SidebarProps>;
  className?: string;
}

export function Layout({ 
  children, 
  currentPage = 'home',
  showHeader = true,
  showSidebar = true,
  headerProps = {},
  sidebarProps = {},
  className 
}: LayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {showHeader && <Header {...headerProps} />}
      
      <div className="flex">
        {showSidebar && <Sidebar currentPage={currentPage} {...sidebarProps} />}
        
        <main className={cn('flex-1', !showSidebar && 'max-w-full')}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ==================== THEME PROVIDER ====================
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ==================== THEME TOGGLE COMPONENT ====================
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      title={theme === 'light' ? 'Qorong\'u rejim' : 'Yorqin rejim'}
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}

// ==================== RESPONSIVE LAYOUT ====================
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  headerProps?: Partial<HeaderProps>;
  sidebarProps?: Partial<SidebarProps>;
  className?: string;
}

export function ResponsiveLayout({ 
  children, 
  currentPage = 'home',
  showHeader = true,
  showSidebar = true,
  headerProps = {},
  sidebarProps = {},
  className 
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <Sidebar currentPage={currentPage} {...sidebarProps} />
      </div>

      {/* Main Content */}
      <div className="lg:ml-0 flex-1">
        {showHeader && <Header {...headerProps} />}
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

// ==================== PAGE LAYOUT COMPONENTS ====================
interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export function PageLayout({ 
  children, 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions,
  className 
}: PageLayoutProps) {
  return (
    <div className={cn('p-8', className)}>
      {/* Page Header */}
      {(title || subtitle || breadcrumbs.length > 0 || actions) && (
        <div className="mb-8">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-gray-700">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-700">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Page Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
}

// ==================== DASHBOARD LAYOUT ====================
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ 
  children, 
  sidebar, 
  header, 
  className 
}: DashboardLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {header || <Header />}
      
      <div className="flex">
        {sidebar || <Sidebar />}
        
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// ==================== AUTH LAYOUT ====================
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showLogo = true,
  className 
}: AuthLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center', className)}>
      <div className="w-full max-w-md">
        {/* Logo */}
        {showLogo && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              J
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">JurisAI</h1>
            <p className="text-gray-600">Huquqiy ta\'lim platformasi</p>
          </div>
        )}

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {title && (
            <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-gray-600 mb-6">{subtitle}</p>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}

// ==================== ERROR BOUNDARY LAYOUT ====================
interface ErrorBoundaryLayoutProps {
  children: React.ReactNode;
  error?: Error;
  resetError?: () => void;
  className?: string;
}

export function ErrorBoundaryLayout({ 
  children, 
  error, 
  resetError, 
  className 
}: ErrorBoundaryLayoutProps) {
  if (error) {
    return (
      <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-bold text-gray-800 mb-2">Xatolik yuz berdi</h1>
          <p className="text-gray-600 mb-6">
            Kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta yuklang.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={resetError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Qayta yuklash
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Xatolik tafsilotlari</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ==================== LOADING LAYOUT ====================
interface LoadingLayoutProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export function LoadingLayout({ 
  message = 'Yuklanmoqda...', 
  showSpinner = true,
  className 
}: LoadingLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
      <div className="text-center">
        {showSpinner && (
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
            <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-600">Iltimos, biroz sabr qiling...</p>
      </div>
    </div>
  );
}


// Types
export type {
  HeaderProps,
  SidebarProps,
  LayoutProps,
  ResponsiveLayoutProps,
  PageLayoutProps,
  DashboardLayoutProps,
  AuthLayoutProps,
  ErrorBoundaryLayoutProps,
  LoadingLayoutProps,
  ThemeProviderProps,
  ThemeContextType,
};
