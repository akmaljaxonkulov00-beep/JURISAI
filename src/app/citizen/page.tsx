'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import { getAuthHeaders } from '@/lib/api-auth-client'
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
  CreditCard,
  Sparkles,
  Zap,
} from 'lucide-react'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [usage, setUsage] = useState<{
    remainingFree: number
    freeQuestionsLimit: number
    freeQuestionsUsed: number
    paidCredits: number
    canAsk: boolean
  }>({
    remainingFree: 2,
    freeQuestionsLimit: 2,
    freeQuestionsUsed: 0,
    paidCredits: 0,
    canAsk: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const headers = await getAuthHeaders()
        const [qRes, aRes, uRes] = await Promise.all([
          fetch('/api/questions?mine=true', {
            headers,
            credentials: 'include',
          }).then(r => r.json()).catch(() => ({})),
          fetch('/api/appointments', {
            headers,
            credentials: 'include',
          }).then(r => r.json()).catch(() => ({})),
          fetch('/api/citizen/usage', {
            headers,
            credentials: 'include',
          }).then(r => r.json()).catch(() => ({})),
        ])

        if (qRes?.success && qRes?.data) setQuestions(qRes.data)
        if (aRes?.success && aRes?.data) setAppointments(aRes.data)
        if (uRes?.success && uRes?.data) setUsage(uRes.data)
      } catch (e) {
        console.warn('Citizen dashboard data load fallback:', e)
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1528] via-[#111F3C] to-[#1E3A8A] text-white p-8 sm:p-10 shadow-xl border border-blue-900/50">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              O‘zbekiston Fuqarolari uchun Rasmiy Huquqiy Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Xush kelibsiz, {user?.name || user?.email?.split('@')[0] || 'Fuqaro'}!
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Huquqiy masalangiz bormi? Har oy beriladigan 2 ta bepul savol orqali yuridik yechim oling yoki
              tasdiqlangan litsenziyali advokatlar bilan to‘g‘ridan-to‘g‘ri shaxsiy suhbat (Telegram-like chat) oching.
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

        {/* ── SAVOL LIMITLARI VA MONETIZATSIYA BLOKI ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Sizning Oylik Savol Limitingiz
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
              Har oy har bir fuqaroga 2 ta bepul savol beriladi (har yangi oyda yangilanadi). Bepul limit tugasa,
              arzon kreditlar yoki oylik obuna xarid qilish mumkin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 px-4 py-2.5 rounded-xl text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                  Bepul savollar
                </span>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {usage.remainingFree} / {usage.freeQuestionsLimit} ta
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 px-4 py-2.5 rounded-xl text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                  Pullik kreditlar
                </span>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {usage.paidCredits} ta
                </span>
              </div>
            </div>

            <Link
              href="/citizen/payments"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold transition-all shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              Kredit xarid qilish
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
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

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
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

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
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

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Shaxsiy Chatlar</p>
              <Link href="/citizen/messages" className="text-xs font-bold text-blue-600 hover:underline block mt-1">
                Telegram Chatga o'tish →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Recent Questions with Author Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              So‘nggi Savollaringiz va Javoblar
            </h2>
            <Link href="/citizen/questions" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Barchasini ko‘rish <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : questions.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-gray-400">Siz hali birorta ham huquqiy savol bermadingiz.</p>
              <Link
                href="/citizen/ask"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Bepul savol berish
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.slice(0, 5).map(q => {
                const answer = q.latest_answer || q.answers?.[0]
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {q.category}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            q.status === 'answered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.status === 'answered' ? 'Javob berilgan' : 'Kutilmoqda'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{q.title}</h3>
                      {answer && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>
                            Javob bergan: <strong className="text-gray-700 dark:text-gray-300">{answer.author_name}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px] font-bold uppercase">
                            {answer.author_role === 'advocate' ? 'Advokat' : answer.author_role === 'law_student' ? 'Talaba' : 'AI'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/citizen/questions/${q.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 self-start sm:self-auto"
                    >
                      Batafsil <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
