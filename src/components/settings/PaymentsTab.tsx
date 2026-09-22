'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  Receipt,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import Link from 'next/link'

interface PaymentRecord {
  id: string
  plan: string
  amount: number
  status: 'approved' | 'pending' | 'rejected'
  receipt_image?: string
  receiptImage?: string
  created_at: string
  createdAt?: string
  billing_cycle?: string
}

export default function PaymentsTab() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  useEffect(() => {
    async function loadPayments() {
      setLoading(true)
      try {
        const res = await fetch('/api/payments', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.payments) {
            setPayments(json.data.payments)
          }
        }
      } catch (err) {
        console.error('Failed to load payments history:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  const currentPlan = user?.subscription_plan || 'free'
  const isPro = currentPlan.toLowerCase() === 'pro'
  const expiresAt = user?.subscription_expires_at

  const approvedPayments = payments.filter(p => p.status === 'approved')
  const totalApprovedAmount = approvedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">{t('loading', 'Yuklanmoqda...')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('paymentsTitle', "To'lovlar va Obuna")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('paymentsSubtitle', 'Joriy tarifingiz, balans va tranzaksiyalar tarixi')}
          </p>
        </div>
        <Link
          href="/premium"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('upgradeToPro', 'Premiumga o‘tish')}</span>
        </Link>
      </div>

      {/* Plan & Balance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Crown className="w-24 h-24" />
          </div>
          <span className="text-xs uppercase tracking-wider text-blue-100 font-semibold block mb-1">
            {t('currentPlan', 'Joriy tarif')}
          </span>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-2xl font-bold capitalize">
              {isPro ? t('planPro', 'Professional (Pro)') : t('planFree', 'Bepul (Free)')}
            </h3>
            {isPro && <ShieldCheck className="w-5 h-5 text-amber-300" />}
          </div>
          <p className="text-xs text-blue-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {expiresAt
              ? `${t('planExpiresOn', 'Amal qilish muddati')}: ${new Date(expiresAt).toLocaleDateString()}`
              : t('planActive', 'Cheksiz davom etuvchi')}
          </p>
        </div>

        {/* Total Verified Balance */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold block mb-1">
              {t('totalBalance', 'Tasdiqlangan balans')}
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalApprovedAmount > 0 ? `${totalApprovedAmount.toLocaleString()} UZS` : '0 UZS'}
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {approvedPayments.length} ta tasdiqlangan to‘lov
          </p>
        </div>

        {/* Pending Orders Count */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold block mb-1">
              {t('paymentStatusPending', 'Tekshirilmoqda')}
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {payments.filter(p => p.status === 'pending').length}
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Moderator ko‘rib chiqishi kutilmoqda
          </p>
        </div>
      </div>

      {/* Payments History List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span>{t('paymentHistory', "To'lovlar tarixi")}</span>
        </h3>

        {payments.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-zinc-500">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              {t('noPaymentsYet', "Hozircha to'lovlar mavjud emas.")}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
              Premium imkoniyatlaridan to‘liq foydalanish uchun tarif rejasini faollashtiring.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {payments.map(item => {
              const receipt = item.receipt_image || item.receiptImage
              const dateStr = item.created_at || item.createdAt
              return (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : item.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
                      {item.status === 'pending' && <Clock className="w-4 h-4 animate-pulse" />}
                      {item.status === 'rejected' && <XCircle className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize truncate">
                          {item.plan} tarifi
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : item.status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {item.status === 'approved' && t('paymentStatusApproved', 'Tasdiqlangan')}
                          {item.status === 'pending' && t('paymentStatusPending', 'Tekshirilmoqda')}
                          {item.status === 'rejected' && t('paymentStatusRejected', 'Rad etilgan')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {dateStr ? new Date(dateStr).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(item.amount).toLocaleString()} UZS
                    </span>

                    {receipt && (
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title={t('viewReceipt', 'Chekni ko‘rish')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-4 border border-gray-200 dark:border-zinc-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-zinc-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('paymentReceipt', 'Chek')}
              </h4>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl">
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
