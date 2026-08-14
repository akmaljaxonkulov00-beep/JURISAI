'use client'

// ═══════════════════════════════════════════════════════════════════════════
// AdminUsageLimitsManager — AI foydalanish limitlarini boshqarish
// 1) Tarif limitlari (Bepul/Standart/Pro — har bir funksiya bo'yicha)
// 2) Per-user override — ayrim foydalanuvchilarga alohida limit berish
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { Gauge, Save, RefreshCw, Trash2, Plus, X, Infinity as InfinityIcon } from 'lucide-react'

const FEATURES: { key: string; label: string }[] = [
  { key: 'ai_chat', label: "AI chat (huquqiy so'rov)" },
  { key: 'irac', label: 'IRAC tahlil' },
  { key: 'document_generate', label: 'Hujjat generator' },
  { key: 'document_analysis', label: 'Hujjat tahlili' },
  { key: 'virtual_court', label: 'Virtual sud' },
  { key: 'decision_tree', label: 'Qarorlar daraxti (AI)' },
  { key: 'speech_stt', label: 'Ovozli yozuv (STT)' },
  { key: 'scenario', label: 'Senariy generator' },
]

interface PlanLimits {
  id: string
  name: string
  price: number
  limits: Record<string, number>
}

interface UserOverride {
  id: string
  user_id: string
  email: string
  feature: string
  monthly_limit: number
  note: string
  created_at: string
}

const inputCls =
  'w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AdminUsageLimitsManager() {
  const [plans, setPlans] = useState<PlanLimits[]>([])
  const [overrides, setOverrides] = useState<UserOverride[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Per-user override form
  const [showAddOverride, setShowAddOverride] = useState(false)
  const [overrideForm, setOverrideForm] = useState({
    userId: '',
    email: '',
    feature: 'ai_chat',
    monthlyLimit: 50,
    note: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/usage-limits', { cache: 'no-store' })
      const result = await res.json()
      if (result.success && result.data) {
        setPlans(result.data.plans || [])
        setOverrides(result.data.overrides || [])
      } else {
        setError(result.error || 'Yuklashda xatolik')
      }
    } catch {
      setError('Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setPlanLimit = (planId: string, feature: string, value: number) => {
    setPlans(prev =>
      prev.map(p => (p.id === planId ? { ...p, limits: { ...p.limits, [feature]: value } } : p))
    )
  }

  const savePlans = async () => {
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/admin/usage-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plans: plans.map(p => ({ id: p.id, limits: p.limits })),
        }),
      })
      const result = await res.json()
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(result.error || 'Saqlashda xatolik')
      }
    } catch {
      setError('Saqlashda xatolik')
    }
  }

  const addOverride = async () => {
    if (!overrideForm.userId.trim()) {
      setError('Foydalanuvchi ID kiritilishi shart')
      return
    }
    setError(null)
    try {
      const res = await fetch('/api/admin/usage-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideForm),
      })
      const result = await res.json()
      if (result.success) {
        setShowAddOverride(false)
        setOverrideForm({
          userId: '',
          email: '',
          feature: 'ai_chat',
          monthlyLimit: 50,
          note: '',
        })
        await load()
      } else {
        setError(result.error || "Qo'shishda xatolik")
      }
    } catch {
      setError("Qo'shishda xatolik")
    }
  }

  const deleteOverride = async (id: string) => {
    if (!confirm("Bu foydalanuvchi limitini o'chirishni tasdiqlaysizmi?")) return
    try {
      await fetch(`/api/admin/usage-limits?id=${id}`, { method: 'DELETE' })
      await load()
    } catch {}
  }

  const fmtLimit = (n: number | undefined) =>
    n === undefined || n === null ? '' : n === -1 ? 'Cheksiz' : `${n} ta`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-500" /> AI limitlari boshqaruvi
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={savePlans}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {saved ? (
              '✅ Saqlandi'
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Limitlarni saqlash
              </>
            )}
          </button>
          <button
            onClick={() => setShowAddOverride(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Foydalanuvchi limiti
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* ── TARIF LIMITLARI ── */}
      <div className="card-default rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
            Tarif limitlari (oylik) —{' '}
            <span className="text-gray-400 font-normal">-1 = Cheksiz</span>
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-700">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Funksiya
                </th>
                {plans.map(p => (
                  <th
                    key={p.id}
                    className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(f => (
                <tr key={f.key} className="border-b border-gray-50 dark:border-zinc-800/60">
                  <td className="px-4 py-2 font-medium text-gray-700 dark:text-zinc-300">
                    {f.label}
                  </td>
                  {plans.map(p => (
                    <td key={p.id} className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={p.limits?.[f.key] ?? -1}
                        onChange={e => setPlanLimit(p.id, f.key, parseInt(e.target.value) || -1)}
                        className="w-20 text-center text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 px-1 py-1"
                        title={`${p.name} — ${f.label}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PER-USER OVERRIDE RO'YXATI ── */}
      <div className="card-default rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
            Foydalanuvchi limitlari (shaxsiy) — {overrides.length} ta
          </h4>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
          {overrides.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500 dark:text-zinc-400 text-center">
              Hozircha shaxsiy limitlar yo'q. Barcha foydalanuvchilar tarif limitlaridan
              foydalanadi.
            </p>
          )}
          {overrides.map(o => (
            <div
              key={o.id}
              className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {o.email || o.user_id}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded">
                    {FEATURES.find(f => f.key === o.feature)?.label || o.feature}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {fmtLimit(o.monthly_limit)}/oy
                  </span>
                </div>
                {o.note && (
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                    {o.note}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteOverride(o.id)}
                className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                title="O'chirish"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── ADD OVERRIDE MODAL ── */}
      {showAddOverride && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddOverride(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Foydalanuvchi limiti
              </h3>
              <button
                onClick={() => setShowAddOverride(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                  Foydalanuvchi ID * (registered_users.id yoki auth.users.id)
                </label>
                <input
                  value={overrideForm.userId}
                  onChange={e => setOverrideForm(f => ({ ...f, userId: e.target.value }))}
                  placeholder="UUID yoki email ID"
                  className={inputCls}
                />
              </div>
              <input
                value={overrideForm.email}
                onChange={e => setOverrideForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email (ixtiyoriy)"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Funksiya
                  </label>
                  <select
                    value={overrideForm.feature}
                    onChange={e => setOverrideForm(f => ({ ...f, feature: e.target.value }))}
                    className={inputCls}
                  >
                    {FEATURES.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Oylik limit (-1 = cheksiz)
                  </label>
                  <input
                    type="number"
                    value={overrideForm.monthlyLimit}
                    onChange={e =>
                      setOverrideForm(f => ({
                        ...f,
                        monthlyLimit: parseInt(e.target.value) || -1,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <input
                value={overrideForm.note}
                onChange={e => setOverrideForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Izoh (masalan: maxsus mijoz)"
                className={inputCls}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddOverride(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                onClick={addOverride}
                disabled={!overrideForm.userId.trim()}
                className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
