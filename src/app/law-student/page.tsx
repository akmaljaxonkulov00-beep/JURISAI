'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  Scale,
} from 'lucide-react'

export default function LawStudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [myAnswers, setMyAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Verification Form State
  const [university, setUniversity] = useState('Toshkent davlat yuridik universiteti (TDYU)')
  const [faculty, setFaculty] = useState('Xususiy huquq')
  const [studyYear, setStudyYear] = useState(3)
  const [specialization, setSpecialization] = useState('Fuqarolik va mehnat huquqi')
  const [studentIdNumber, setStudentIdNumber] = useState('')
  const [submittingVerification, setSubmittingVerification] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  const loadData = async () => {
    try {
      const [vRes, aRes] = await Promise.all([
        fetch('/api/verification/student').then(r => r.json()),
        fetch('/api/answers?awaitingReview=true').then(r => r.json()),
      ])
      if (vRes.success && vRes.data) {
        setProfile(vRes.data)
      }
      if (aRes.success && aRes.data && user?.id) {
        const mine = aRes.data.filter((ans: any) => ans.author_id === user.id)
        setMyAnswers(mine)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentIdNumber.trim()) return

    setSubmittingVerification(true)
    try {
      const res = await fetch('/api/verification/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user?.name,
          university,
          faculty,
          studyYear,
          specialization,
          studentIdNumber,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setVerificationSuccess(true)
        loadData()
      }
    } catch {
      alert('Arizani yuborishda xatolik yuz berdi')
    } finally {
      setSubmittingVerification(false)
    }
  }

  const isApproved = profile?.verification_status === 'approved'
  const isPending = profile?.verification_status === 'pending' || profile?.verification_status === 'under_review'
  const isRejected = profile?.verification_status === 'rejected'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav
        currentRole="law_student"
        isVerified={isApproved}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D1B2A] via-[#1B263B] to-[#415A77] text-white p-8 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Award className="w-4 h-4 text-amber-400" />
              Yurisprudensiya Talabalari Amaliyot Portali
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Xush kelibsiz, {profile?.full_name || user?.name || 'Talaba'}!
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Bu yerda siz fuqarolarning ommaviy yuridik savollariga O‘zbekiston qonunlari asosida
              javob berib, amaliy malakangizni oshirasiz va professional advokatlardan taqriz olasiz.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/law-student/questions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <BookOpen className="w-4 h-4" />
                Ommaviy savollarga javob berish
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/10 transition-all backdrop-blur-sm"
              >
                <Scale className="w-4 h-4 text-amber-400" />
                Kazus va Sud Simulyatori (Mavjud Talaba Portali)
              </Link>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Talabalik maqomi va verifikatsiya
                </h3>
                {isApproved && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlangan
                  </span>
                )}
                {isPending && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" /> Tekshiruvda
                  </span>
                )}
                {isRejected && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1 border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> Rad etilgan
                  </span>
                )}
                {!profile && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Hujjat yuborilmagan
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isApproved
                  ? `OTM: ${profile.university} • ${profile.study_year}-kurs • Guvohnoma: ${profile.student_id_number}`
                  : isPending
                    ? 'Talabalik ma’lumotlaringiz platforma administratori tomonidan tekshirilmoqda.'
                    : 'Savollarga rasmiy javob berish huquqiga ega bo‘lish uchun OTM ma’lumotlaringizni yuboring.'}
              </p>
            </div>

            {!isApproved && (
              <button
                onClick={() => setVerificationSuccess(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap shadow-sm"
              >
                Guvohnoma ma’lumotlarini kiritish
              </button>
            )}
          </div>

          {/* Verification Form (if not approved) */}
          {!isApproved && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleVerificationSubmit} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      OTM nomi
                    </label>
                    <input
                      type="text"
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Fakultet va mutaxassislik
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Bosqich / Kurs (1-4)
                    </label>
                    <select
                      value={studyYear}
                      onChange={e => setStudyYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    >
                      <option value={1}>1-kurs</option>
                      <option value={2}>2-kurs</option>
                      <option value={3}>3-kurs</option>
                      <option value={4}>4-kurs</option>
                      <option value={5}>Magistratura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Talabalik guvohnomasi raqami
                    </label>
                    <input
                      type="text"
                      value={studentIdNumber}
                      onChange={e => setStudentIdNumber(e.target.value)}
                      placeholder="Masalan: TDYU-2023-4412"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
                >
                  {submittingVerification ? 'Yuborilmoqda...' : 'Tasdiqlashga yuborish'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Berilgan javoblar</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {profile?.answers_count || myAnswers.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Advokat tasdiqlagan</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {profile?.approved_answers_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Taqriz jarayonida</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {myAnswers.filter(a => a.status === 'awaiting_review' || a.status === 'under_review').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Reputatsiya balli</p>
              <p className="text-2xl font-extrabold text-purple-600 mt-1">
                {profile?.reputation_score || 50} XP
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Answer Review Workflow Pipeline Explanation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Talaba javoblari bo‘yicha mentorlik bosqichlari
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] font-bold text-gray-500 block uppercase">1-bosqich</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white mt-1 block">Yuborilgan</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] font-bold text-blue-500 block uppercase">2-bosqich</span>
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 mt-1 block">Taqriz kutilmoqda</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-bold text-amber-500 block uppercase">3-bosqich</span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 mt-1 block">Advokat ko‘rmoqda</span>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
              <span className="text-[10px] font-bold text-orange-500 block uppercase">4-bosqich</span>
              <span className="text-xs font-bold text-orange-900 dark:text-orange-200 mt-1 block">Tahrir so‘ralgan</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-500 block uppercase">5-bosqich</span>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mt-1 block">Tasdiqlangan</span>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
              <span className="text-[10px] font-bold text-red-500 block uppercase">6-bosqich</span>
              <span className="text-xs font-bold text-red-900 dark:text-red-200 mt-1 block">Rad etilgan</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
