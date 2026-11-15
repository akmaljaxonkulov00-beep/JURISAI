'use client'

import React, { useState, useEffect } from 'react'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle,
  Shield,
  CreditCard,
  Bell,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/app/providers'

export default function CitizenSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Toshkent')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName((user as any).name || (user as any).full_name || '')
      setEmail(user.email || '')
      setPhone((user as any).phone || '+998 90 ')
      if ((user as any).city) setCity((user as any).city)
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          full_name: fullName,
          phone,
          city,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg('Profil ma’lumotlaringiz muvaffaqiyatli saqlandi!')
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setErrorMsg(json.error || 'Saqlashda xatolik yuz berdi')
      }
    } catch {
      setErrorMsg('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="text-blue-600" size={24} />
            Shaxsiy Profil va Sozlamalar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fuqaro sifatida ma’lumotlaringizni tahrirlash, aloqa rekvizitlari va xabarnomalar boshqaruvi
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Asosiy ma'lumotlar */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              Asosiy Ma‘lumotlar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  To‘liq Ism-Familiyangiz *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Alisher Fayzullayev"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Manzilingiz (Login)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60 text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Telefon Raqamingiz *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Shahar yoki Viloyatingiz *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Toshkent shahri"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bildirishnomalar */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              Bildirishnomalar va Xabardor Qilish
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={e => setEmailNotifications(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Yuridik savolimga javob berilganda emailga xabar yuborish
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={e => setSmsNotifications(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Advokat konsultatsiyasi tasdiqlanganda SMS xabarnoma olish
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni Saqlash'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
