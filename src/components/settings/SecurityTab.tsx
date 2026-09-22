'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Lock,
  Globe,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import { authService } from '@/services/supabase-auth'

interface SessionInfo {
  id: string
  isCurrent: boolean
  browser: string
  os: string
  deviceType: string
  ip: string
  lastActive: string
  location?: string
}

export default function SecurityTab() {
  const { t } = useLanguage()
  const { user } = useAuth()

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState<string | null>(null)
  const [passError, setPassError] = useState<string | null>(null)

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [authProvider, setAuthProvider] = useState<string>('Email & Password')
  const [sessionLoading, setSessionLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadSessions() {
      setSessionLoading(true)
      try {
        const res = await fetch('/api/user/sessions', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setSessions(json.data.sessions || [])
            if (json.data.authProvider) setAuthProvider(json.data.authProvider)
          }
        }
      } catch (err) {
        console.error('Failed to load session details:', err)
      } finally {
        setSessionLoading(false)
      }
    }
    loadSessions()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassSuccess(null)

    if (newPassword.length < 6) {
      setPassError(t('passwordMinLengthError', 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak'))
      return
    }

    if (newPassword !== confirmPassword) {
      setPassError(t('passwordMismatchError', 'Yangi parollar bir-biriga mos kelmadi'))
      return
    }

    setPassLoading(true)
    try {
      const res = await authService.changePassword(newPassword)
      if (res.success) {
        setPassSuccess(t('passwordUpdatedSuccess', 'Parol muvaffaqiyatli o‘zgartirildi!'))
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPassSuccess(null), 4000)
      } else {
        setPassError(
          res.error || t('passwordUpdateError', 'Parolni o‘zgartirishda xatolik yuz berdi')
        )
      }
    } catch {
      setPassError(t('passwordUpdateError', 'Parolni o‘zgartirishda xatolik yuz berdi'))
    } finally {
      setPassLoading(false)
    }
  }

  const handleRevokeOtherSessions = async () => {
    setRevoking(true)
    setRevokeSuccess(null)
    try {
      const res = await fetch('/api/user/sessions', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        setRevokeSuccess(
          t('revokeSessionsSuccess', 'Boshqa barcha qurilmalardagi sessiyalar bekor qilindi')
        )
        setTimeout(() => setRevokeSuccess(null), 4000)
      }
    } catch {
      // Ignored
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('securityTitle', 'Xavfsizlik sozlamalari')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {t('securitySubtitle', 'Parol, faol sessiyalar va hisob xavfsizligini nazorat qiling')}
        </p>
      </div>

      {/* 1. Change Password Form */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>{t('changePasswordTitle', 'Parolni o‘zgartirish')}</span>
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {t('changePasswordDesc', 'Hisobingiz xavfsizligi uchun kuchli paroldan foydalaning')}
          </p>
        </div>

        {passSuccess && (
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}
        {passError && (
          <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('newPassword', 'Yangi parol')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('confirmNewPassword', 'Yangi parolni takrorlang')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passLoading || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-xs"
          >
            {passLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('saving', 'Saqlanmoqda...')}</span>
              </>
            ) : (
              <span>{t('changePasswordTitle', 'Parolni yangilash')}</span>
            )}
          </button>
        </form>
      </div>

      {/* 2. Authentication Provider Info */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>{t('authProviderTitle', 'Autentifikatsiya usuli')}</span>
        </h3>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{authProvider}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{user?.email}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('profileVerified', 'Tasdiqlangan')}
          </span>
        </div>
      </div>

      {/* 3. Active Sessions */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-600" />
              <span>{t('activeSessionsTitle', 'Faol sessiyalar')}</span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              {t('activeSessionsDesc', 'Hisobingizga ulangan qurilmalar va brauzerlar')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRevokeOtherSessions}
            disabled={revoking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 rounded-xl border border-rose-200/60 dark:border-rose-900/40 transition-colors"
          >
            {revoking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{t('revokeOtherSessions', 'Boshqa barcha sessiyalardan chiqish')}</span>
          </button>
        </div>

        {revokeSuccess && (
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{revokeSuccess}</span>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(sess => (
            <div
              key={sess.id}
              className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 shadow-xs">
                  {sess.deviceType === 'Mobile' ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {sess.browser} — {sess.os}
                    </p>
                    {sess.isCurrent && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {t('currentSessionBadge', 'Joriy qurilma')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {sess.location || 'Toshkent, O‘zbekiston'} • IP: {sess.ip}
                  </p>
                </div>
              </div>

              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Faol
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
