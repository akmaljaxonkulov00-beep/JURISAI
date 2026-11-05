'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteLogo from '@/components/SiteLogo'
import {
  Award,
  KeyRound,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function LawStudentClaimContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialToken = searchParams.get('token') || ''

  const [inviteToken, setInviteToken] = useState(initialToken)
  const [tempPassword, setTempPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Yangi parollar bir-biriga mos kelmadi')
      return
    }

    if (newPassword.length < 8) {
      setError('Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/law-student/claim-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken: inviteToken.trim(),
          tempPassword: tempPassword.trim(),
          newPassword,
          fullName: fullName.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/signin?role=law_student&claimed=true')
        }, 2000)
      } else {
        setError(data.error || 'Taklifnomani faollashtirib bo‘lmadi')
      }
    } catch {
      setError('Server bilan aloqa uzildi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <SiteLogo size="md" />
          </Link>
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Yuridik Talaba Taklifnomasi
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Akkauntni faollashtirish
          </h2>
          <p className="text-xs text-gray-400">
            Platforma administratori bergan taklifnoma tokeni va vaqtinchalik parol orqali kiring
          </p>
        </div>

        <div className="bg-[#0B1528] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-2xl space-y-5">
          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-base text-white">Taklifnoma muvaffaqiyatli faollashtirildi!</h4>
              <p className="text-xs text-emerald-200">
                Parolingiz yangilandi. Tizimga kirish sahifasiga yo‘naltirilmoqdasiz...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Bir martalik taklifnoma tokeni (Token)
                </label>
                <input
                  type="text"
                  value={inviteToken}
                  onChange={e => setInviteToken(e.target.value)}
                  placeholder="admin-taklif-xxxx-xxxx"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Administrator bergan vaqtinchalik parol
                </label>
                <input
                  type="password"
                  value={tempPassword}
                  onChange={e => setTempPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  To‘liq F.I.Sh. (Agar o‘zgartirmoqchi bo‘lsangiz)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ism Familiya Sharif"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-800 space-y-3">
                <p className="text-[11px] font-semibold text-indigo-300">
                  Xavfsizlik uchun yangi doimiy parol o‘rnating:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Yangi doimiy parol (kamida 8 belgi)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Yangi kuchli parol"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Yangi parolni tasdiqlang
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Parolni qayta kiriting"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Tekshirilmoqda...' : 'Taklifnomani tasdiqlash va kirish'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-gray-500">
          Hisobingiz bormi?{' '}
          <Link href="/signin" className="text-indigo-400 hover:underline">
            Tizimga kirish
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LawStudentClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-4">
          <div className="text-xs text-indigo-300 animate-pulse">Yuklanmoqda...</div>
        </div>
      }
    >
      <LawStudentClaimContent />
    </Suspense>
  )
}
