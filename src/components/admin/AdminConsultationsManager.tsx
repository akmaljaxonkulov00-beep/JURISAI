'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  DollarSign,
  Search,
} from 'lucide-react'

export default function AdminConsultationsManager() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/appointments')
      const json = await res.json()
      if (json.success && json.data) setAppointments(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Konsultatsiyalar va Uchrashuvlar Boshqaruvi
        </h2>
        <p className="text-xs text-secondary">
          Advokat va fuqarolar o‘rtasidagi barcha uchrashuv metama’lumotlari va to‘lov holatlari
        </p>
      </div>

      <div className="card-default rounded-2xl border border-card-border overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Konsultatsiyalar ({appointments.length})
          </h3>
          <span className="text-xs text-secondary">Xavfsizlik: Suhbat matnlari ochilmaydi</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-secondary">Yuklanmoqda...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary">Uchrashuvlar mavjud emas</div>
        ) : (
          <div className="divide-y divide-card-border">
            {appointments.map(app => (
              <div
                key={app.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {app.service_title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        app.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : app.status === 'completed'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">
                    Advokat: <strong>{app.advocate_name}</strong> • Mijoz: <strong>{app.citizen_name}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Sana: {app.appointment_date} {app.appointment_time} • Format: {app.format}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white block font-mono">
                    {Number(app.amount).toLocaleString('uz-UZ')} UZS
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      app.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {app.payment_status === 'paid' ? 'To‘langan' : 'Kutilmoqda'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
