'use client';

import { useState, Suspense } from 'react';
import {
  ArrowLeft, User, Mail, Phone, Edit3, Award, BookOpen,
  TrendingUp, Star, Camera, CheckCircle, Crown, Target,
  Bell, Moon, Sun, Shield,
  Smartphone, Monitor, Download, Trash2,
  Eye, EyeOff, Key, Database, AlertTriangle, Settings, Globe
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams } from 'next/navigation';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'Talaba' | 'Magistrant' | 'Amaliyotchi yurist' | 'Professional yurist';
  specialization: string;
  subscription: 'Free' | 'Pro';
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

function ProfileContent() {
  const { dark: themeDark, toggle: toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'settings' | 'help' | 'premium'>('settings');
  const [settingsSubTab, setSettingsSubTab] = useState<'profil' | 'personal' | 'notifications' | 'appearance' | 'security' | 'data'>('profil');
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
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
            status: 'Talaba' as const,
            specialization: user.specialization || '',
            subscription: user.subscription_plan === 'pro' ? 'Pro' as const : 'Free' as const,
            language: 'uz' as const,
            xp: user.xp || 0,
            coursesCount: user.coursesCount || 0,
            rating: user.rating || 0,
            certificates: user.certificates || 0
          };
        } catch {}
      }
    }
    return {
      id: '0', firstName: 'Foydalanuvchi', lastName: '', email: '',
      phone: '+998 __ ___ __ __', status: 'Talaba' as const, specialization: '',
      subscription: 'Free' as const, language: 'uz' as const,
      xp: 0, coursesCount: 0, rating: 0, certificates: 0
    };
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    email: true, push: true, sms: false, marketing: false,
    caseReminders: true, weeklyReport: true
  });
  const [darkMode, setDarkMode] = useState(themeDark);
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
      id: editedProfile.id, email: editedProfile.email,
      name: editedProfile.firstName + ' ' + editedProfile.lastName,
      firstName: editedProfile.firstName, lastName: editedProfile.lastName,
      phone: editedProfile.phone, status: editedProfile.status,
      specialization: editedProfile.specialization, language: editedProfile.language,
      subscription_plan: editedProfile.subscription.toLowerCase(), role: 'USER'
    };
    setProfile(editedProfile);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('jurisai_user', JSON.stringify(userData));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
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
    if (darkMode !== themeDark) toggleTheme();
  };

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePassword = () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    if (passwordData.newPass !== passwordData.confirm) { setPasswordError('Yangi parollar mos kelmadi!'); return; }
    if (passwordData.newPass.length < 6) { setPasswordError('Parol kamida 6 belgidan iborat bo\'lishi kerak!'); return; }
    setPasswordSuccess('Parol muvaffaqiyatli o\'zgartirildi!');
    setTimeout(() => setPasswordSuccess(null), 3000);
    setShowPasswordForm(false);
    setPasswordData({ current: '', newPass: '', confirm: '' });
  };

  const handleExportData = () => {
    const data = { profile, exportDate: new Date().toISOString(), platform: 'JurisAI' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `jurisai-data-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const handleDeleteAccount = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleteSuccess('Hisob o\'chirildi. Xayr!');
    setTimeout(() => setDeleteSuccess(null), 3000);
    setDeleteConfirm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Talaba': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Magistrant': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Amaliyotchi yurist': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Professional yurist': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) { case 'uz': return 'O\'zbekcha'; case 'en': return 'Inglizcha'; case 'ru': return 'Ruscha'; default: return lang; }
  };

  const renderSettings = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Settings Sidebar */}
      <div className="w-full lg:w-56 flex-shrink-0">
        <div className="card-default rounded-2xl p-3 space-y-1">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'personal', label: 'Shaxsiy ma\'lumotlar', icon: Edit3 },
            { id: 'notifications', label: 'Bildirishnomalar', icon: Bell },
            { id: 'appearance', label: 'Ko\'rinish', icon: Monitor },
            { id: 'security', label: 'Xavfsizlik', icon: Shield },
            { id: 'data', label: 'Ma\'lumotlar', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = settingsSubTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setSettingsSubTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-item-active' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 min-w-0">
        {settingsSaved && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" /> Sozlamalar muvaffaqiyatli saqlandi!
          </div>
        )}

        {/* Profil */}
        {settingsSubTab === 'profil' && (
          <div className="card-default rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Mening Profilim</h2>
            {/* Profile Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="relative">
                {profileImage ? (
                  <img src={profileImage} alt="" className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-700" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-700">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all cursor-pointer shadow">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.firstName} {profile.lastName}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{profile.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span className={"inline-block px-3 py-1 rounded-full text-xs font-medium " + getStatusColor(profile.status)}>{profile.status}</span>
                  {profile.subscription === 'Pro' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                      <Crown className="w-3 h-3" /> Pro
                    </span>
                  )}
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                    <p className="text-lg font-bold text-blue-600">{profile.coursesCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kurslar</p>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                    <p className="text-lg font-bold text-green-600">{profile.xp}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                    <p className="text-lg font-bold text-orange-600">{profile.rating}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reyting</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Til</p>
                  <p className="font-medium text-gray-800 dark:text-white">{getLanguageName(profile.language)}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Telefon</p>
                  <p className="font-medium text-gray-800 dark:text-white">{profile.phone}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Award className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sertifikatlar</p>
                  <p className="font-medium text-gray-800 dark:text-white">{profile.certificates} ta</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mutaxassislik</p>
                  <p className="font-medium text-gray-800 dark:text-white">{profile.specialization || 'Ko\'rsatilmagan'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Info */}
        {settingsSubTab === 'personal' && (
          <div className="card-default rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Shaxsiy ma'lumotlar</h2>
            {/* Profile Header Summary */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="relative">
                {profileImage ? (
                  <img src={profileImage} alt="" className="w-16 h-16 rounded-full object-cover shadow" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-green-500 rounded-full flex items-center justify-center shadow">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all cursor-pointer">
                  <Camera className="w-3 h-3" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{profile.firstName} {profile.lastName}</h3>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>{profile.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
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
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Mutaxassislik</label>
                <input type="text" value={editedProfile.specialization}
                  onChange={(e) => setEditedProfile({...editedProfile, specialization: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Saqlash</button>
              <button onClick={handleCancel} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">Bekor qilish</button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {settingsSubTab === 'notifications' && (
          <div className="space-y-4">
            <div className="card-default rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" /> Bildirishnoma sozlamalari
              </h2>
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email bildirishnomalar', desc: 'Muhim yangiliklar haqida email orqali xabar olish' },
                  { id: 'push', label: 'Push bildirishnomalar', desc: 'Brauzer orqali real-vaqt rejimida bildirishnomalar olish' },
                  { id: 'sms', label: 'SMS bildirishnomalar', desc: 'Telefon raqamingizga SMS xabarlar olish' },
                  { id: 'caseReminders', label: 'Ish eslatmalari', desc: 'Yangi ishlar va topshiriqlar haqida eslatma olish' },
                  { id: 'weeklyReport', label: 'Haftalik hisobot', desc: 'Har hafta faoliyatingiz haqida hisobot olish' },
                  { id: 'marketing', label: 'Marketing xatlari', desc: 'Maxsus takliflar va aksiyalar haqida xabar olish' },
                ].map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors">
                    <div className="relative mt-0.5">
                      <input type="checkbox" checked={notifSettings[item.id as keyof NotificationSettings]}
                        onChange={(e) => setNotifSettings({...notifSettings, [item.id]: e.target.checked})} className="sr-only peer" />
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
            <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Sozlamalarni saqlash</button>
          </div>
        )}

        {/* Appearance */}
        {settingsSubTab === 'appearance' && (
          <div className="space-y-4">
            <div className="card-default rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" /> Ko'rinish sozlamalari
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Mavzu</label>
                  <div className="flex gap-3">
                    <button onClick={() => { setDarkMode(false); if (themeDark) toggleTheme(); }}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${!darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                      <Sun className="w-5 h-5 text-orange-500" /> <span className="font-medium text-gray-800 dark:text-white">Yorug'</span>
                    </button>
                    <button onClick={() => { setDarkMode(true); if (!themeDark) toggleTheme(); }}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                      <Moon className="w-5 h-5 text-blue-600" /> <span className="font-medium text-gray-800 dark:text-white">Qorong'i</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Til</label>
                  <select value={editedProfile.language} onChange={(e) => setEditedProfile({...editedProfile, language: e.target.value as any})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                    <option value="uz">O'zbekcha</option>
                    <option value="en">Inglizcha</option>
                    <option value="ru">Ruscha</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Sozlamalarni saqlash</button>
          </div>
        )}

        {/* Security */}
        {settingsSubTab === 'security' && (
          <div className="space-y-4">
            <div className="card-default rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" /> Xavfsizlik sozlamalari
              </h2>
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
                      <input type={showCurrentPass ? 'text' : 'password'} placeholder="Joriy parol" value={passwordData.current}
                        onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                      <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showNewPass ? 'text' : 'password'} placeholder="Yangi parol" value={passwordData.newPass}
                        onChange={(e) => setPasswordData({...passwordData, newPass: e.target.value})}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                      <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input type="password" placeholder="Yangi parolni takrorlang" value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    <button onClick={handleChangePassword} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">Parolni yangilash</button>
                  </div>
                )}
              </div>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Ikki faktorli autentifikatsiya</p>
                    <p className="text-xs text-gray-500">Hisobingizni qo'shimcha himoya qilish</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">Yoqish</button>
              </div>
            </div>
            <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Sozlamalarni saqlash</button>
          </div>
        )}

        {/* Data */}
        {settingsSubTab === 'data' && (
          <div className="space-y-4">
            <div className="card-default rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-600" /> Ma'lumotlar boshqaruvi
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
                  <button onClick={handleExportData} className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium">Eksport</button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Hisobni o'chirish</p>
                      <p className="text-xs text-gray-500">Hisobingizni butunlay o'chirish va barcha ma'lumotlarni tozalash</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deleteConfirm && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Haqiqatan ham o'chirilsinmi?</span>
                    )}
                    <button onClick={handleDeleteAccount} className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium border border-red-200 dark:border-red-800">
                      {deleteConfirm ? 'Tasdiqlash' : 'O\'chirish'}
                    </button>
                    {deleteConfirm && (
                      <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">
                        Bekor qilish
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">Diqqat!</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Hisobni o'chirish amalini qaytarib bo'lmaydi.</p>
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

  return (      <div className="min-h-screen bg-page-custom p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </a>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Sozlamalar</h1>
        </div>
        {/* Toast messages */}
        {passwordError && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <span>{passwordError}</span>
            <button onClick={() => setPasswordError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" /> {passwordSuccess}
          </div>
        )}
        {deleteSuccess && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <span>{deleteSuccess}</span>
          </div>
        )}
        {renderSettings()}
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page-custom flex items-center justify-center"><div className="text-center">Yuklanmoqda...</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
