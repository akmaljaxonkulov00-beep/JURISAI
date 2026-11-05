'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Award,
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

export default function LawStudentWalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [rewards, setRewards] = useState<any[]>([])
  const [payoutRequests, setPayoutRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Payout Request Form State
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState<number>(100000)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  const loadWalletData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/law-student/wallet')
      const json = await res.json()
      if (json.success) {
        setWallet(json.wallet)
        setRewards(json.rewards || [])
        setPayoutRequests(json.payoutRequests || [])
      }
    } catch (e) {
      console.error('Wallet fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  }, [])

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only digits, format with spaces: 8600 0000 0000 0000
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
  }

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)

    const cleanCard = cardNumber.replace(/\s+/g, '')
    if (cleanCard.length < 16) {
      setPayoutError('16 xonali plastik karta raqamini to‘liq kiriting')
      return
    }

    if (!cardHolder.trim()) {
      setPayoutError('Karta egasining F.I.Sh. kiritilishi shart')
      return
    }

    if (payoutAmount < 100000) {
      setPayoutError('Minimal yechib olish miqdori: 100 000 so‘m')
      return
    }

    if (payoutAmount > (wallet?.balance || 0)) {
      setPayoutError('Hamyoningizda yetarli mablag‘ mavjud emas')
      return
    }

    setSubmittingPayout(true)
    try {
      const res = await fetch('/api/law-student/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payoutAmount,
          cardNumber: cleanCard,
          cardHolderName: cardHolder,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setPayoutSuccess(true)
        setTimeout(() => {
          setShowPayoutModal(false)
          setPayoutSuccess(false)
          setCardNumber('')
          setCardHolder('')
          loadWalletData()
        }, 1500)
      } else {
        setPayoutError(json.error || 'So‘rov yuborishda xatolik yuz berdi')
      }
    } catch {
      setPayoutError('Server bilan ulanishda xatolik')
    } finally {
      setSubmittingPayout(false)
    }
  }

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> To‘landi
          </span>
        )
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> Tasdiqlangan
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Rad etildi
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Kutilmoqda
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="law_student" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-emerald-600" />
              Talaba Shaxsiy Hamyoni va Mukofotlar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Yuqori sifatli yuridik javoblaringiz uchun hisoblangan mukofotlar va to‘lovlar
            </p>
          </div>

          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={!wallet || wallet.balance < 100000}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            Mablag‘ni yechib olish
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-emerald-100 tracking-wider">
                Mavjud Balans
              </span>
              <CreditCard className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {Number(wallet?.balance || 0).toLocaleString()} <span className="text-xl">UZS</span>
              </h2>
              <p className="text-xs text-emerald-100">
                Yechib olish uchun minimal chegara: 100 000 UZS
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Jami Mukofotlar
              </span>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {Number(wallet?.total_earned || 0).toLocaleString()} <span className="text-xl">UZS</span>
              </h2>
              <p className="text-xs text-gray-500">
                Platforma boshidan beri to‘plangan jami bonus
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Yechish Kutilmoqda
              </span>
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-amber-600">
                {Number(wallet?.pending_payout || 0).toLocaleString()} <span className="text-xl">UZS</span>
              </h2>
              <p className="text-xs text-gray-500">
                Administrator tomonidan tasdiqlanish arafasida
              </p>
            </div>
          </div>
        </div>

        {/* How Rewards Work */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Mukofotlash mexanizmi qanday ishlaydi?
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Har bir fuqaro savoliga asosli javob yozgach, sun’iy intellekt javobingizni 7 ta mezon bo‘yicha tekshiradi. 70 balldan yuqori natijaga erishilsa, zudlik bilan 5 000 dan 15 000 so‘mgacha bonus hamyoningizga o‘tadi!
              </p>
            </div>
          </div>

          <Link
            href="/law-student/questions"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap shadow-sm"
          >
            Savollarga javob berish
          </Link>
        </div>

        {/* Rewards History */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Mukofotlar tarixi
            </h3>
            <span className="text-xs text-gray-500">{rewards.length} ta mukofot</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : rewards.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-2xl">
              Hozircha hisoblangan mukofotlar mavjud emas. Ommaviy savollarga javob berib pul mukofotlarini yutib oling!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Savol / Sabab</th>
                    <th className="pb-3 font-semibold">AI Bali</th>
                    <th className="pb-3 font-semibold">Summa</th>
                    <th className="pb-3 font-semibold text-right">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rewards.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 text-gray-500">
                        {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {r.reason || `Savol ID: #${r.question_id}`}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {r.ai_score || 75} / 100 ball
                        </span>
                      </td>
                      <td className="py-3 font-bold text-emerald-600">
                        +{Number(r.amount).toLocaleString()} UZS
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {r.status === 'credited' ? 'Hisoblangan' : r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Requests History */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Pul yechib olish so‘rovlari (Tranzaksiyalar)
            </h3>
            <span className="text-xs text-gray-500">{payoutRequests.length} ta so‘rov</span>
          </div>

          {payoutRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-2xl">
              Pul yechib olish bo‘yicha so‘rovlar yo‘q.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Summa</th>
                    <th className="pb-3 font-semibold">Karta raqami</th>
                    <th className="pb-3 font-semibold">Karta egasi</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {payoutRequests.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3 font-bold text-gray-900 dark:text-white">
                        {Number(p.amount).toLocaleString()} UZS
                      </td>
                      <td className="py-3 font-mono text-gray-600 dark:text-gray-400">
                        {p.card_number ? `•••• ${p.card_number.slice(-4)}` : '••••'}
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {p.card_holder_name}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end">{getPayoutStatusBadge(p.status)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Mablag‘ni plastik kartaga yechish
              </h3>
              <p className="text-xs text-gray-500">
                So‘rov administrator tomonidan tekshirilib, mablag‘ kartangizga o‘tkazib beriladi.
              </p>
            </div>

            {payoutSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm">So‘rov muvaffaqiyatli qabul qilindi!</p>
                <p className="text-xs">Administrator yaqin vaqt ichida to‘lovni amalga oshiradi.</p>
              </div>
            ) : (
              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                {payoutError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                    {payoutError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Yechiladigan summa (UZS)
                  </label>
                  <input
                    type="number"
                    min={100000}
                    max={wallet?.balance || 100000}
                    step={10000}
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Minimal summa: 100 000 UZS. Mavjud: {Number(wallet?.balance || 0).toLocaleString()} UZS
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Plastik karta raqami (Uzcard / Humo)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="8600 0000 0000 0000"
                    maxLength={19}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono tracking-wider"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Karta egasining F.I.Sh.
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                    placeholder="Masalan: ALISHEROV ANVAR ANVAROVICH"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs uppercase"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayout}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {submittingPayout ? 'Yuborilmoqda...' : 'So‘rovni tasdiqlash'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
