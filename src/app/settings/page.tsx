'use client';

import { useState } from 'react';
import { ArrowLeft, Moon, Sun, Monitor, Bell, Shield, CreditCard, Smartphone, Mail, Lock, CheckCircle, AlertTriangle, Globe, Type, User, Trash2, Plus, BookOpen, Settings as SettingsIcon } from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: 'uz' | 'en' | 'ru';
  notifications: {
    deadlines: boolean;
    courses: boolean;
    community: boolean;
    email: boolean;
    push: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    activeSessions: Session[];
  };
  subscription: {
    plan: 'free' | 'pro';
    billingCycle: 'monthly' | 'yearly';
    nextBilling: string;
    paymentMethod: PaymentMethod;
    billingHistory: BillingRecord[];
  };
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4: string;
  expiry: string;
  brand: string;
}

interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  invoice: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'security' | 'billing'>('appearance');
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'light',
    fontSize: 'medium',
    language: 'uz',
    notifications: {
      deadlines: true,
      courses: true,
      community: false,
      email: true,
      push: true
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '2024-01-15',
      activeSessions: [
        {
          id: '1',
          device: 'Windows PC',
          browser: 'Chrome',
          location: 'Toshkent, O\'zbekiston',
          lastActive: '2024-03-20 14:30',
          current: true
        },
        {
          id: '2',
          device: 'iPhone 14',
          browser: 'Safari',
          location: 'Toshkent, O\'zbekiston',
          lastActive: '2024-03-19 18:45',
          current: false
        }
      ]
    },
    subscription: {
      plan: 'pro',
      billingCycle: 'monthly',
      nextBilling: '2024-04-15',
      paymentMethod: {
        id: 'card_1',
        type: 'card',
        last4: '4242',
        expiry: '12/25',
        brand: 'Visa'
      },
      billingHistory: [
        {
          id: '1',
          date: '2024-03-15',
          amount: 29.99,
          description: 'Pro Plan - Monthly',
          status: 'completed',
          invoice: 'INV-2024-03-001'
        },
        {
          id: '2',
          date: '2024-02-15',
          amount: 29.99,
          description: 'Pro Plan - Monthly',
          status: 'completed',
          invoice: 'INV-2024-02-001'
        }
      ]
    }
  });

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const handleLanguageChange = (language: 'uz' | 'en' | 'ru') => {
    setSettings(prev => ({ ...prev, language }));
  };

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handle2FAToggle = () => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        twoFactorEnabled: !prev.security.twoFactorEnabled
      }
    }));
  };

  const handleSessionRemove = (sessionId: string) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        activeSessions: prev.security.activeSessions.filter(session => session.id !== sessionId)
      }
    }));
  };

  const handlePlanUpgrade = () => {
    setSettings(prev => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        plan: 'pro'
      }
    }));
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <Sun className="w-5 h-5" />;
      case 'dark': return <Moon className="w-5 h-5" />;
      case 'system': return <Monitor className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <SettingsIcon className="w-5 h-5" />
                <span className="font-medium">Sozlamalar</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white px-8 py-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">Sozlamalar</h1>
            <p className="text-sm text-gray-600">Platformani o'zingizga moslashtiring</p>
          </header>

          {/* Tabs */}
          <div className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('appearance')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Interfeys
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Bildirishnomalar
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'security'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Xavfsizlik
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'billing'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Obuna
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <main className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Theme Settings */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Mavzu</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {(['light', 'dark', 'system'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => handleThemeChange(theme)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.theme === theme
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {getThemeIcon(theme)}
                            <span className="font-medium">
                              {theme === 'light' ? 'Yorug\'' : theme === 'dark' ? 'To\'q' : 'Tizim'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Shrift hajmi</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => handleFontSizeChange(size)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.fontSize === size
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Type className="w-5 h-5" />
                            <span className="font-medium">
                              {size === 'small' ? 'Kichik' : size === 'medium' ? 'O\'rta' : 'Katta'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Til</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {(['uz', 'en', 'ru'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.language === lang
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Globe className="w-5 h-5" />
                            <span className="font-medium">
                              {lang === 'uz' ? 'O\'zbekcha' : lang === 'en' ? 'Inglizcha' : 'Ruscha'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Bildirishnomalar sozlamalari</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">Topshiriqlar muddati</p>
                            <p className="text-sm text-gray-600">Deadline yaqinlashganda eslatma</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('deadlines')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.deadlines ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.deadlines ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">Yangi kurslar</p>
                            <p className="text-sm text-gray-600">Katalogga yangi dars qo\'shilganda</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('courses')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.courses ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.courses ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">Jamiyat faolligi</p>
                            <p className="text-sm text-gray-600">Forum faolligi haqida bildirish</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('community')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.community ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.community ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">Email bildirishnomalari</p>
                            <p className="text-sm text-gray-600">Email orqali xabarlar</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('email')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">Push bildirishnomalar</p>
                            <p className="text-sm text-gray-600">Mobil ilova orqali bildirish</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('push')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Parol xavfsizligi</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">Oxirgi parol o\'zgarishi</p>
                            <p className="text-sm text-gray-600">{settings.security.lastPasswordChange}</p>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Parolni o\'zgartirish
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Ikki bosqichli autentifikatsiya (2FA)</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">2FA holati</p>
                            <p className="text-sm text-gray-600">
                              {settings.security.twoFactorEnabled 
                                ? 'Ikki bosqichli autentifikatsiya yoqilgan' 
                                : 'Ikki bosqichli autentifikatsiya o\'chirilgan'}
                            </p>
                          </div>
                          <button
                            onClick={handle2FAToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.security.twoFactorEnabled ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      
                      {settings.security.twoFactorEnabled && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Akkauntingiz qo\'shimcha himoyalangan</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Faol sessiyalar</h2>
                    <div className="space-y-3">
                      {settings.security.activeSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Smartphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{session.device}</p>
                              <p className="text-sm text-gray-600">{session.browser} • {session.location}</p>
                              <p className="text-xs text-gray-500">Oxirgi faollik: {session.lastActive}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.current && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                Joriy
                              </span>
                            )}
                            {!session.current && (
                              <button
                                onClick={() => handleSessionRemove(session.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Joriy reja</h2>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-800 capitalize">
                            {settings.subscription.plan} Plan
                          </p>
                          <p className="text-sm text-gray-600">
                            {settings.subscription.billingCycle === 'monthly' ? 'Oylik' : 'Yillik'} to\'lov
                          </p>
                          <p className="text-sm text-gray-600">
                            Keyinggi to\'lov: {settings.subscription.nextBilling}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600">
                            ${settings.subscription.plan === 'pro' ? '29.99' : '0.00'}
                          </p>
                          <p className="text-sm text-gray-600">/oy</p>
                        </div>
                      </div>
                    </div>
                    
                    {settings.subscription.plan === 'free' && (
                      <button
                        onClick={handlePlanUpgrade}
                        className="w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Pro rejasiga o'tish
                      </button>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">To\'lov usuli</h2>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {settings.subscription.paymentMethod.brand} ••••• {settings.subscription.paymentMethod.last4}
                            </p>
                            <p className="text-sm text-gray-600">
                              Amal qilish muddati: {settings.subscription.paymentMethod.expiry}
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                          O\'zgartirish
                        </button>
                      </div>
                    </div>
                    
                    <button className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        <span>Yangi to\'lov usuli qo'shish</span>
                      </div>
                    </button>
                  </div>

                  {/* Billing History */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">To\'lov tarixi</h2>
                    <div className="space-y-3">
                      {settings.subscription.billingHistory.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{record.description}</p>
                            <p className="text-sm text-gray-600">{record.date}</p>
                            <p className="text-xs text-gray-500">Invoice: {record.invoice}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">${record.amount}</p>
                            <p className={`text-sm ${getStatusColor(record.status)}`}>
                              {record.status === 'completed' ? 'To\'landi' : 
                               record.status === 'pending' ? 'Kutilmoqda' : 'Xatolik'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
