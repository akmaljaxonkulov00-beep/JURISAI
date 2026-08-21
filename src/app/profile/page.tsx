'use client'

import { useState, Suspense, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Edit3,
  Award,
  BookOpen,
  TrendingUp,
  Star,
  Camera,
  CheckCircle,
  Crown,
  Target,
  Bell,
  Moon,
  Sun,
  Shield,
  Smartphone,
  Monitor,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Database,
  AlertTriangle,
  Settings,
  Globe,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { useSearchParams } from 'next/navigation'
import { useSettingsSync } from '@/hooks/useSettingsSync'
import { firebaseAuth } from '@/services/supabase-auth'
import { supabase } from '@/lib/supabase-browser'

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'Talaba' | 'Magistrant' | 'Amaliyotchi yurist' | 'Professional yurist'
  specialization: string
  subscription: 'Free' | 'Pro'
  language: 'uz' | 'en' | 'ru'
  xp: number
  coursesCount: number
  rating: number
  certificates: number
}

interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
  caseReminders: boolean
  weeklyReport: boolean
}

function ProfileContent() {
  const { dark: themeDark, toggle: toggleTheme } = useTheme()
  const { language: currentLanguage, setLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState<'settings' | 'help' | 'premium'>('settings')
  const [settingsSubTab, setSettingsSubTab] = useState<
    'profil' | 'personal' | 'notifications' | 'appearance' | 'security' | 'data'
  >('profil')
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      // Haqiqiy Supabase session user birinchi navbatda (yangi tab/refresh ham to'g'ri)
      const realUser = firebaseAuth.getCurrentUser()
      const storedUser =
        realUser ||
        (() => {
          try {
            const stored = localStorage.getItem('auth_user')
            return stored ? JSON.parse(stored) : null
          } catch {
            return null
          }
        })()
      if (storedUser) {
        const name = storedUser.name || storedUser.full_name || ''
        const nameParts = (name || '').split(' ').filter(Boolean)
        return {
          id: storedUser.id || '0',
          firstName:
            nameParts[0] ||
            storedUser.firstName ||
            storedUser.email?.split('@')[0] ||
            'Foydalanuvchi',
          lastName: nameParts.slice(1).join(' ') || storedUser.lastName || '',
          email: storedUser.email || '',
          phone: storedUser.phone || '+998 __ ___ __ __',
          status: 'Talaba' as const,
          specialization: storedUser.specialization || '',
          subscription:
            storedUser.subscription_plan === 'pro' ? ('Pro' as const) : ('Free' as const),
          language: 'uz' as const,
          xp: storedUser.xp || 0,
          coursesCount: storedUser.coursesCount || 0,
          rating: storedUser.rating || 0,
          certificates: storedUser.certificates || 0,
        }
      }
    }
    return {
      id: '0',
      firstName: 'Foydalanuvchi',
      lastName: '',
      email: '',
      phone: '+998 __ ___ __ __',
      status: 'Talaba' as const,
      specialization: '',
      subscription: 'Free' as const,
      language: 'uz' as const,
      xp: 0,
      coursesCount: 0,
      rating: 0,
      certificates: 0,
    }
  })

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    caseReminders: true,
    weeklyReport: true,
  })
  // darkMode — doimo context bilan sinxron
  const darkMode = themeDark
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ newPass: '', confirm: '' })
  const [showNewPass, setShowNewPass] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('profile_image')
    return null
  })

  // ── Reactive sync: balance, subscription, payment history from Supabase ──
  const sync = useSettingsSync()

  // Current user email for filtering payments — safe parse
  const currentUserEmail =
    typeof window !== 'undefined'
      ? (() => {
          try {
            return (
              (JSON.parse(localStorage.getItem('auth_user') || '{}') as { email?: string }).email ||
              ''
            )
          } catch {
            return ''
          }
        })()
      : ''

  // Filter this user's payment requests from sync data
  const userPayments = sync.paymentRequests
    .filter(p => p.userEmail === currentUserEmail || p.userId === currentUserEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Compute total approved balance
  const totalApprovedBalance = userPayments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  // Latest payment info for display
  const latestPayment = userPayments[0]
  const reactivePaymentStatus = latestPayment?.status || null
  const reactivePaymentAmount = latestPayment?.amount || 0
  const reactivePaymentDate = latestPayment?.createdAt
    ? new Date(latestPayment.createdAt).toLocaleDateString('uz-UZ')
    : ''

  // Update subscription plan reactively from latest approved payment
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (!stored) return
      const user = JSON.parse(stored)
      const approvedPaid = userPayments.filter(p => p.status === 'approved' && p.amount > 0)
      if (approvedPaid.length > 0) {
        const plan = approvedPaid[0].plan || 'standart'
        if (user.subscription_plan !== plan) {
          user.subscription_plan = plan
          const updatedProfile = {
            ...profile,
            subscription: plan === 'pro' ? ('Pro' as const) : ('Free' as const),
          }
          setProfile(updatedProfile)
          setEditedProfile(updatedProfile)
          localStorage.setItem('auth_user', JSON.stringify(user))
          localStorage.setItem('jurisai_user', JSON.stringify(user))
        }
      }
    } catch {}
  }, [sync.paymentRequests])

  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)

  const handleSave = async () => {
    setSaveError(null)
    setSaveLoading(true)
    try {
      const fullName = (editedProfile.firstName + ' ' + editedProfile.lastName).trim()
      const userData = {
        id: editedProfile.id,
        email: editedProfile.email,
        name: fullName,
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        phone: editedProfile.phone,
        status: editedProfile.status,
        specialization: editedProfile.specialization,
        language: editedProfile.language,
        subscription_plan: editedProfile.subscription.toLowerCase(),
      }

      // ── Email o'zgargan bo'lsa — Supabase orqali yangilaymiz ──
      if (profile.email && editedProfile.email !== profile.email) {
        const emailResult = await firebaseAuth.changeEmail(editedProfile.email)
        if (!emailResult.success) {
          setSaveError(emailResult.error || "Emailni o'zgartirishda xatolik")
          setSaveLoading(false)
          return
        }
        // Email o'zgarganda tasdiqlash talab qilinadi — ko'rsatamiz
        setSaveError(
          emailResult.needsConfirmation
            ? 'Email yangilandi. Tasdiqlash xati yangi emailingizga yuborildi.'
            : null
        )
      }

      // ── Profil ma'lumotlari Supabase'ga sinxronlanadi (auth + registered_users) ──
      const result = await firebaseAuth.updateProfile({
        name: fullName,
        phone: editedProfile.phone || undefined,
        email: editedProfile.email,
      })
      if (!result.success) {
        setSaveError(result.error || 'Profilni saqlashda xatolik')
        setSaveLoading(false)
        return
      }

      setProfile(editedProfile)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      localStorage.setItem('jurisai_user', JSON.stringify(userData))
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch {
      setSaveError('Profilni saqlashda kutilmagan xatolik')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
  }

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setAvatarError('Rasm hajmi 4 MB dan oshmasligi kerak')
      setTimeout(() => setAvatarError(null), 3000)
      return
    }
    setAvatarUploading(true)
    setAvatarError(null)

    const reader = new FileReader()
    reader.onload = async event => {
      const dataUrl = event.target?.result as string
      setProfileImage(dataUrl)
      localStorage.setItem('profile_image', dataUrl)

      // ── Supabase Storage'ga yuklash (avatars bucket) ──
      const current = firebaseAuth.getCurrentUser()
      const userId = current?.id || ''
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${userId || 'user'}-${Date.now()}.${ext}`
      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true, cacheControl: '3600' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
          const avatarUrl = urlData?.publicUrl || dataUrl
          setProfileImage(avatarUrl)
          localStorage.setItem('profile_image', avatarUrl)
          await firebaseAuth.updateProfile({ avatar: avatarUrl }).catch(() => {})
        } else {
          // Bucket yo'q bo'lsa — lokal saqlash davom etadi
          setAvatarError("Rasm saqlandi (server yuklash hozircha o'chirilgan)")
          setTimeout(() => setAvatarError(null), 3000)
        }
      } catch {
        // Offline / storage xato — lokal dataUrl yetarli
      }
      setAvatarUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveSettings = () => {
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const handleChangePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)
    if (passwordData.newPass !== passwordData.confirm) {
      setPasswordError('Yangi parollar mos kelmadi!')
      return
    }
    if (passwordData.newPass.length < 6) {
      setPasswordError("Parol kamida 6 belgidan iborat bo'lishi kerak!")
      return
    }
    // Haqiqiy Supabase parol o'zgarishi — joriy parol talab qilinmaydi
    // (foydalanuvchi tizimga kirgan, session mavjud)
    const result = await firebaseAuth.changePassword(passwordData.newPass)
    if (!result.success) {
      setPasswordError(result.error || "Parolni o'zgartirishda xatolik")
      return
    }
    setPasswordSuccess("Parol muvaffaqiyatli o'zgartirildi!")
    setTimeout(() => setPasswordSuccess(null), 3000)
    setShowPasswordForm(false)
    setPasswordData({ newPass: '', confirm: '' })
  }

  const handleExportData = () => {
    const data = { profile, exportDate: new Date().toISOString(), platform: 'JurisAI' }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jurisai-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const userData = JSON.parse(localStorage.getItem('auth_user') || '{}')
      const authToken = sessionStorage.getItem('auth_token') || userData.id || userData.uid || ''

      // 1. Call the server to delete Supabase records
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id || userData.uid,
          email: userData.email,
          authToken,
        }),
      })
      const result = await res.json()

      // 2. Sign out from Firebase if available
      try {
        const { firebaseAuth } = await import('@/services/supabase-auth')
        await firebaseAuth.signOut()
      } catch {}

      if (result.success) {
        setDeleteSuccess("Hisob o'chirildi. Xayr!")
        // Clear all local data after brief delay
        setTimeout(() => {
          localStorage.clear()
          sessionStorage.clear()
          window.location.href = '/signin'
        }, 1500)
      } else {
        setDeleteError(result.error || "Hisobni o'chirishda xatolik yuz berdi")
        setDeleteConfirm(false)
      }
    } catch (err) {
      setDeleteError("Server bilan bog'lanishda xatolik. Iltimos, qayta urinib ko'ring.")
      setDeleteConfirm(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Talaba':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'Magistrant':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'Amaliyotchi yurist':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'Professional yurist':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-zinc-800/30 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'uz':
        return "O'zbekcha"
      case 'en':
        return 'Inglizcha'
      case 'ru':
        return 'Ruscha'
      default:
        return lang
    }
  }

  const renderSettings = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Settings Sidebar */}
      <div className="w-full lg:w-56 flex-shrink-0">
        <div className="card-default rounded-2xl p-3 space-y-1">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'personal', label: "Shaxsiy ma'lumotlar", icon: Edit3 },
            { id: 'payments', label: "To'lovlar", icon: CreditCard },
            { id: 'notifications', label: 'Bildirishnomalar', icon: Bell },
            { id: 'appearance', label: "Ko'rinish", icon: Monitor },
            { id: 'security', label: 'Xavfsizlik', icon: Shield },
            { id: 'data', label: "Ma'lumotlar", icon: Database },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = settingsSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setSettingsSubTab(
                    tab.id as
                      'profil' | 'personal' | 'notifications' | 'appearance' | 'security' | 'data'
                  )
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-item-active' : 'text-gray-600 dark:text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
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
        {saveError && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4" /> {saveError}
          </div>
        )}
        {avatarError && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4" /> {avatarError}
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
                  <img
                    src={profileImage}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-700">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all cursor-pointer shadow">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                </label>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-zinc-500 mt-1">
                  {profile.email}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span
                    className={
                      'inline-block px-3 py-1 rounded-full text-xs font-medium ' +
                      getStatusColor(profile.status)
                    }
                  >
                    {profile.status}
                  </span>
                  {profile.subscription === 'Pro' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                      <Crown className="w-3 h-3" /> Pro
                    </span>
                  )}
                </div>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                    <p className="text-lg font-bold text-blue-600">{profile.coursesCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                      Kurslar
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                    <p className="text-lg font-bold text-green-600">{profile.xp}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                      XP
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                    <p className="text-lg font-bold text-orange-600">{profile.rating}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                      Reyting
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Payment Status — reactive from sync */}
            {reactivePaymentStatus && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  reactivePaymentStatus === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : reactivePaymentStatus === 'pending'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                {reactivePaymentStatus === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : reactivePaymentStatus === 'pending' ? (
                  <Clock className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {reactivePaymentStatus === 'approved' && "To'lov tasdiqlandi ✅"}
                    {reactivePaymentStatus === 'pending' && "To'lov tekshirilmoqda ⏳"}
                    {reactivePaymentStatus === 'rejected' && "To'lov rad etildi ❌"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                    {reactivePaymentAmount > 0 && `${reactivePaymentAmount.toLocaleString()} UZS`}
                    {reactivePaymentDate && ` — ${reactivePaymentDate}`}
                  </p>
                </div>
              </div>
            )}

            {/* Balance display */}
            {totalApprovedBalance > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Balans</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {totalApprovedBalance.toLocaleString()} UZS
                  </p>
                </div>
              </div>
            )}

            {/* Processing payments */}
            {userPayments.filter(p => p.status === 'pending').length > 0 && (
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    {userPayments.filter(p => p.status === 'pending').length} ta to'lov
                    tekshirilmoqda
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Moderator tomonidan ko'rib chiqilmoqda
                  </p>
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">Til</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {getLanguageName(profile.language)}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                    Telefon
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">{profile.phone}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                    Mutaxassislik
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {profile.specialization || "Ko'rsatilmagan"}
                  </p>
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
                  <img
                    src={profileImage}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover shadow"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-green-500 rounded-full flex items-center justify-center shadow">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all cursor-pointer">
                  <Camera className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                </label>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-500">{profile.email}</p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}
                >
                  {profile.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                  Ism
                </label>
                <input
                  type="text"
                  value={editedProfile.firstName}
                  onChange={e => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                  Familiya
                </label>
                <input
                  type="text"
                  value={editedProfile.lastName}
                  onChange={e => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                  Elektron pochta
                </label>
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={e => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={e => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                  Maqomi
                </label>
                <select
                  value={editedProfile.status}
                  onChange={e =>
                    setEditedProfile({
                      ...editedProfile,
                      status: e.target.value as UserProfile['status'],
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="Talaba">Talaba</option>
                  <option value="Magistrant">Magistrant</option>
                  <option value="Amaliyotchi yurist">Amaliyotchi yurist</option>
                  <option value="Professional yurist">Professional yurist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                  Mutaxassislik
                </label>
                <input
                  type="text"
                  value={editedProfile.specialization}
                  onChange={e =>
                    setEditedProfile({ ...editedProfile, specialization: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
              >
                {saveLoading ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saveLoading}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-60"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        {/* Payments History */}
        {(settingsSubTab as string) === 'payments' && (
          <div className="space-y-4">
            <div className="card-default rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> To'lovlar tarixi
              </h2>

              {/* Balance summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Balans</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {totalApprovedBalance.toLocaleString()} UZS
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Tasdiqlangan
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {userPayments.filter(p => p.status === 'approved').length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Kutilmoqda
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {userPayments.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>

              {/* Sync status */}
              <div className="flex items-center justify-between mb-4">
                {sync.loading ? (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">
                    Yangilanmoqda...
                  </p>
                ) : sync.lastSynced ? (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    So'nggi yangilanish: {sync.lastSynced.toLocaleTimeString('uz-UZ')} (har 15
                    sekundda)
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    Ma'lumotlar yuklanmoqda...
                  </p>
                )}
              </div>

              {/* Payment list */}
              {userPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-zinc-400 font-medium">
                    Hali to'lovlar mavjud emas
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Premium tarifga o'tish uchun to'lov qiling
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPayments.map(pay => (
                    <div
                      key={pay.id}
                      className={`p-4 rounded-xl border transition-all ${
                        pay.status === 'approved'
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                          : pay.status === 'pending'
                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {pay.status === 'approved' && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                          {pay.status === 'pending' && (
                            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 animate-pulse" />
                          )}
                          {pay.status === 'rejected' && (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {pay.plan === 'pro' ? 'Pro' : 'Standart'} tarif —{' '}
                              {pay.amount.toLocaleString()} UZS
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500">
                              {new Date(pay.createdAt).toLocaleDateString('uz-UZ', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {pay.status === 'approved' && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Tasdiqlangan
                              </span>
                            )}
                            {pay.status === 'pending' && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                Tekshirilmoqda
                              </span>
                            )}
                            {pay.status === 'rejected' && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                Rad etilgan
                              </span>
                            )}
                          </div>
                        </div>
                        {pay.receiptImage &&
                          (pay.receiptImage.startsWith('data:') ||
                            pay.receiptImage.startsWith('http')) && (
                            <a
                              href={pay.receiptImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border dark:border-zinc-700 hover:ring-2 ring-blue-500 transition-all block"
                            >
                              <img
                                src={pay.receiptImage}
                                alt="Chek"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  {
                    id: 'email',
                    label: 'Email bildirishnomalar',
                    desc: 'Muhim yangiliklar haqida email orqali xabar olish',
                  },
                  {
                    id: 'push',
                    label: 'Push bildirishnomalar',
                    desc: 'Brauzer orqali real-vaqt rejimida bildirishnomalar olish',
                  },
                  {
                    id: 'sms',
                    label: 'SMS bildirishnomalar',
                    desc: 'Telefon raqamingizga SMS xabarlar olish',
                  },
                  {
                    id: 'caseReminders',
                    label: 'Ish eslatmalari',
                    desc: 'Yangi ishlar va topshiriqlar haqida eslatma olish',
                  },
                  {
                    id: 'weeklyReport',
                    label: 'Haftalik hisobot',
                    desc: 'Har hafta faoliyatingiz haqida hisobot olish',
                  },
                  {
                    id: 'marketing',
                    label: 'Marketing xatlari',
                    desc: 'Maxsus takliflar va aksiyalar haqida xabar olish',
                  },
                ].map(item => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                  >
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={notifSettings[item.id as keyof NotificationSettings]}
                        onChange={e =>
                          setNotifSettings({ ...notifSettings, [item.id]: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white dark:bg-zinc-900 after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-4"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-zinc-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Sozlamalarni saqlash
            </button>
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
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-3">
                    Mavzu
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (themeDark) toggleTheme()
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${!darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:border-zinc-700'}`}
                    >
                      <Sun className="w-5 h-5 text-orange-500" />{' '}
                      <span className="font-medium text-gray-800 dark:text-white">Yorug'</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!themeDark) toggleTheme()
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:border-zinc-700'}`}
                    >
                      <Moon className="w-5 h-5 text-blue-600" />{' '}
                      <span className="font-medium text-gray-800 dark:text-white">Qorong'i</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-zinc-500 mb-1.5">
                    Til
                  </label>
                  <select
                    value={editedProfile.language}
                    onChange={e => {
                      const newLang = e.target.value as UserProfile['language']
                      setEditedProfile({
                        ...editedProfile,
                        language: newLang,
                      })
                      // Tilni darhol butun saytga qo'llash
                      setLanguage(newLang)
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="uz">O'zbekcha</option>
                    <option value="en">Inglizcha</option>
                    <option value="ru">Ruscha</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Sozlamalarni saqlash
            </button>
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
                    <Key className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-zinc-500" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Parol</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        Oxirgi o'zgarish: 3 oy oldin
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
                  >
                    O'zgartirish
                  </button>
                </div>
                {showPasswordForm && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Joriy parolni kiritish shart emas — tizimga kirganingiz uchun yangi parol
                      darhol o'rnatiladi.
                    </p>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        placeholder="Yangi parol"
                        value={passwordData.newPass}
                        onChange={e =>
                          setPasswordData({ ...passwordData, newPass: e.target.value })
                        }
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <button
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:text-zinc-400"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Yangi parolni takrorlang"
                      value={passwordData.confirm}
                      onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleChangePassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Parolni yangilash
                    </button>
                  </div>
                )}
              </div>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-zinc-500" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      Ikki faktorli autentifikatsiya
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Hisobingizni qo'shimcha himoya qilish
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                  Yoqish
                </button>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Sozlamalarni saqlash
            </button>
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
                      <p className="font-medium text-gray-800 dark:text-white">
                        Ma'lumotlarni eksport qilish
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        Barcha ma'lumotlaringizni JSON formatida yuklab olish
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
                  >
                    Eksport
                  </button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Hisobni o'chirish</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        Hisobingizni butunlay o'chirish va barcha ma'lumotlarni tozalash
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deleteLoading && (
                      <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                    )}
                    {deleteConfirm && !deleteLoading && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Haqiqatan ham o'chirilsinmi?
                      </span>
                    )}
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className={`px-4 py-2 text-sm rounded-xl transition-colors font-medium border ${
                        deleteLoading
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : deleteConfirm
                            ? 'bg-red-600 text-white hover:bg-red-700 border-red-600'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800'
                      }`}
                    >
                      {deleteLoading
                        ? "O'chirilmoqda..."
                        : deleteConfirm
                          ? 'Tasdiqlash'
                          : "O'chirish"}
                    </button>
                    {deleteConfirm && !deleteLoading && (
                      <button
                        onClick={() => {
                          setDeleteConfirm(false)
                          setDeleteError(null)
                        }}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                      >
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
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        Hisobni o'chirish amalini qaytarib bo'lmaydi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-page-custom mobile-safe-top p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </a>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Sozlamalar</h1>
        </div>
        {/* Toast messages */}
        {passwordError && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <span>{passwordError}</span>
            <button
              onClick={() => setPasswordError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" /> {passwordSuccess}
          </div>
        )}
        {deleteSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" /> {deleteSuccess}
          </div>
        )}
        {deleteError && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4" /> {deleteError}
          </div>
        )}
        {renderSettings()}
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page-custom flex items-center justify-center">
          <div className="text-center">Yuklanmoqda...</div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
