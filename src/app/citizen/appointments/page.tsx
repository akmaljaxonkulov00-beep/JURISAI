'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Star,
  CreditCard,
  X,
} from 'lucide-react'

export default function CitizenAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Review Modal State
  const [reviewModalApp, setReviewModalApp] = useState<any | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Payment Modal State
  const [paymentModalApp, setPaymentModalApp] = useState<any | null>(null)
  const [paymentProvider, setPaymentProvider] = useState<'click' | 'payme'>('click')
  const [isPaying, setIsPaying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null)

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/appointments')
      const json = await res.json()
      if (json.success && json.data) {
        setAppointments(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewModalApp || !reviewComment.trim()) return

    setIsSubmittingReview(true)
    setReviewError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advocateId: reviewModalApp.advocate_id,
          consultationId: reviewModalApp.id,
          rating,
          comment: reviewComment,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setReviewSuccess(true)
        setTimeout(() => {
          setReviewModalApp(null)
          setReviewSuccess(false)
          setReviewComment('')
          loadAppointments()
        }, 1500)
      } else {
        setReviewError(json.error || 'Taqriz qoldirishda xatolik yuz berdi')
      }
    } catch {
      setReviewError('Server bilan aloqa uzildi')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handlePay = async (app: any) => {
    setPaymentModalApp(app)
    setPaymentSuccess(null)
  }

  const processPayment = async () => {
    if (!paymentModalApp) return
    setIsPaying(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: paymentModalApp.id,
          amount: paymentModalApp.amount,
          provider: paymentProvider,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setPaymentSuccess(json.data)
        loadAppointments()
      }
    } catch {
      alert('To‘lov amalga oshmadi')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Mening konsultatsiyalarim va uchrashuvlarim
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Advokatlar bilan rejalashtirilgan va o‘tkazilgan barcha huquqiy konsultatsiyalar
            </p>
          </div>

          <Link
            href="/citizen/advocates"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all"
          >
            Yangi uchrashuv belgilash
          </Link>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            Konsultatsiyalar yuklanmoqda...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Sizda hali birorta ham konsultatsiya yo‘q
            </p>
            <p className="text-xs text-gray-500">
              Advokatlar katalogidan o‘zingizga mos mutaxassisni tanlab konsultatsiyaga yoziling.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(app => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {app.service_title}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      Advokat: {app.advocate_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        app.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : app.status === 'completed'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {app.status === 'confirmed'
                        ? 'Tasdiqlangan'
                        : app.status === 'completed'
                          ? 'Yakunlangan'
                          : 'Kutilmoqda'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Sana: <strong className="text-gray-900 dark:text-white">{app.appointment_date}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Vaqt: <strong className="text-gray-900 dark:text-white">{app.appointment_time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.format === 'online' ? (
                      <Video className="w-4 h-4 text-blue-500" />
                    ) : (
                      <MapPin className="w-4 h-4 text-red-500" />
                    )}
                    <span>Format: <strong className="text-gray-900 dark:text-white">{app.format === 'online' ? 'Online (Video)' : 'Ofisda'}</strong></span>
                  </div>
                </div>

                {app.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                    Izoh: {app.notes}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-xs">
                    <span className="text-gray-400">Summa: </span>
                    <strong className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(app.amount).toLocaleString('uz-UZ')} UZS
                    </strong>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        app.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {app.payment_status === 'paid' ? 'To‘langan' : 'To‘lanmagan'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {app.payment_status !== 'paid' && (
                      <button
                        onClick={() => handlePay(app)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> To‘lash (Click/Payme)
                      </button>
                    )}

                    <Link
                      href={`/citizen/messages?advocateId=${app.advocate_id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Xavfsiz chat
                    </Link>

                    {/* Review Button for completed consultations */}
                    {app.status === 'completed' && (
                      <button
                        onClick={() => setReviewModalApp(app)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" /> Baholash va taqriz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {reviewModalApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 relative">
              <button
                onClick={() => setReviewModalApp(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Advokatga taqriz va baho berish
                </h3>
                <p className="text-xs text-gray-500">
                  Advokat: {reviewModalApp.advocate_name} | {reviewModalApp.service_title}
                </p>
              </div>

              {reviewSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-center text-xs font-semibold">
                  Taqrizingiz muvaffaqiyatli saqlandi! Rahmat.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {reviewError && (
                    <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
                      {reviewError}
                    </div>
                  )}

                  {/* Stars */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Baho (1 dan 5 gacha yulduz)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 ${star <= rating ? 'fill-amber-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fikr-mulohazangiz
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Advokatning maslahati qay darajada foydali bo‘ldi..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {isSubmittingReview ? 'Yuborilmoqda...' : 'Taqrizni e’lon qilish'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 relative">
              <button
                onClick={() => setPaymentModalApp(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Xavfsiz To‘lov (O‘zbekiston)
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Konsultatsiya to‘lovi
                </h3>
                <p className="text-xs text-gray-500">
                  {paymentModalApp.service_title} — Advokat: {paymentModalApp.advocate_name}
                </p>
              </div>

              {paymentSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    To‘lov muvaffaqiyatli qabul qilindi!
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Tranzaksiya: {paymentSuccess.transaction?.provider_transaction_id}
                  </p>
                  <button
                    onClick={() => setPaymentModalApp(null)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Yopish
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-500">To‘lanadigan summa:</span>
                    <strong className="text-base text-gray-900 dark:text-white font-mono">
                      {Number(paymentModalApp.amount).toLocaleString('uz-UZ')} UZS
                    </strong>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      To‘lov tizimini tanlang:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentProvider('click')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          paymentProvider === 'click'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950'
                            : 'border-gray-200 text-gray-600 dark:border-gray-700'
                        }`}
                      >
                        CLICK Evolution
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentProvider('payme')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          paymentProvider === 'payme'
                            ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950'
                            : 'border-gray-200 text-gray-600 dark:border-gray-700'
                        }`}
                      >
                        Payme
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Mablag‘ platformaning xavfsiz hisobiga o‘tkaziladi va konsultatsiya yakunlangach advokat hisobiga o‘tadi.
                  </p>

                  <button
                    onClick={processPayment}
                    disabled={isPaying}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isPaying ? 'To‘lov tasdiqlanmoqda...' : 'To‘lovni tasdiqlash'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
