'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import {
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  Award,
  DollarSign,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react'

export default function AdvocateDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [answersToReview, setAnswersToReview] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Verification Form State
  const [licenseNumber, setLicenseNumber] = useState('')
  const [barAssociation, setBarAssociation] = useState('Toshkent shahar advokatlar palatasi')
  const [experienceYears, setExperienceYears] = useState(5)
  const [bio, setBio] = useState('')
  const [submittingVerification, setSubmittingVerification] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  const loadData = async () => {
    try {
      const [pRes, aRes, rRes, cRes] = await Promise.all([
        fetch('/api/verification/advocate').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/answers?awaitingReview=true').then(r => r.json()),
        fetch('/api/cases').then(r => r.json()),
      ])
      if (pRes.success && pRes.data) setProfile(pRes.data)
      if (aRes.success && aRes.data) setAppointments(aRes.data)
      if (rRes.success && rRes.data) setAnswersToReview(rRes.data)
      if (cRes.success && cRes.data) setCases(cRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!licenseNumber.trim()) return

    setSubmittingVerification(true)
    try {
      const res = await fetch('/api/verification/advocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseNumber,
          barAssociation,
          experienceYears,
          bio,
          phone: profile?.phone || '+998 90 123 45 67',
        }),
      })
      const json = await res.json()
      if (json.success) {
        setVerificationSuccess(true)
        loadData()
      }
    } catch {
      alert('Arizani yuborishda xatolik')
    } finally {
      setSubmittingVerification(false)
    }
  }

  const isApproved = profile?.verification_status === 'approved'
  const isPending = profile?.verification_status === 'pending' || profile?.verification_status === 'under_review'

  // Total earnings calculated from completed appointments
  const totalEarnings = appointments
    .filter(a => a.payment_status === 'paid')
    .reduce((sum, a) => sum + (Number(a.amount) * 0.9), 0) // 90% net advocate share

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav
        currentRole="advocate"
        isVerified={isApproved}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1528] via-[#122244] to-[#1E3A8A] text-white p-8 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Professional Advokatlar Boshqaruv Markazi
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Xush kelibsiz, Advokat {profile?.full_name || user?.name || ''}!
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Mijozlar bilan xavfsiz muloqot qiling, sud ishlari dosyesini yuritib boring,
              konsultatsiyalarni boshqaring va yosh huquqshunos talabalar javoblariga mentorlik qiling.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/advocate/appointments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <Calendar className="w-4 h-4" />
                Uchrashuvlarni ko‘rish
              </Link>
              <Link
                href="/advocate/mentorship"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-sm border border-amber-500/30 transition-all"
              >
                <Award className="w-4 h-4" />
                Talabalar taqrizi ({answersToReview.length})
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
                  Advokatlik litsenziyasi va verifikatsiya
                </h3>
                {isApproved && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" /> Litsenziya tasdiqlangan
                  </span>
                )}
                {isPending && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" /> Tekshiruvda
                  </span>
                )}
                {!profile?.license_number && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Kiritilmagan
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isApproved
                  ? `Litsenziya: ${profile.license_number} • ${profile.bar_association} • ${profile.experience_years} yillik tajriba`
                  : isPending
                    ? 'Litsenziya ma’lumotlaringiz ma’muriyat tomonidan tekshirilmoqda.'
                    : 'Tasdiqlangan advokat belgisiga ega bo‘lish uchun litsenziya ma’lumotlaringizni yuboring.'}
              </p>
            </div>

            {!isApproved && (
              <button
                onClick={() => setVerificationSuccess(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap shadow-sm"
              >
                Litsenziya kiritish
              </button>
            )}
          </div>

          {!isApproved && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleVerificationSubmit} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Litsenziya raqami
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="Masalan: ADV-UZ-004521"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Advokatlar palatasi bo‘limi
                    </label>
                    <input
                      type="text"
                      value={barAssociation}
                      onChange={e => setBarAssociation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Ish tajribasi (yillarda)
                    </label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={e => setExperienceYears(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Kasbiy bio / Tavsif
                    </label>
                    <input
                      type="text"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Fuqarolik va iqtisodiy nizolar bo‘yicha ixtisoslashgan..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all"
                >
                  {submittingVerification ? 'Yuborilmoqda...' : 'Tasdiqlashga yuborish'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Mijozlar & Uchrashuvlar</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {appointments.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Faol sud ishlari</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                {cases.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Taqriz kutilayotgan javoblar</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {answersToReview.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Sof daromad (UZS)</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
                {totalEarnings.toLocaleString('uz-UZ')} UZS
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/advocate/appointments"
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Konsultatsiyalar taqvimi
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mijozlarning uchrashuvlarini tasdiqlash, vaqtini belgilash yoki bekor qilish.
            </p>
          </Link>

          <Link
            href="/advocate/cases"
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Ishlar dosyesi va maxfiy qaydlar
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Sud ishlari, muddatlar, vazifalar va faqat advokat uchun maxfiy shaxsiy yozuvlar.
            </p>
          </Link>

          <Link
            href="/advocate/mentorship"
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Talabalarga mentorlik
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Huquqshunos talabalarning ommaviy javoblarini taqrizlash va tasdiqlash.
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
