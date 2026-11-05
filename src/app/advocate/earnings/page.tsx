'use client'

import React, { useState, useEffect } from 'react'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  Percent,
  FileText,
} from 'lucide-react'

export default function AdvocateEarningsPage() {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [earningsData, setEarningsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/advocates/earnings?year=${selectedYear}&month=${selectedMonth}`)
      const json = await res.json()
      if (json.success) {
        setEarningsData(json.data)
      }
    } catch (e) {
      console.error('Earnings fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEarnings()
  }, [selectedYear, selectedMonth])

  const months = [
    { value: 1, label: 'Yanvar' },
    { value: 2, label: 'Fevral' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Aprel' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Iyun' },
    { value: 7, label: 'Iyul' },
    { value: 8, label: 'Avgust' },
    { value: 9, label: 'Sentyabr' },
    { value: 10, label: 'Oktyabr' },
    { value: 11, label: 'Noyabr' },
    { value: 12, label: 'Dekabr' },
  ]

  const years = [2024, 2025, 2026, 2027]

  const grossEarnings = earningsData?.grossEarnings || 0
  const platformFee = earningsData?.platformFee || 0
  const netEarnings = earningsData?.netEarnings || 0
  const completedCount = earningsData?.completedAppointmentsCount || 0
  const pendingAmount = earningsData?.pendingPaymentsAmount || 0
  const refundedAmount = earningsData?.refundedAmount || 0
  const transactions = earningsData?.transactions || []
  const monthlyBreakdown = earningsData?.monthlyBreakdown || []

  // Max revenue for bar chart scaling
  const maxMonthlyRevenue = Math.max(1, ...monthlyBreakdown.map((m: any) => m.net))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="advocate" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header & Date Range Pickers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-600" />
              Advokatning Oylik Daromadi va Moliya Tizimi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Haqiqiy to‘lovlar (payment records) asosida davr bo‘yicha avtomatik hisoblangan sof daromad
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  {y}-yil
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 Key Financial Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Sof Daromad (Net) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-emerald-100 tracking-wider">
                Sof Daromad (Net)
              </span>
              <DollarSign className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight font-mono">
                {netEarnings.toLocaleString('uz-UZ')} <span className="text-lg">UZS</span>
              </h2>
              <p className="text-xs text-emerald-100 mt-1">
                Platforma komissiyasi (10%) chegirilgandan keyin
              </p>
            </div>
          </div>

          {/* Jami Daromad (Gross) */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Jami Tushum (Gross)
              </span>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
                {grossEarnings.toLocaleString('uz-UZ')} <span className="text-lg font-normal text-gray-400">UZS</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tanlangan oyda mijozlar to‘lagan umumiy summa
              </p>
            </div>
          </div>

          {/* Platforma Komissiyasi */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Platforma Komissiyasi
              </span>
              <Percent className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-amber-600 font-mono">
                {platformFee.toLocaleString('uz-UZ')} <span className="text-lg font-normal text-gray-400">UZS</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Operatsion va xavfsiz to‘lov ta’minoti xarajati (10%)
              </p>
            </div>
          </div>

          {/* Yakunlangan Konsultatsiyalar */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Yakunlangan Konsultatsiyalar</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {completedCount} <span className="text-sm font-normal text-gray-400">ta sessiya</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Kutilayotgan to‘lovlar */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Kutilayotgan to‘lovlar</p>
              <p className="text-2xl font-extrabold text-amber-500 mt-1 font-mono">
                {pendingAmount.toLocaleString('uz-UZ')} <span className="text-xs font-normal">UZS</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Qaytarilgan to‘lovlar */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Qaytarilgan to‘lovlar (Refund)</p>
              <p className="text-2xl font-extrabold text-red-500 mt-1 font-mono">
                {refundedAmount.toLocaleString('uz-UZ')} <span className="text-xs font-normal">UZS</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Oylar bo‘yicha daromad grafigi */}
        {monthlyBreakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Oylar bo‘yicha daromad dinamikasi ({selectedYear}-yil)
                </h3>
                <p className="text-xs text-gray-500">
                  Har oy bo‘yicha advokatning hisoblangan sof daromadi taqsimoti
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Avtomatik oylik hisobot
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 items-end h-44">
              {monthlyBreakdown.map((m: any, idx: number) => {
                const heightPercent = maxMonthlyRevenue > 0 ? Math.round((m.net / maxMonthlyRevenue) * 100) : 0
                const isCurrent = m.monthIndex === selectedMonth
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] text-gray-400 font-mono hidden sm:block">
                      {m.net > 0 ? `${Math.round(m.net / 1000)}k` : '0'}
                    </span>
                    <div
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                      className={`w-full rounded-t-lg transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                          : 'bg-gray-200 dark:bg-gray-800 hover:bg-emerald-400'
                      }`}
                    />
                    <span className={`text-[10px] font-semibold ${isCurrent ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                      {m.label.slice(0, 3)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tranzaksiyalar Tarixi */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Tranzaksiyalar va To‘lovlar Tarixi
              </h3>
              <p className="text-xs text-gray-500">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear} bo‘yicha to‘lovlar
              </p>
            </div>
            <span className="text-xs text-gray-400">
              Jami tranzaksiyalar: {transactions.length} ta
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 border border-dashed rounded-2xl">
              Ushbu davrda rasmiylashtirilgan to‘lovlar mavjud emas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Mijoz / Fuqaro</th>
                    <th className="pb-3 font-semibold">Xizmat turi</th>
                    <th className="pb-3 font-semibold">Tranzaksiya ID</th>
                    <th className="pb-3 font-semibold">Jami to‘lov</th>
                    <th className="pb-3 font-semibold text-right">Advokat ulushi (Sof)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.map((tx: any) => {
                    const gross = Number(tx.amount)
                    const net = Math.round(gross * 0.9)
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3.5 text-gray-500">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('uz-UZ') : tx.appointment_date}
                        </td>
                        <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                          {tx.citizen_name || 'Fuqaro'}
                        </td>
                        <td className="py-3.5 text-gray-600 dark:text-gray-300">
                          {tx.service_title || 'Yuridik konsultatsiya'}
                        </td>
                        <td className="py-3.5 font-mono text-gray-400">
                          {tx.payment_reference || `TXN-${tx.id.slice(0, 8)}`}
                        </td>
                        <td className="py-3.5 font-medium text-gray-700 dark:text-gray-300">
                          {gross.toLocaleString('uz-UZ')} UZS
                        </td>
                        <td className="py-3.5 text-right font-bold text-emerald-600 font-mono">
                          +{net.toLocaleString('uz-UZ')} UZS
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
