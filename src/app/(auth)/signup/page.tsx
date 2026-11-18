'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/services/supabase-auth'
import { getRoleDashboardPath, PlatformRole } from '@/lib/roles'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<PlatformRole>('student')

  // Form maydonlari
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Toshkent')

  // Talaba / Yosh advokat maydonlari
  const [university, setUniversity] = useState('Toshkent davlat yuridik universiteti (TDYU)')
  const [faculty, setFaculty] = useState('Yurisprudensiya')
  const [studyYear, setStudyYear] = useState<number>(3)
  const [studentIdNumber, setStudentIdNumber] = useState('')
  const [specialCode, setSpecialCode] = useState('')

  // Advokat maydonlari
  const [licenseNumber, setLicenseNumber] = useState('')
  const [barAssociation, setBarAssociation] = useState('Toshkent shahar advokatlar palatasi')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError('To‘liq ismingizni kiriting')
      setIsLoading(false)
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('To‘g‘ri email manzilini kiriting')
      setIsLoading(false)
      return
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setError('Aniq telefon raqamingizni kiriting (masalan: +998 90 123 45 67)')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Kiritilgan parollar mos kelmadi')
      setIsLoading(false)
      return
    }

    // Rolga mos tekshiruvlar (Faqat talabalar tizimi faol)
    /* Vaqtinchalik to'xtatilgan tekshiruvlar:
    if (selectedRole === 'citizen') {
      if (!city.trim()) {
        setError('Shahar yoki viloyatingizni kiriting')
        setIsLoading(false)
        return
      }
    } else if (selectedRole === 'law_student') {
      if (!university.trim()) {
        setError('Yuridik OTM nomini kiriting')
        setIsLoading(false)
        return
      }
      if (!specialCode.trim()) {
        setError('Advokat bo‘lmoqchi bo‘lgan talabalar (Yosh advokatlar) uchun maxsus taklifnoma paroli majburiy!')
        setIsLoading(false)
        return
      }
    } else if (selectedRole === 'advocate') {
      if (!licenseNumber.trim()) {
        setError('Advokatlik litsenziya raqamini kiriting')
        setIsLoading(false)
        return
      }
      if (!barAssociation.trim()) {
        setError('Advokatlar palatasi bo‘linmasini kiriting')
        setIsLoading(false)
        return
      }
      if (!city.trim()) {
        setError('Faoliyat ko‘rsatadigan shahar/viloyatni kiriting')
        setIsLoading(false)
        return
      }
    }
    */

    try {
      const result = await authService.signUp(email, password, name, selectedRole, {
        phone,
        city,
        university,
        faculty,
        studyYear,
        studentIdNumber,
        specialCode,
        licenseNumber,
        barAssociation,
      })

      if (result.success) {
        if (result.needsEmailConfirmation) {
          setSuccess(
            "Ro'yxatdan o'tish muvaffaqiyatli! Tasdiqlash xati emailingizga yuborildi. Iltimos, pochtangizni tekshiring."
          )
          setTimeout(() => {
            router.replace('/signin?registered=1')
          }, 2500)
          return
        }

        setSuccess("Ro'yxatdan muvaffaqiyatli o'tdingiz!")
        setTimeout(() => {
          router.push(getRoleDashboardPath(selectedRole))
        }, 1200)
      } else {
        setError(result.error || "Ro'yxatdan o'tish xatosi yuz berdi")
      }
    } catch {
      setError("Noma'lum xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <Link href="/" className="mb-4 inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-[#0a1931] flex items-center justify-center p-1.5 shadow-md border border-slate-700/50 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="JURISTIV" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            JURIST<span className="text-blue-600">IV</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Ro'yxatdan o'tish</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          O‘z rolingizni tanlang va so‘ralgan ma'lumotlarni to‘liq kiriting
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm font-medium flex items-center gap-2">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Sign Up Form */}
      <form onSubmit={onSubmit} className="space-y-5 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Platform Role Selector — Vaqtinchalik faqat talabalar uchun */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
            Platformadagi rolingiz:
          </label>
          <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Yurisprudensiya & Huquq Talabasi
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                    Faol tizim
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Virtual Sud simulyatori, IRAC kazuslar tahlili va protsessual hujjatlar amaliyoti
                </p>
              </div>
            </div>
          </div>

          {/* Vaqtinchalik to'xtatildi (Kelgusi bosqichlar uchun saqlab qo'yildi):
          <div className="grid grid-cols-2 gap-3 mt-3 opacity-50">
            <div className="p-3 border rounded-xl">🏛️ Fuqaro (2-bosqichda)</div>
            <div className="p-3 border rounded-xl">🎓 Yosh Advokat (2-bosqichda)</div>
            <div className="p-3 border rounded-xl">⚖️ Advokat (2-bosqichda)</div>
          </div>
          */}
        </div>

        {/* Umumiy Asosiy Maydonlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              To'liq ism-sharifingiz *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Alisher Fayzullayev"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Telefon raqami *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="+998 90 123 45 67"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email manzili *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Shahar / Viloyat *
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Toshkent"
              required
            />
          </div>
        </div>

        {/* ── ADVOKAT MAXSUS MAYDONLARI ── */}
        {selectedRole === 'advocate' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Advokatlik Litsenziyasi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Litsenziya raqami *
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="ADV-UZ-004521"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Advokatlar palatasi bo‘linmasi *
                </label>
                <input
                  type="text"
                  value={barAssociation}
                  onChange={e => setBarAssociation(e.target.value)}
                  placeholder="Toshkent shahar advokatlar palatasi"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* ── YOSH ADVOKAT (TALABA) MAXSUS MAYDONLARI ── */}
        {selectedRole === 'law_student' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Yuridik OTM & Taklifnoma Ma'lumotlari
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OTM Nomi *
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="TDYU, Samarqand davlat universiteti"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fakultet *
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                  placeholder="Yurisprudensiya, Ommaviy huquq"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bosqich (kurs) *
                </label>
                <select
                  value={studyYear}
                  onChange={e => setStudyYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                >
                  <option value={1}>1-bosqich</option>
                  <option value={2}>2-bosqich</option>
                  <option value={3}>3-bosqich</option>
                  <option value={4}>4-bosqich</option>
                  <option value={5}>Magistratura</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Talabalik ID raqami
                </label>
                <input
                  type="text"
                  value={studentIdNumber}
                  onChange={e => setStudentIdNumber(e.target.value)}
                  placeholder="STD-2024-8841"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                Maxsus taklifnoma paroli (Vaucher kodi) *
              </label>
              <input
                type="text"
                value={specialCode}
                onChange={e => setSpecialCode(e.target.value)}
                placeholder="YOSH-ADVOKAT-2026 yoki sizga berilgan maxsus kod"
                className="w-full px-3 py-2 border-2 border-indigo-400/50 rounded-lg text-sm bg-white dark:bg-gray-800 font-mono"
                required
              />
            </div>
          </div>
        )}


        {/* Parol Maydonlari */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Parol *
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
            <p className="mt-1 text-[11px] text-gray-400">Kamida 6 ta belgi</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Parolni tasdiqlang *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          {isLoading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Hisobingiz bormi?{' '}
          <Link href="/signin" className="text-blue-600 hover:text-blue-500 font-bold">
            Tizimga kirish
          </Link>
        </p>
      </div>
    </div>
  )
}
