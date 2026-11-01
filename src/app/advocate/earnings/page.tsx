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
} from 'lucide-react'

export default function AdvocateEarningsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEarnings() {
      try {
        const res = await fetch('/api/appointments')
        const json = await res.json()
        if (json.success && json.data) {
          const paid = json.data.filter((a: any) => a.payment_status === 'paid')
          setAppointments(paid)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadEarnings()
  }, [])

  const grossEarnings = appointments.reduce((sum, a) => sum + Number(a.amount), 0)
  const platformFee = Math.round(grossEarnings * 0.1) // 10% komissiya
  const netEarnings = grossEarnings - platformFee

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="advocate" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Advokat daromadlari va moliya hisoboti
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            O‘tkazilgan konsultatsiyalar uchun to‘langan mablag‘lar, platforma komissiyasi va yechib olish balansi
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
            <span className="text-xs text-gray-500 font-medium">Jami tushum (Gross)</span>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">
              {grossEarnings.toLocaleString('uz-UZ')} UZS
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
            <span className="text-xs text-gray-500 font-medium">Platforma komissiyasi (10%)</span>
            <p className="text-2xl font-extrabold text-amber-600 font-mono">
              {platformFee.toLocaleString('uz-UZ')} UZS
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
            <span className="text-xs text-gray-500 font-medium">Sof advokat daromadi (Net)</span>
            <p className="text-2xl font-extrabold text-emerald-600 font-mono">
              {netEarnings.toLocaleString('uz-UZ')} UZS
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Konsultatsiyalar bo‘yicha hisob-kitoblar
            </h2>
            <span className="text-xs text-gray-400">Valyuta: UZS (O‘zbekiston so‘mi)</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Hozircha yakunlangan to‘lovlar yo‘q
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {appointments.map(a => {
                const total = Number(a.amount)
                const share = Math.round(total * 0.9)
                return (
                  <div
                    key={a.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {a.service_title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Mijoz: {a.citizen_name} • Tranzaksiya: {a.payment_reference || 'CLK-90214'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {a.appointment_date} | {a.appointment_time}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600 block font-mono">
                        +{share.toLocaleString('uz-UZ')} UZS
                      </span>
                      <span className="text-[10px] text-gray-400">
                        (To‘lov: {total.toLocaleString('uz-UZ')} UZS — 10% platforma)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
