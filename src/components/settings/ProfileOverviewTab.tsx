'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  Camera,
  Crown,
  Shield,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'

interface ProfileData {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  birthDate?: string | null
  specialization?: string
  university?: string
  courseLevel?: string
  role: string
  subscriptionPlan: string
  avatar?: string
  createdAt: string
}

interface StatsData {
  xp: number
  level: number
  rank: string
  totalActions: number
  completedIracCases: number
  memberSince?: string
}

interface ProfileOverviewTabProps {
  onGoToPersonal: () => void
}

export default function ProfileOverviewTab({ onGoToPersonal }: ProfileOverviewTabProps) {
  const { t } = useLanguage()
  const { user, updateProfile } = useAuth()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [profRes, statsRes] = await Promise.all([
          fetch('/api/user/profile-full', { cache: 'no-cache' }),
          fetch('/api/user/stats', { cache: 'no-cache' }),
        ])

        if (profRes.ok) {
          const profJson = await profRes.json()
          if (profJson.success && profJson.data) {
            setProfile(profJson.data)
          }
        }

        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          if (!statsJson.error) {
            setStats(statsJson)
          }
        }
      } catch (err) {
        console.error('Failed to load profile tab data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadSuccess(null)

    if (file.size > 4 * 1024 * 1024) {
      setUploadError(t('profileAvatarHelp', 'JPG, PNG yoki WebP. Maksimal hajm: 4 MB'))
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (res.ok && json.success && json.data?.avatarUrl) {
        const newAvatar = json.data.avatarUrl
        setProfile(prev => (prev ? { ...prev, avatar: newAvatar } : null))
        if (typeof window !== 'undefined') {
          localStorage.setItem('profile_image', newAvatar)
        }
        await updateProfile({ avatar: newAvatar })
        setUploadSuccess(t('savedSuccessfully', 'O‘zgarishlar muvaffaqiyatli saqlandi!'))
        setTimeout(() => setUploadSuccess(null), 3000)
      } else {
        setUploadError(json.error || t('saveError', 'Saqlashda xatolik yuz berdi'))
      }
    } catch {
      setUploadError(t('saveError', 'Saqlashda xatolik yuz berdi'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">{t('loading', 'Yuklanmoqda...')}</p>
      </div>
    )
  }

  const displayName =
    profile?.name ||
    user?.name ||
    profile?.email?.split('@')[0] ||
    t('profileRoleUser', 'Foydalanuvchi')
  const isPro =
    (profile?.subscriptionPlan || user?.subscription_plan || 'free').toLowerCase() === 'pro'
  const isAdmin = (profile?.role || user?.role || 'USER').toUpperCase() === 'ADMIN'

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {uploadSuccess && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}
      {uploadError && (
        <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Upload */}
          <div className="relative flex-shrink-0">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md ring-4 ring-blue-50 dark:ring-zinc-800"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md ring-4 ring-blue-50 dark:ring-zinc-800">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Details & Badges */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {displayName}
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Shield className="w-3 h-3" /> {t('profileRoleAdmin', 'Admin')}
                </span>
              )}
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Crown className="w-3 h-3" /> Pro
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                  {t('free', 'Free')}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
              <span>{profile?.email || user?.email}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                onClick={onGoToPersonal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs"
              >
                {t('edit', 'Tahrirlash')}
              </button>
              {profile?.createdAt && (
                <span className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('profileMemberSince', 'A’zo bo‘lgan sana')}:{' '}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">
              {t('profileXp', 'XP')}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.xp ?? (profile ? 0 : '—')}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">
              {t('profileRank', 'Daraja')}
            </span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white truncate">
            {stats?.rank || (profile ? t('dashboardNewUser', 'Yangi boshlovchi') : '—')}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">
              {t('iracSolver', 'IRAC')}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.completedIracCases ?? (profile ? 0 : '—')}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">
              {t('profileCourses', 'Kurslar')}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.courseLevel
              ? profile.courseLevel
              : profile
                ? t('profileStatusUnknown', "Ko'rsatilmagan")
                : '—'}
          </p>
        </div>
      </div>

      {/* Account Info Details List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          {t('personalInfoTitle', "Shaxsiy ma'lumotlar")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <span className="text-xs text-gray-400 dark:text-zinc-500 block mb-0.5">
              {t('phone', 'Telefon')}
            </span>
            <span className="font-medium text-gray-800 dark:text-zinc-200 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {profile?.phone || t('profileStatusUnknown', "Ko'rsatilmagan")}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <span className="text-xs text-gray-400 dark:text-zinc-500 block mb-0.5">
              {t('specialization', 'Mutaxassislik')}
            </span>
            <span className="font-medium text-gray-800 dark:text-zinc-200">
              {profile?.specialization || t('profileStatusUnknown', "Ko'rsatilmagan")}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <span className="text-xs text-gray-400 dark:text-zinc-500 block mb-0.5">
              {t('university', 'Universitet')}
            </span>
            <span className="font-medium text-gray-800 dark:text-zinc-200">
              {profile?.university || t('profileStatusUnknown', "Ko'rsatilmagan")}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <span className="text-xs text-gray-400 dark:text-zinc-500 block mb-0.5">
              {t('birthDate', "Tug'ilgan sana")}
            </span>
            <span className="font-medium text-gray-800 dark:text-zinc-200">
              {profile?.birthDate
                ? new Date(profile.birthDate).toLocaleDateString()
                : t('profileStatusUnknown', "Ko'rsatilmagan")}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
