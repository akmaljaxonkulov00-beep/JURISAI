'use client'

import React, { useState, useEffect } from 'react'
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import { authService } from '@/services/supabase-auth'

interface FormData {
  firstName: string
  lastName: string
  middleName: string
  email: string
  phone: string
  birthDate: string
}

export default function PersonalInfoTab() {
  const { t } = useLanguage()
  const { user, updateProfile } = useAuth()

  const [initialData, setInitialData] = useState<FormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    birthDate: '',
  })

  const [formData, setFormData] = useState<FormData>(initialData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      try {
        const res = await fetch('/api/user/profile-full', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            const loaded: FormData = {
              firstName: d.firstName || '',
              lastName: d.lastName || '',
              middleName: d.middleName || '',
              email: d.email || user?.email || '',
              phone: d.phone || user?.phone || '',
              birthDate: d.birthDate ? d.birthDate.split('T')[0] : '',
            }
            setInitialData(loaded)
            setFormData(loaded)
          }
        }
      } catch (err) {
        console.error('Failed to load profile for editing:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // 1. Check if email was modified
      if (formData.email !== initialData.email && formData.email.trim().length > 0) {
        const emailRes = await authService.changeEmail(formData.email.trim())
        if (!emailRes.success) {
          setErrorMsg(emailRes.error || t('saveError', 'Saqlashda xatolik yuz berdi'))
          setSaving(false)
          return
        }
      }

      // 2. Save profile fields to backend
      const res = await fetch('/api/user/profile-full', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim()
        await updateProfile({
          name: fullName,
          phone: formData.phone,
        })
        setInitialData(formData)
        setSuccessMsg(t('savedSuccessfully', 'O‘zgarishlar muvaffaqiyatli saqlandi!'))
        setTimeout(() => setSuccessMsg(null), 3500)
      } else {
        setErrorMsg(json.error || t('saveError', 'Saqlashda xatolik yuz berdi'))
      }
    } catch {
      setErrorMsg(t('saveError', 'Saqlashda xatolik yuz berdi'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormData(initialData)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">{t('loading', 'Yuklanmoqda...')}</p>
      </div>
    )
  }

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData)

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('personalInfoTitle', "Shaxsiy ma'lumotlar")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {t(
            'personalInfoSubtitle',
            'Hisobingizdagi shaxsiy va ta’limga oid ma’lumotlarni tahrirlang'
          )}
        </p>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('firstName', 'Ism')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder={t('firstName', 'Ism')}
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('lastName', 'Familiya')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder={t('lastName', 'Familiya')}
              />
            </div>
          </div>

          {/* Middle Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('middleName', 'Otasining ismi')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder={t('middleName', 'Otasining ismi')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('email', 'Elektron pochta')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="user@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('phone', 'Telefon')}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              {t('birthDate', "Tug'ilgan sana")}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center gap-3 border-t border-gray-100 dark:border-zinc-800">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-xs"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('saving', 'Saqlanmoqda...')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('saveChanges', 'Sozlamalarni saqlash')}</span>
              </>
            )}
          </button>

          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('cancel', 'Bekor qilish')}</span>
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
