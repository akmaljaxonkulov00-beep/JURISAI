'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

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

export default function NotificationPreferencesTab() {
  const { t } = useLanguage()

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

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">{t('loading', 'Yuklanmoqda...')}</p>
      </div>
    )
  }

  const emailItems: Array<{ key: keyof NotifSettings; label: string; desc: string }> = [
    {
      key: 'email_system',
      label: t('notifEmailSystem', 'Muhim tizim xabarlari'),
      desc: t(
        'notifEmailSystemDesc',
        'Hisobingiz va tizimdagi muhim yangiliklar haqida email olish'
      ),
    },
    {
      key: 'email_course',
      label: t('notifEmailCourse', 'Kurs va ta’lim yangiliklari'),
      desc: t('notifEmailCourseDesc', 'Yangi darslar va vazifalar e’lon qilinganda xabar berish'),
    },
    {
      key: 'email_materials',
      label: t('notifEmailMaterials', 'Yangi yuridik materiallar'),
      desc: t(
        'notifEmailMaterialsDesc',
        'Qonunchilik o‘zgarishlari va yangi shablonlar haqida bildirishnoma'
      ),
    },
    {
      key: 'email_payments',
      label: t('notifEmailPayments', 'To‘lovlar va hisob-kitoblar'),
      desc: t(
        'notifEmailPaymentsDesc',
        'To‘lov holati va obuna muddatlari haqida bildirishnomalar'
      ),
    },
    {
      key: 'email_security',
      label: t('notifEmailSecurity', 'Xavfsizlik ogohlantirishlari'),
      desc: t(
        'notifEmailSecurityDesc',
        'Parol o‘zgarishi va yangi kirishlar haqida tezkor ogohlantirish'
      ),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('notificationsTitle', 'Bildirishnoma sozlamalari')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('notificationsSubtitle', 'Qaysi kanallar orqali xabarlar olishingizni belgilang')}
          </p>
        </div>
        {successMsg && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {successMsg}
          </span>
        )}
      </div>

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
          <Bell className="w-4 h-4 text-indigo-600" />
          <span>{t('inAppNotificationsGroup', 'Sayt ichidagi bildirishnomalar (In-App)')}</span>
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
                  settings[item.key] ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'
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

      {/* 3. Push & Marketing */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>{t('pushNotificationsGroup', 'Brauzer push-bildirishnomalari')}</span>
        </h3>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          <div className="py-3.5 flex items-center justify-between gap-4 first:pt-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('notifPushEnabled', 'Brauzer push-bildirishnomalar')}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                {t(
                  'notifPushEnabledDesc',
                  'Brauzeringizda real vaqt rejimida bildirishnomalarni ko‘rsatish'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('push_enabled')}
              disabled={savingKey === 'push_enabled'}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.push_enabled ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.push_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 last:pb-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('notifMarketing', 'Maxsus takliflar va aksiyalar')}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                {t('notifMarketingDesc', 'Chegirmalar va aksiyalar haqida xabardor bo‘lish')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('marketing_emails')}
              disabled={savingKey === 'marketing_emails'}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.marketing_emails ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.marketing_emails ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
