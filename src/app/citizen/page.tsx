'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import {
  HelpCircle,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [qRes, aRes] = await Promise.all([
          fetch('/api/questions?mine=true').then(r => r.json()),
          fetch('/api/appointments').then(r => r.json()),
        ])
        if (qRes.success && qRes.data) setQuestions(qRes.data)
        if (aRes.success && aRes.data) setAppointments(aRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1528] via-[#111F3C] to-[#1E3A8A] text-white p-8 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              O‘zbekiston Fuqarolari uchun Huquqiy Portal
            </span>
            <h1 className="text-3xl font-bold tracking-tight">
              Xush kelibsiz, {user?.name || user?.email?.split('@')[0] || 'Fuqaro'}!
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Qonuniy muammolaringiz bormi? Savolingizni bering, sun’iy intellekt va professional advokatlar
              tomonidan asoslangan huquqiy yechimlarga ega bo‘ling.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/citizen/ask"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-4 h-4" />
                Yuridik savol berish
              </Link>
              <Link
                href="/citizen/advocates"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/10 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 text-amber-400" />
                Advokat topish
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mening savollarim</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {questions.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Javob berilgan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {questions.filter(q => q.status === 'answered').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Konsultatsiyalar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {appointments.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Xavfsiz chatlar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {appointments.filter(a => a.status === 'confirmed').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Questions (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                So‘nggi berilgan savollar
              </h2>
              <Link
                href="/citizen/questions"
                className="text-xs font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
              >
                Barchasini ko‘rish <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-100 dark:border-gray-800 text-center text-gray-500 text-sm">
                Yuklanmoqda...
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Hozircha birorta ham savol bermagansiz
                </p>
                <Link
                  href="/citizen/ask"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                >
                  <Plus className="w-4 h-4" /> Birinchi savolingizni bering
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.slice(0, 4).map(q => (
                  <Link
                    key={q.id}
                    href={`/citizen/questions/${q.id}`}
                    className="block bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {q.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              q.status === 'answered'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {q.status === 'answered' ? 'Javob berilgan' : 'Kutilmoqda'}
                          </span>
                          {q.visibility === 'private' && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Maxfiy
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {q.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {q.description}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                        {new Date(q.created_at).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments & Consultations (1 col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Konsultatsiyalar
              </h2>
              <Link
                href="/citizen/appointments"
                className="text-xs font-medium text-blue-600 hover:text-blue-500"
              >
                Hammasi
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 text-center space-y-2">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500">Rejalashtirilgan konsultatsiyalar yo‘q</p>
                <Link
                  href="/citizen/advocates"
                  className="inline-block text-xs font-medium text-blue-600 hover:underline pt-1"
                >
                  Advokat tanlash va yozilish
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map(app => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-600">{app.service_title}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                        {app.status === 'confirmed' ? 'Tasdiqlangan' : app.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Advokat: {app.advocate_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{app.appointment_date}</span>
                      <span>{app.appointment_time}</span>
                      <span>{app.format === 'online' ? 'Online (Video)' : 'Offline'}</span>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                        {Number(app.amount).toLocaleString('uz-UZ')} UZS
                      </span>
                      <Link
                        href={`/citizen/messages?advocateId=${app.advocate_id}`}
                        className="text-xs text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chatga o‘tish
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Support / Quick Help Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Ishonch kafolati
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Platformadagi barcha advokatlar O‘zbekiston Respublikasi Advokatlar palatasi
                litsenziyasiga ega va rasmiy tekshiruvdan o‘tgan.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
