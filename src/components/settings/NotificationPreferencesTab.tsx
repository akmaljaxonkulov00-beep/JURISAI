'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Sparkles,
  Gavel,
  BookOpen,
  Trash2,
  CheckCheck,
  Clock,
  ExternalLink,
  CreditCard,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'

interface NotifSettings {
  email_system: boolean
  email_course: boolean
  email_materials: boolean
  email_payments: boolean
  email_security: boolean
  inapp_ai_results: boolean
  inapp_case_results: boolean
  inapp_virtual_court: boolean
  inapp_system: boolean
  push_enabled: boolean
  marketing_emails: boolean
}

interface InboxNotification {
  id: string
  type: string
  category: string
  title: string
  message: string
  read: boolean
  action_url?: string
  action_text?: string
  created_at: string
}

export default function NotificationPreferencesTab() {
  const { t } = useLanguage()

  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'preferences'>('inbox')
  const [inboxNotifications, setInboxNotifications] = useState<InboxNotification[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)

  const [settings, setSettings] = useState<NotifSettings>({
    email_system: true,
    email_course: true,
    email_materials: true,
    email_payments: true,
    email_security: true,
    inapp_ai_results: true,
    inapp_case_results: true,
    inapp_virtual_court: true,
    inapp_system: true,
    push_enabled: true,
    marketing_emails: false,
  })

  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 1. Load preferences
  useEffect(() => {
    async function loadPreferences() {
      setLoading(true)
      try {
        const res = await fetch('/api/user/notifications', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setSettings(prev => ({ ...prev, ...json.data }))
          }
        }
      } catch (err) {
        console.error('Failed to fetch notification preferences:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // 2. Load Inbox notifications
  const loadInbox = useCallback(async () => {
    setInboxLoading(true)
    try {
      const { getAuthHeaders } = await import('@/lib/api-auth-client')
      const headers = await getAuthHeaders()
      if (!headers.Authorization) return

      const res = await fetch('/api/notifications', { headers, cache: 'no-cache' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setInboxNotifications(json.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch inbox notifications:', err)
    } finally {
      setInboxLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInbox()

    const handleUpdate = () => {
      loadInbox()
    }
    window.addEventListener('juristiv_subscription_updated', handleUpdate)
    return () => window.removeEventListener('juristiv_subscription_updated', handleUpdate)
  }, [loadInbox])

  const handleMarkAllRead = async () => {
    setInboxNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      const { getAuthHeaders } = await import('@/lib/api-auth-client')
      const headers = await getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ markAll: true }),
      })
    } catch {}
  }

  const handleMarkRead = async (id: string) => {
    setInboxNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    try {
      const { getAuthHeaders } = await import('@/lib/api-auth-client')
      const headers = await getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ id }),
      })
    } catch {}
  }

  const handleToggle = async (key: keyof NotifSettings) => {
    const nextVal = !settings[key]
    const updated = { ...settings, [key]: nextVal }
    setSettings(updated)
    setSavingKey(key)

    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: nextVal }),
      })
      if (res.ok) {
        setSuccessMsg(t('savedSuccessfully', 'O‘zgarishlar muvaffaqiyatli saqlandi!'))
        setTimeout(() => setSuccessMsg(null), 2500)
      }
    } catch (e) {
      console.error('Failed to update notification setting:', e)
    } finally {
      setSavingKey(null)
    }
  }

  const emailItems: Array<{ key: keyof NotifSettings; label: string; desc: string }> = [
    {
      key: 'email_system',
      label: t('notifEmailSystem', 'Muhim tizim xabarlari'),
      desc: t('notifEmailSystemDesc', 'Hisobingiz va tizimdagi muhim yangiliklar haqida email olish'),
    },
    {
      key: 'email_course',
      label: t('notifEmailCourse', 'Kurs va ta’lim yangiliklari'),
      desc: t('notifEmailCourseDesc', 'Yangi darslar va vazifalar e’lon qilinganda xabar berish'),
    },
    {
      key: 'email_materials',
      label: t('notifEmailMaterials', 'Yangi yuridik materiallar'),
      desc: t('notifEmailMaterialsDesc', 'Qonunchilik o‘zgarishlari va yangi shablonlar haqida bildirishnoma'),
    },
    {
      key: 'email_payments',
      label: t('notifEmailPayments', 'To‘lovlar va hisob-kitoblar'),
      desc: t('notifEmailPaymentsDesc', 'To‘lov holati va obuna muddatlari haqida bildirishnomalar'),
    },
    {
      key: 'email_security',
      label: t('notifEmailSecurity', 'Xavfsizlik ogohlantirishlari'),
      desc: t('notifEmailSecurityDesc', 'Parol o‘zgarishi va yangi kirishlar haqida tezkor ogohlantirish'),
    },
  ]

  const inAppItems: Array<{ key: keyof NotifSettings; label: string; desc: string }> = [
    {
      key: 'inapp_ai_results',
      label: t('notifInAppAI', 'AI tahlil natijalari'),
      desc: t('notifInAppAIDesc', 'IRAC, hujjat tahlili va kazuslar bo‘yicha AI javoblari'),
    },
    {
      key: 'inapp_case_results',
      label: t('notifInAppCase', 'Kazus va amaliyot natijalari'),
      desc: t('notifInAppCaseDesc', 'Tekshirilgan kazuslar va berilgan ballar'),
    },
    {
      key: 'inapp_virtual_court',
      label: t('notifInAppVirtualCourt', 'Virtual Sud bildirishnomalari'),
      desc: t('notifInAppVirtualCourtDesc', 'Sud majlisi taklifnomalari va qarorlar'),
    },
    {
      key: 'inapp_system',
      label: t('notifInAppSystem', 'Tizim bildirishnomalari'),
      desc: t('notifInAppSystemDesc', 'Platformaning umumiy e’lonlari va yangilanishlari'),
    },
  ]

  const unreadCount = inboxNotifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('notificationsTitle', 'Bildirishnomalar')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('notificationsSubtitle', 'Xabarlar tarixi va bildirishnoma yetkazish sozlamalari')}
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('inbox')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'inbox'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Xabarlar</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('preferences')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'preferences'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>Sozlamalar</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: INBOX */}
      {activeSubTab === 'inbox' && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Barcha xabarlar ({inboxNotifications.length})</span>
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Barchasini o‘qilgan deb belgilash</span>
              </button>
            )}
          </div>

          {inboxLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs">Yuklanmoqda...</p>
            </div>
          ) : inboxNotifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                Hozircha xabarlar mavjud emas
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                To‘lov tasdiqlari va tizim yangiliklari shu yerda ko‘rinadi
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxNotifications.map(notif => {
                const isPayment = notif.category === 'payment'
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && handleMarkRead(notif.id)}
                    className={`p-4 rounded-xl border transition-all ${
                      notif.read
                        ? 'bg-gray-50/50 dark:bg-zinc-800/30 border-gray-100 dark:border-zinc-800/60'
                        : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isPayment
                            ? notif.type === 'error'
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60'
                              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60'
                        }`}
                      >
                        {isPayment ? (
                          <CreditCard className="w-4 h-4" />
                        ) : notif.category === 'achievement' ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.created_at).toLocaleString('uz-UZ', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                          {notif.message}
                        </p>

                        {notif.action_url && (
                          <div className="mt-2.5">
                            <Link
                              href={notif.action_url}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>{notif.action_text || "Batafsil ko'rish"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-6">
          {/* 1. Email Notifications Group */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>{t('emailNotificationsGroup', 'Email bildirishnomalari')}</span>
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {emailItems.map(item => (
                <div
                  key={item.key}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    disabled={savingKey === item.key}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. In-App Notifications Group */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>{t('inAppNotificationsGroup', 'Ilova ichidagi bildirishnomalar')}</span>
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {inAppItems.map(item => (
                <div
                  key={item.key}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    disabled={savingKey === item.key}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
