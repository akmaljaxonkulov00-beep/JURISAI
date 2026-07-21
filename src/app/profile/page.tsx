'use client';

import { useState } from 'react';
import {
  ArrowLeft, User, Mail, Phone, Lock, Globe, Edit3, Award, BookOpen,
  TrendingUp, Star, Camera, CheckCircle, Crown, Settings, Target,
  HelpCircle, MessageCircle, ChevronRight, Bell, Moon, Sun, Shield,
  Smartphone, Monitor, Download, Trash2, CreditCard, History,
  Search, X, Eye, EyeOff, Key, LogOut, Database, AlertTriangle
} from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'Talaba' | 'Magistrant' | 'Amaliyotchi yurist' | 'Professional yurist';
  specialization: string;
  avatar: string;
  subscription: 'Free' | 'Pro';
  subscriptionEnd?: string;
  language: 'uz' | 'en' | 'ru';
  xp: number;
  coursesCount: number;
  rating: number;
  certificates: number;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  caseReminders: boolean;
  weeklyReport: boolean;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'help' | 'premium'>('overview');
  const [settingsSubTab, setSettingsSubTab] = useState<'personal' | 'notifications' | 'appearance' | 'security' | 'data'>('personal');
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Try to load from localStorage auth
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        return {
          id: user.id || '0',
          firstName: user.name?.split(' ')[0] || user.firstName || 'Foydalanuvchi',
          lastName: user.name?.split(' ').slice(1).join(' ') || user.lastName || '',
          email: user.email || '',
          phone: user.phone || '+998 __ ___ __ __',
          status: 'Talaba',
          specialization: user.specialization || '',
          avatar: 'user',
          subscription: user.subscription_plan === 'pro' ? 'Pro' : 'Free',
          language: 'uz',
          xp: user.xp || 0,
          coursesCount: user.coursesCount || 0,
          rating: user.rating || 0,
          certificates: user.certificates || 0
        };
      } catch {}
    }
    return {
      id: '0',
      firstName: 'Foydalanuvchi',
      lastName: '',
      email: '',
      phone: '+998 __ ___ __ __',
      status: 'Talaba',
      specialization: '',
      avatar: 'user',
      subscription: 'Free',
      language: 'uz',
      xp: 0,
      coursesCount: 0,
      rating: 0,
      certificates: 0
    };
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    caseReminders: true,
    weeklyReport: true
  });
  const [darkMode, setDarkMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('profile_image');
    return null;
  });

  const handleSave = () => {
    const userData = {
      id: editedProfile.id,
      email: editedProfile.email,
      name: editedProfile.firstName + ' ' + editedProfile.lastName,
      firstName: editedProfile.firstName,
      lastName: editedProfile.lastName,
      phone: editedProfile.phone,
      status: editedProfile.status,
      specialization: editedProfile.specialization,
      language: editedProfile.language,
      subscription_plan: editedProfile.subscription.toLowerCase(),
      role: 'USER'
    };
    setProfile(editedProfile);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('jurisai_user', JSON.stringify(userData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setProfileImage(dataUrl);
        localStorage.setItem('profile_image', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPass !== passwordData.confirm) {
      alert('Yangi parollar mos kelmadi!');
      return;
    }
    if (passwordData.newPass.length < 6) {
      alert('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
      return;
    }
    alert('Parol muvaffaqiyatli o\'zgartirildi!');
    setShowPasswordForm(false);
    setPasswordData({ current: '', newPass: '', confirm: '' });
  };

  const handleExportData = () => {
    const data = {
      profile,
      exportDate: new Date().toISOString(),
      platform: 'JurisAI'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jurisai-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Ma\'lumotlar muvaffaqiyatli eksport qilindi!');
  };

  const handleDeleteAccount = () => {
    if (confirm('Hisobingizni o\'chirishni xohlaysizmi? Bu amalni qaytarib bo\'lmaydi!')) {
      if (confirm('Haqiqatan ham hisobingizni o\'chirishni xohlaysizmi?')) {
        alert('Hisob o\'chirildi. Xayr!');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Talaba': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Magistrant': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Amaliyotchi yurist': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Professional yurist': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSubscriptionColor = (subscription: string) => {
    return subscription === 'Pro' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  // ── Help faqs ──
  const faqs = [
    { q: 'Hisobimni qanday ro\'yxatdan o\'tkazish mumkin?', a: 'Bosh sahifada "Ro\'yxatdan o\'tish" tugmasini bosing va elektron pochtangizni kiriting.' },
    { q: 'Premium rejasining afzalliklari nimalar?', a: 'Cheksiz AI so\'rovlari, shaxsiy maslahatchi, tezkor support va boshqa imkoniyatlar.' },
    { q: 'Parolni unutsam qanday tiklash mumkin?', a: 'Kirish sahifasida "Parolni unutdingizmi?" linkiga bosing va pochtangizni kiriting.' },
    { q: 'IRAC tahlili qanday ishlaydi?', a: 'Case matnini kiriting, AI tizimi Issue, Rule, Application, Conclusion bo\'limlarini ajratib tahlil qiladi.' },
    { q: 'To\'lovni qaytarish mumkinmi?', a: 'Ha, 14 kun ichida to\'lovni qaytarish talabini berishingiz mumkin.' },
    { q: 'Qanday qilib Pro rejasiga o\'tish mumkin?', a: 'Premium sahifasida o\'zingizga mos rejani tanlang va to\'lovni amalga oshiring.' },
    { q: 'Ma\'lumotlarim xavfsizmi?', a: 'Barcha ma\'lumotlariz shifrlangan holda saqlanadi va uchunchi shaxslarga berilmaydi.' },
  ];

  const premiumPlans = [
    { name: 'Free', price: '0', features: ['3 ta AI so\'rovi/kun', 'Asosiy qonunlar bazasi', 'Oddiy IRAC tahlili'], popular: false },
    { name: 'Pro', price: '45,000 UZS', features: ['Cheksiz AI so\'rovi', 'To\'liq qonunlar bazasi', 'Premium IRAC tahlili', 'Shaxsiy maslahatchi', 'Hujjat generatsiyasi'], popular: true },
    { name: 'Premium', price: '140,000 UZS', features: ['Barcha Pro imkoniyatlari', 'Cheksiz AI so\'rovlari', 'API kirish', '24/7 support', 'SLA kafolati'], popular: false },
  ];

  const billingHistory = [
    { date: '2024-12-01', amount: '45,000 UZS', plan: 'Pro', status: 'To\'langan' },
    { date: '2024-11-01', amount: '45,000 UZS', plan: 'Pro', status: 'To\'langan' },
    { date: '2024-10-01', amount: '0 UZS', plan: 'Free', status: 'Bepul' },
  ];

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'uz': return 'O\'zbekcha';
      case 'en': return 'Inglizcha';
      case 'ru': return 'Ruscha';
      default: return lang;
    }
  };

  // ── RENDER SETTINGS ──
  const renderSettings = () => (
    <div className="flex">
      {/* Settings Sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="glass rounded-2xl p-3 space-y-1">
          {[
            { id: 'personal', label: 'Shaxsiy ma\'lumotlar', icon: User },
            { id: 'notifications', label: 'Bildirishnomalar', icon: Bell },
            { id: 'appearance', label: 'Ko\'rinish', icon: Monitor },
            { id: 'security', label: 'Xavfsizlik', icon: Shield },
            { id: 'data', label: 'Ma\'lumotlar', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = settingsSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSettingsSubTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'nav-item-active'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 ml-6">
        {settingsSaved && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            Sozlamalar muvaffaqiyatli saqlandi!
          </div>
        )}

        {/* Personal Info */}
        {settingsSubTab === 'personal' && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Shaxsiy ma'lumotlar</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Ism</label>
                <input type="text" value={editedProfile.firstName}
                  onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Familiya</label>
                <input type="text" value={editedProfile.lastName}
                  onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Elektron pochta</label>
                <input type="email" value={editedProfile.email}
                  onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Telefon raqami</label>
                <input type="tel" value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Maqomi</label>
                <select value={editedProfile.status}
                  onChange={(e) => setEditedProfile({...editedProfile, status: e.target.value as any})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                  <option value="Talaba">Talaba</option>
                  <option value="Magistrant">Magistrant</option>
                  <option value="Amaliyotchi yurist">Amaliyotchi yurist</option>
                  <option value="Professional yurist">Professional yurist</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Mutaxassislik</label>
                <input type="text" value={editedProfile.specialization}
                  onChange={(e) => setEditedProfile({...editedProfile, specialization: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                Saqlash
              </button>
              <button onClick={handleCancel}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {settingsSubTab === 'notifications' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Bildirishnoma sozlamalari
              </h2>
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email bildirishnomalar', desc: 'Muhim yangiliklar va yangilanishlar haqida email orqali xabar olish' },
                  { id: 'push', label: 'Push bildirishnomalar', desc: 'Brauzer orqali real-vaqt rejimida bildirishnomalar olish' },
                  { id: 'sms', label: 'SMS bildirishnomalar', desc: 'Telefon raqamingizga SMS xabarlar olish' },
                  { id: 'caseReminders', label: 'Ish eslatmalari', desc: 'Yangi ishlar va topshiriqlar haqida eslatma olish' },
                  { id: 'weeklyReport', label: 'Haftalik hisobot', desc: 'Har hafta faoliyatingiz haqida hisobot olish' },
                  { id: 'marketing', label: 'Marketing xatlari', desc: 'Maxsus takliflar va aksiyalar haqida xabar olish' },
                ].map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={notifSettings[item.id as keyof NotificationSettings]}
                        onChange={(e) => setNotifSettings({...notifSettings, [item.id]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-4"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Sozlamalarni saqlash
            </button>
          </div>
        )}

        {/* Appearance */}
        {settingsSubTab === 'appearance' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-600" />
                Ko'rinish sozlamalari
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Mavzu</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setDarkMode(false); document.documentElement.classList.remove('dark'); }}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        !darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="w-5 h-5 text-orange-500" />
                      <span className="font-medium text-gray-800 dark:text-white">Yorug'</span>
                    </button>
                    <button
                      onClick={() => { setDarkMode(true); document.documentElement.classList.add('dark'); }}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="w-5 h-5 text-indigo-500" />
                      <span className="font-medium text-gray-800 dark:text-white">Qorong'i</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Til</label>
                  <select value={editedProfile.language}
                    onChange={(e) => setEditedProfile({...editedProfile, language: e.target.value as any})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                    <option value="uz">O'zbekcha</option>
                    <option value="en">Inglizcha</option>
                    <option value="ru">Ruscha</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Shrift hajmi</label>
                  <select defaultValue="O'rtacha" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                    <option>Kichik</option>
                    <option>O'rtacha</option>
                    <option>Katta</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Sozlamalarni saqlash
            </button>
          </div>
        )}

        {/* Security */}
        {settingsSubTab === 'security' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Xavfsizlik sozlamalari
              </h2>
              
              {/* Password */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Parol</p>
                      <p className="text-xs text-gray-500">Oxirgi o'zgarish: 3 oy oldin</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium">
                    O'zgartirish
                  </button>
                </div>
                {showPasswordForm && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="relative">
                      <input type={showCurrentPass ? 'text' : 'password'} placeholder="Joriy parol"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                      <button onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showNewPass ? 'text' : 'password'} placeholder="Yangi parol"
                        value={passwordData.newPass}
                        onChange={(e) => setPasswordData({...passwordData, newPass: e.target.value})}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                      <button onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input type="password" placeholder="Yangi parolni takrorlang"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    <button onClick={handleChangePassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                      Parolni yangilash
                    </button>
                  </div>
                )}
              </div>

              {/* 2FA */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Ikki faktorli autentifikatsiya</p>
                    <p className="text-xs text-gray-500">Hisobingizni qo'shimcha himoya qilish</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                  Yoqish
                </button>
              </div>

              {/* Active Sessions */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <p className="font-medium text-gray-800 dark:text-white">Faol seanslar</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">iPhone 15 - Safari</p>
                        <p className="text-xs text-gray-500">Toshkent, O'zbekiston • Hozir faol</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Faol</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Windows 11 - Chrome</p>
                        <p className="text-xs text-gray-500">Toshkent, O'zbekiston • 2 soat oldin</p>
                      </div>
                    </div>
                    <button className="text-xs text-red-600 hover:text-red-700 font-medium">Chiqish</button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Sozlamalarni saqlash
            </button>
          </div>
        )}

        {/* Data */}
        {settingsSubTab === 'data' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-600" />
                Ma'lumotlar boshqaruvi
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Ma'lumotlarni eksport qilish</p>
                      <p className="text-xs text-gray-500">Barcha ma'lumotlaringizni JSON formatida yuklab olish</p>
                    </div>
                  </div>
                  <button onClick={handleExportData}
                    className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium">
                    Eksport
                  </button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Hisobni o'chirish</p>
                      <p className="text-xs text-gray-500">Hisobingizni butunlay o'chirish va barcha ma'lumotlarni tozalash</p>
                    </div>
                  </div>
                  <button onClick={handleDeleteAccount}
                    className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium border border-red-200 dark:border-red-800">
                    O'chirish
                  </button>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">Diqqat!</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Hisobni o'chirish amalini qaytarib bo'lmaydi. Barcha ma'lumotlaringiz, yutuqlaringiz va obunalaringiz butunlay yo'qoladi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── RENDER HELP ──
  const renderHelp = () => (
    <div className="flex">
      <div className="w-56 flex-shrink-0">
        <div className="glass rounded-2xl p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-item-active">
            <HelpCircle className="w-4 h-4" />
            <span className="font-medium text-sm">Yordam</span>
          </div>
        </div>
      </div>
      <div className="flex-1 ml-6 space-y-4">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Yordam markazi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Eng ko'p beriladigan savollar</p>
          
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Savollarni qidirish..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{faq.q}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Yana savolingiz bormi?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">support@jurisai.uz yoki +998 71 200 00 00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── RENDER PREMIUM ──
  const renderPremium = () => (
    <div className="flex">
      <div className="w-56 flex-shrink-0">
        <div className="glass rounded-2xl p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-item-active">
            <Crown className="w-4 h-4" />
            <span className="font-medium text-sm">Premium</span>
          </div>
        </div>
      </div>
      <div className="flex-1 ml-6 space-y-6">
        {/* Current Plan */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Joriy rejangiz</h2>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{profile.subscription} obuna</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tugash muddati: {profile.subscriptionEnd || 'Cheksiz'}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl hover:shadow-lg transition-shadow font-medium text-sm">
              Boshqarish
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Rejalar</h2>
          <div className="grid grid-cols-3 gap-4">
            {premiumPlans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-5 transition-all hover:shadow-lg ${
                plan.popular
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/20 ring-2 ring-yellow-400 scale-[1.02]'
                  : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                    POPULAR
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Crown className={`w-4 h-4 ${plan.popular ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <h3 className={`font-bold text-sm ${plan.popular ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{plan.name}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/oy</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}>
                  {plan.name === 'Free' ? 'Hozir boshlash' : 'Obuna bo\'lish'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            To'lov tarixi
          </h2>
          <div className="space-y-2">
            {billingHistory.map((bill, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{bill.plan} - {bill.amount}</p>
                    <p className="text-xs text-gray-500">{bill.date}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  bill.status === 'To\'langan' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>{bill.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── RENDER OVERVIEW ──
  const renderOverview = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-6 card-hover">
        <div className="flex items-center gap-6">
          <div className="relative">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg cursor-pointer">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
            </label>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <button onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.status)}`}>{profile.status}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionColor(profile.subscription)}`}>
                {profile.subscription === 'Pro' && <Crown className="w-3 h-3 inline mr-1" />}
                {profile.subscription}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{profile.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{getLanguageName(profile.language)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mutaxassislik</p>
          <p className="font-medium text-gray-800 dark:text-white">{profile.specialization}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'XP', value: profile.xp.toLocaleString(), color: 'blue' },
          { icon: BookOpen, label: 'Kurslar', value: profile.coursesCount, color: 'green' },
          { icon: Star, label: 'Reyting', value: `#${profile.rating}`, color: 'purple' },
          { icon: Award, label: 'Sertifikatlar', value: profile.certificates, color: 'orange' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
          };
          return (
            <div key={i} className="glass rounded-2xl p-4 card-hover">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[stat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-6 card-hover">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">So'nggi faoliyat</h3>
        <div className="space-y-3">
          {[
            { icon: CheckCircle, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400', title: 'Case Solver - Jinoyat ishi №245', desc: '85 ball bilan yakunlandi', time: '2 soat oldin' },
            { icon: Award, bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400', title: 'Sertifikat olindi', desc: 'Jinoyat huquqi asoslari kursi', time: '1 kun oldin' },
            { icon: Star, bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400', title: 'Reyting oshdi', desc: '156 → 165 o\'ringa ko\'tarildi', time: '3 kun oldin' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page-custom p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Orqaga</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass rounded-xl p-1 mb-6 inline-flex">
          {[
            { id: 'overview', label: 'Umumiy', icon: User },
            { id: 'settings', label: 'Sozlamalar', icon: Settings },
            { id: 'help', label: 'Yordam', icon: HelpCircle },
            { id: 'premium', label: 'Premium', icon: Crown },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'nav-item-active'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'help' && renderHelp()}
        {activeTab === 'premium' && renderPremium()}
      </div>
    </div>
  );
}
