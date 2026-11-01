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
  X,
} from 'lucide-react'

export default function AdvocateAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Action Modal State
  const [actionApp, setActionApp] = useState<any | null>(null)
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | 'complete'>('confirm')
  const [cancellationReason, setCancellationReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleUpdateStatus = async (appId: string, status: string, reason?: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appId,
          status,
          cancellationReason: reason,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setActionApp(null)
        setCancellationReason('')
        loadAppointments()
      }
    } catch {
      alert('Holatni yangilashda xatolik yuz berdi')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="advocate" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Mijozlar bilan uchrashuvlar taqvimi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rejalashtirilgan online va offline konsultatsiyalarni tasdiqlash va boshqarish
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border">
            Yuklanmoqda...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed space-y-2">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Uchrashuv so‘rovlari mavjud emas
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
                      Mijoz: {app.citizen_name} {app.citizen_phone && `(${app.citizen_phone})`}
                    </h3>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      app.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : app.status === 'completed'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : app.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {app.status === 'confirmed'
                      ? 'Tasdiqlangan'
                      : app.status === 'completed'
                        ? 'Yakunlangan'
                        : app.status === 'cancelled'
                          ? 'Bekor qilingan'
                          : 'Kutilmoqda'}
                  </span>
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
                    Mijoz izohi: {app.notes}
                  </p>
                )}

                {app.cancellation_reason && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200">
                    Bekor qilish sababi: {app.cancellation_reason}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-xs">
                    <span className="text-gray-400">To‘lov: </span>
                    <strong className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                      {Number(app.amount).toLocaleString('uz-UZ')} UZS
                    </strong>
                    <span className="ml-2 text-emerald-600 font-semibold">
                      (Sof ulush: {(Number(app.amount) * 0.9).toLocaleString('uz-UZ')} UZS)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/advocate/messages?citizenId=${app.citizen_id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Mijoz bilan chat
                    </Link>

                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Qabul qilish
                        </button>
                        <button
                          onClick={() => {
                            setActionApp(app)
                            setActionType('cancel')
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                        >
                          Rad etish
                        </button>
                      </>
                    )}

                    {app.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'completed')}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                      >
                        Konsultatsiyani yakunlash
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancellation Modal */}
        {actionApp && actionType === 'cancel' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Konsultatsiyani bekor qilish
              </h3>
              <p className="text-xs text-gray-500">
                Mijozga sababni ma’lum qilish shart.
              </p>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="Bekor qilish sababini yozing..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionApp(null)}
                  className="px-4 py-2 rounded-xl border text-xs"
                >
                  Orqaga
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(actionApp.id, 'cancelled', cancellationReason)}
                  disabled={isProcessing || !cancellationReason.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
                >
                  Bekor qilishni tasdiqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
