'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  DollarSign,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Package,
  Calendar,
  Lock,
} from 'lucide-react'

export default function AdminCitizenMonetizationManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Settings
  const [freeQuestionsPerMonth, setFreeQuestionsPerMonth] = useState<number>(2)
  const [singleQuestionPrice, setSingleQuestionPrice] = useState<number>(9900)
  const [pack5QuestionsPrice, setPack5QuestionsPrice] = useState<number>(39900)
  const [monthlyUnlimitedPrice, setMonthlyUnlimitedPrice] = useState<number>(49900)

  // Stats
  const [stats, setStats] = useState<any>({
    totalQuestions: 0,
    paidPurchasesCount: 0,
  })

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/monetization')
      const json = await res.json()
      if (json.success && json.settings) {
        setFreeQuestionsPerMonth(json.settings.free_questions_per_month ?? 2)
        setSingleQuestionPrice(json.settings.single_question_price ?? 9900)
        setPack5QuestionsPrice(json.settings.pack5_questions_price ?? 39900)
        setMonthlyUnlimitedPrice(json.settings.monthly_unlimited_price ?? 49900)
        if (json.stats) setStats(json.stats)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/admin/monetization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeQuestionsPerMonth,
          singleQuestionPrice,
          pack5QuestionsPrice,
          monthlyUnlimitedPrice,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3500)
      } else {
        setErrorMessage(json.error || 'Sozlamalarni saqlashda xatolik')
      }
    } catch {
      setErrorMessage('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Fuqarolar Savollari va Monetizatsiya Sozlamalari
        </h2>
        <p className="text-xs text-gray-500">
          Fuqarolar uchun oylik bepul savol limitlari, qo‘shimcha kredit narxlari va obuna tariflarini boshqarish
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          Monetizatsiya sozlamalari muvaffaqiyatli saqlandi!
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Fuqarolar yo‘llagan jami savollar</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              {stats.totalQuestions} ta
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Sotib olingan paketlar / obunalar</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {stats.paidPurchasesCount} ta
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Oyiga bepul kvota</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">
              {freeQuestionsPerMonth} ta / citizen
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
              Bepul limit parametrlari
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Har bir fuqaro uchun oylik bepul savollar soni
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={freeQuestionsPerMonth}
                onChange={e => setFreeQuestionsPerMonth(Number(e.target.value))}
                className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold font-mono"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Kalendar oy almashganda har bir fuqaroning oylik bepul hisoblagichi avtomatik yangilanadi.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
              Pullik savollar va paketlar narxlari (UZS)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  1 ta qo‘shimcha savol (UZS)
                </label>
                <input
                  type="number"
                  step={500}
                  value={singleQuestionPrice}
                  onChange={e => setSingleQuestionPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold font-mono text-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  5 ta savol paketi (UZS)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={pack5QuestionsPrice}
                  onChange={e => setPack5QuestionsPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold font-mono text-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  1 oylik cheksiz savol obunasi (UZS)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={monthlyUnlimitedPrice}
                  onChange={e => setMonthlyUnlimitedPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold font-mono text-emerald-600"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saqlanmoqda...' : 'Monetizatsiya sozlamalarini saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
