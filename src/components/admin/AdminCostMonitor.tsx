'use client'

// ═══════════════════════════════════════════════════════════════════════════
// AdminCostMonitor — AI xarajat monitoringi
// usage_logs asosida: funksiya va tarif bo'yicha chaqiruvlar soni + taxminiy
// xarajat (Groq narxlari bo'yicha hisoblangan).
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, RefreshCw, DollarSign, Users, Zap } from 'lucide-react'

interface CostData {
  period_days: number
  totals: {
    calls: number
    tokens: number
    est_cost_usd: number
    est_cost_uzs: number
    active_users: number
    avg_cost_per_user_usd: number
  }
  per_feature: { feature: string; label: string; count: number; cost: number }[]
  per_plan: { plan: string; label: string; count: number; cost: number }[]
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300',
  standart: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  pro: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
}

export default function AdminCostMonitor() {
  const [data, setData] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cost-monitoring?days=${days}`, { cache: 'no-store' })
      const result = await res.json()
      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError(result.error || 'Yuklashda xatolik')
      }
    } catch {
      setError('Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const fmtUZS = (n: number) => n.toLocaleString('uz-UZ') + " so'm"
  const fmtUSD = (n: number) => '$' + n.toFixed(4)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" /> AI xarajat monitoringi
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
            className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>So'nggi 7 kun</option>
            <option value={30}>So'nggi 30 kun</option>
            <option value={90}>So'nggi 90 kun</option>
          </select>
          <button
            onClick={load}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <>
          {/* Jami kartalar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-default rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-xs mb-2">
                <Zap className="w-4 h-4" /> Jami chaqiruvlar
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.totals.calls.toLocaleString('uz-UZ')}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {data.totals.tokens.toLocaleString('uz-UZ')} token
              </p>
            </div>
            <div className="card-default rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-xs mb-2">
                <DollarSign className="w-4 h-4" /> Taxminiy xarajat
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmtUZS(data.totals.est_cost_uzs)}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">{fmtUSD(data.totals.est_cost_usd)}</p>
            </div>
            <div className="card-default rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-xs mb-2">
                <Users className="w-4 h-4" /> Faol foydalanuvchilar
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.totals.active_users.toLocaleString('uz-UZ')}
              </p>
            </div>
            <div className="card-default rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-xs mb-2">
                <TrendingUp className="w-4 h-4" /> 1 foydalanuvchi / davr
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmtUZS(Math.round(data.totals.avg_cost_per_user_usd * 12500))}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {fmtUSD(data.totals.avg_cost_per_user_usd)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funksiya bo'yicha */}
            <div className="card-default rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Funksiya bo'yicha
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-700">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                        Funksiya
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                        Chaqiruvlar
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                        Xarajat
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.per_feature.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">
                          Bu davrda iste'mol yozuvlari yo'q
                        </td>
                      </tr>
                    )}
                    {data.per_feature.map(f => (
                      <tr
                        key={f.feature}
                        className="border-b border-gray-50 dark:border-zinc-800/60"
                      >
                        <td className="px-4 py-2 font-medium text-gray-700 dark:text-zinc-300">
                          {f.label}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-zinc-400">
                          {f.count.toLocaleString('uz-UZ')}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-white">
                          {fmtUZS(Math.round(f.cost * 12500))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tarif bo'yicha */}
            <div className="card-default rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Tarif bo'yicha
                </h4>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
                {data.per_plan.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">
                    Bu davrda ma'lumot yo'q
                  </p>
                )}
                {data.per_plan.map(p => (
                  <div key={p.plan} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${PLAN_COLORS[p.plan] || PLAN_COLORS.free}`}
                      >
                        {p.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-zinc-400">
                        {p.count.toLocaleString('uz-UZ')} chaqiruv
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {fmtUZS(Math.round(p.cost * 12500))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            * Xarajat — Groq narxlari bo'yicha taxmin (openai/gpt-oss-120b: $0.15/1M kirish,
            $0.60/1M chiqish token; whisper-large-v3: $0.111/soat). Haqiqiy xarajat Groq billing
            dashboard'ida farq qilishi mumkin.
          </p>
        </>
      )}
    </div>
  )
}
