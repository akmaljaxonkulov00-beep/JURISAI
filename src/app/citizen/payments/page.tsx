'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  FileText,
  DollarSign,
} from 'lucide-react'

export default function CitizenPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      try {
        const res = await fetch('/api/appointments')
        const json = await res.json()
        if (json.success && json.data) {
          // Map appointments with payment info
          const paidApps = json.data.filter((a: any) => a.payment_status === 'paid')
          setTransactions(paidApps)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadTransactions()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            To‘lovlar va tranzaksiyalar tarixi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Advokat konsultatsiyalari uchun amalga oshirilgan barcha to‘lovlar va cheklar
          </p>
        </div>

        {/* Security badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              Barcha to‘lovlar O‘zbekiston Respublikasi bank xavfsizlik protokollari (Click Evolution va Payme) orqali himoyalangan.
            </span>
          </div>
          <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-200 dark:bg-emerald-900/60 px-2.5 py-1 rounded-md">
            UZS Kafolati
          </span>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              To‘langan konsultatsiyalar ro‘yxati
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To‘lovlar tarixi mavjud emas
              </p>
              <p className="text-xs text-gray-400">
                Konsultatsiyaga yozilib to‘lov qilganingizda cheklar bu yerda aks etadi.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {tx.service_title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Advokat: {tx.advocate_name} • Chek №: {tx.payment_reference || 'CLK-84920'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {tx.appointment_date} | {tx.appointment_time}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-6 border-gray-100 dark:border-gray-800">
                    <span className="text-base font-extrabold text-gray-900 dark:text-white block font-mono">
                      {Number(tx.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3 h-3" /> Muvaffaqiyatli
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
