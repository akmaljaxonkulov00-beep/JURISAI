'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  FileText,
  DollarSign,
  Zap,
  Sparkles,
  ShoppingBag,
  Check,
} from 'lucide-react'

export default function CitizenPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadPaymentsData() {
      try {
        const headers = await getAuthHeaders()
        const [uRes, aRes] = await Promise.all([
          fetch('/api/citizen/usage', { headers, credentials: 'include' }).then(r => r.json()).catch(() => ({})),
          fetch('/api/appointments', { headers, credentials: 'include' }).then(r => r.json()).catch(() => ({})),
        ])

        if (uRes?.success && uRes?.data) setUsage(uRes.data)
        if (aRes?.success && aRes?.data) {
          const paidApps = aRes.data.filter((a: any) => a.payment_status === 'paid' || a.amount > 0)
          setTransactions(paidApps)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadPaymentsData()
  }, [])

  const handleBuyPackage = async (packageType: 'single' | 'pack5' | 'monthly') => {
    setPurchasing(packageType)
    setSuccessMsg(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/citizen/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({ packageType, provider: 'click' }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(data.message)
        // Yangilangan limitlarni olish
        const uRes = await fetch('/api/citizen/usage', { headers, credentials: 'include' }).then(r => r.json())
        if (uRes.success) setUsage(uRes.data)
      } else {
        alert(data.error || 'Xatolik yuz berdi')
      }
    } catch {
      alert('Tarmoq xatosi yuz berdi')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Fuqaro Balansi va Savol Kreditlari
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Savol berish paketlari, bepul limitlar va konsultatsiya to‘lovlari
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Current Balance & Quota Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <span className="text-xs font-semibold text-gray-400 uppercase">Joriy Oylik Bepul Limit</span>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
              {usage?.remainingFree ?? 2} <span className="text-sm text-gray-400 font-normal">/ {usage?.freeQuestionsLimit ?? 2} ta</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">Yangi oyda avtomatik yangilanadi</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <span className="text-xs font-semibold text-gray-400 uppercase">Pullik Savol Kreditlari</span>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
              {usage?.paidCredits ?? 0} <span className="text-sm text-gray-400 font-normal">ta</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">Muddatsiz saqlanadi</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <span className="text-xs font-semibold text-gray-400 uppercase">Obuna Holati</span>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {usage?.subscriptionPlan === 'monthly' ? 'Faol Oylik' : 'Standart'}
            </p>
            <p className="text-xs text-gray-500 mt-2">100% xavfsiz to‘lov kafolati</p>
          </div>
        </div>

        {/* ── SAVOL KREDITLARI VA PAKETLAR ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Savol Kreditlari Xarid Qilish
            </h2>
            <span className="text-xs text-gray-400">Click & Payme integratsiyasi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1 ta savol */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all">
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  Oddiy
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">1 ta Qo‘shimcha Savol</h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  9 900 <span className="text-sm font-normal text-gray-500">UZS</span>
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Bitta to‘liq yuridik savol
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> AI + Advokat tahlili
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuyPackage('single')}
                disabled={purchasing !== null}
                className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
              >
                {purchasing === 'single' ? 'Yuklanmoqda...' : 'Sotib olish'}
              </button>
            </div>

            {/* 5 ta savol to'plami */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-purple-500 shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                20% TEJAMKOR
              </div>
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  Eng ommabop
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">5 ta Savol Paketi</h3>
                <p className="text-2xl font-black text-purple-600">
                  39 900 <span className="text-sm font-normal text-gray-500">UZS</span>
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> 5 ta to‘liq yuridik savol
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Muddatsiz saqlanadi
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> 1 ta savol = 7 980 UZS
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuyPackage('pack5')}
                disabled={purchasing !== null}
                className="mt-6 w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {purchasing === 'pack5' ? 'Yuklanmoqda...' : 'Paketni xarid qilish'}
              </button>
            </div>

            {/* Oylik obuna */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-all">
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  Oylik VIP
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Oylik Cheksiz Paket</h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  49 900 <span className="text-sm font-normal text-gray-500">UZS/oy</span>
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> 15 ta to‘liq yuridik savol
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Ustuvor navbat bilan javob
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Advokat bilan tezkor chat
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuyPackage('monthly')}
                disabled={purchasing !== null}
                className="mt-6 w-full py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all"
              >
                {purchasing === 'monthly' ? 'Yuklanmoqda...' : 'Obuna bo‘lish'}
              </button>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              Barcha to‘lovlar O‘zbekiston Respublikasi bank xavfsizlik protokollari (Click Evolution va Payme) orqali himoyalangan.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
