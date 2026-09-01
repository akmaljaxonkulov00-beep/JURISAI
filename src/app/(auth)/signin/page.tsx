'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/supabase-auth'
import { isAdminRole } from '@/lib/roles'
import { useAuth } from '@/app/providers'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import AnimatedCounter from '@/components/AnimatedCounter'

/* ═══════════════════════════════════════════════════════════════════════════
   BRAND CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const BRAND = {
  navy: '#0B1630',
  navyLight: '#111D3A',
  primary: '#2563EB',
  accent: '#6366F1',
  violet: '#7C3AED',
  white: '#FFFFFF',
  offWhite: '#F7F9FC',
  text: '#111827',
  muted: '#64748B',
  border: '#E2E8F0',
}

const FEATURES = [
  {
    title: 'AI Huquqiy Agent',
    desc: "O'zingiz uchun AI asosida huquqiy yordamchi.",
    icon: 'robot',
    color: '#7C3AED',
  },
  {
    title: 'AI Hujjat Generator',
    desc: "Shartnomalar, da'vo va boshqa hujjatlarni avtomatik yarating.",
    icon: 'document',
    color: '#2563EB',
  },
  {
    title: 'Qonunchilik Bazasi',
    desc: "O'zbekiston qonunlari va kodekslariga tezkor kirish.",
    icon: 'book',
    color: '#0D9488',
  },
  {
    title: 'AI Analitika',
    desc: "Huquqiy tahlil va statistik ma'lumotlar.",
    icon: 'chart',
    color: '#4F46E5',
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE ICON COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function FeatureIcon({ icon, color }: { icon: string; color: string }) {
  const paths: Record<string, string> = {
    robot:
      'M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6v3a1 1 0 001 1h6a1 1 0 001-1v-3c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z M10 21h4 M12 2v3',
    document: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8',
    book: 'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z M12 2v16',
    chart: 'M3 3v18h18 M7 16l4-8 4 4 4-6',
  }
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}25`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[icon]} />
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INPUT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  rightElement,
  required,
  minLength,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
  rightElement?: React.ReactNode
  required?: boolean
  minLength?: number
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full h-[48px] pl-11 pr-4 text-[14px] rounded-[12px] border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SIGN IN CONTENT
   ═══════════════════════════════════════════════════════════════════════════ */

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading: authLoading } = useAuth()
  const { stats: liveStats, loading: statsLoading } = useRealtimeStats()

  const initialMode = searchParams?.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  /* ── Logo ── */
  useEffect(() => {
    // logo is used from settings if available
  }, [])

  /* ── Search params ── */
  useEffect(() => {
    const errParam = searchParams?.get('error')
    if (errParam) setError(decodeURIComponent(errParam))
    const linked = searchParams?.get('linked')
    if (linked === '1') setSuccessMsg('Akkauntlaringiz birlashtirildi!')
  }, [searchParams])

  /* ── OAuth redirect ── */
  useEffect(() => {
    const hasCode = searchParams?.get('code')
    const hasError = searchParams?.get('error')
    if (!hasCode && !hasError) return
    authService
      .handleRedirectResult()
      .then(result => {
        if (result.success && result.data) {
          const role = result.data.role
          router.replace(
            isAdminRole(role) ? '/admin' : searchParams?.get('redirectTo') || '/dashboard'
          )
        }
      })
      .catch(() => {})
  }, [router, searchParams])

  /* ── Remember me ── */
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        const result = await authService.signIn(email, password)
        if (result.success) {
          if (rememberMe) localStorage.setItem('rememberedEmail', email)
          else localStorage.removeItem('rememberedEmail')
          const role = result.data?.role
          router.push(isAdminRole(role) ? '/admin' : '/dashboard')
        } else {
          setError(result.error || "Email yoki parol noto'g'ri")
        }
      } else {
        if (!name.trim()) {
          setError('Ism kiritilishi shart')
          setIsSubmitting(false)
          return
        }
        const result = await authService.signUp(email, password, name)
        if (result.success) {
          if (result.needsEmailConfirmation) {
            setSuccessMsg(
              "Ro'yxatdan o'tish muvaffaqiyatli! Tasdiqlash xati emailingizga yuborildi."
            )
            setMode('login')
            setTimeout(() => setSuccessMsg(''), 8000)
          } else {
            setSuccessMsg("Ro'yxatdan o'tish muvaffaqiyatli!")
            setTimeout(() => router.push('/dashboard'), 1500)
          }
        } else {
          setError(result.error || "Ro'yxatdan o'tish xatosi")
        }
      }
    } catch {
      setError('Xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Google ── */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      const result = await authService.signInWithGoogle()
      if (result.success && result.data) {
        const role = result.data.role
        router.push(isAdminRole(role) ? '/admin' : '/dashboard')
      } else if (result.error) {
        setError(result.error)
      }
    } catch {
      setError('Google orqali kirishda xatolik')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  /* ── Forgot password ── */
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Avval email manzilingizni kiriting')
      return
    }
    setIsSubmitting(true)
    try {
      const r = await authService.resetPassword(email)
      if (r.success) setSuccessMsg("Parolni tiklash bo'yicha email yuborildi!")
      else setError(r.error || 'Parolni tiklashda xatolik')
    } catch {
      setError('Xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Auth loading ── */
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BRAND.navy }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/40">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — Brand
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex relative min-h-screen overflow-hidden"
        style={{ background: BRAND.navy }}
      >
        {/* Abstract geometric background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.08) 0%, rgba(37,99,235,0.04) 40%, transparent 70%)',
            }}
          />

          {/* Geometric grid — subtle */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Abstract scales — wireframe style */}
          <svg
            viewBox="0 0 500 600"
            className="absolute right-[0%] top-[10%] w-[420px] opacity-[0.06]"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
          >
            {/* Pillar */}
            <line x1="250" y1="80" x2="250" y2="500" />
            {/* Crossbar */}
            <line x1="120" y1="130" x2="380" y2="130" />
            {/* Left chains */}
            <line x1="120" y1="130" x2="90" y2="240" />
            <line x1="120" y1="130" x2="150" y2="240" />
            {/* Left pan */}
            <ellipse cx="120" cy="260" rx="70" ry="18" />
            {/* Right chains */}
            <line x1="380" y1="130" x2="350" y2="220" />
            <line x1="380" y1="130" x2="410" y2="220" />
            {/* Right pan */}
            <ellipse cx="380" cy="240" rx="70" ry="18" />
            {/* Base */}
            <path d="M180 500 Q250 475 320 500" />
            <line x1="170" y1="505" x2="330" y2="505" />
            {/* Decorative rings */}
            <circle cx="250" cy="130" r="12" />
            <circle cx="250" cy="130" r="20" strokeDasharray="4 4" />
          </svg>

          {/* Floating geometric accent */}
          <svg
            viewBox="0 0 100 100"
            className="absolute right-[30%] top-[35%] w-[60px] opacity-[0.08]"
          >
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="none"
              stroke={BRAND.accent}
              strokeWidth="0.8"
            />
            <text
              x="50"
              y="56"
              textAnchor="middle"
              fill={BRAND.accent}
              fontSize="20"
              fontWeight="600"
              fontFamily="system-ui"
            >
              AI
            </text>
          </svg>

          {/* Accent glow orb */}
          <div
            className="absolute right-[25%] top-[30%] w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
            }}
          />

          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full w-full p-10 xl:p-12 max-w-[55%]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5.5 h-5.5"
                fill="none"
                stroke={BRAND.accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" />
                <path d="M12 8v8M9 12h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                JURIST<span className="text-indigo-400">IV</span>
              </h1>
              <p className="text-[10px] text-white/35 tracking-[0.3em] uppercase font-medium mt-0.5">
                Huquqiy AI Platformasi
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h2 className="text-[34px] xl:text-[40px] font-bold text-white leading-[1.15] mb-5">
              Huquqiy bilimlar
              <br />
              kelajagi –{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                AI
              </span>{' '}
              bilan
              <br />
              bugundan boshlanadi
            </h2>
            <p className="text-[14px] text-white/40 leading-relaxed max-w-[380px]">
              Sun'iy intellekt yordamida huquqiy tahlil qiling, hujjatlar yarating va
              bilimlaringizni yangi darajaga ko'taring.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-5 mb-auto">
            {FEATURES.map(f => (
              <div key={f.title} className="group flex items-start gap-3.5">
                <FeatureIcon icon={f.icon} color={f.color} />
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-[13px] font-semibold text-white/85 leading-tight">
                    {f.title}
                  </h3>
                  <p className="text-[12px] text-white/35 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            className="mt-8 flex items-center rounded-[14px] overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {[
              {
                icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
                value: liveStats.total_users,
                suffix: '+',
                label: 'FOYDALANUVCHILAR',
              },
              {
                icon: 'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
                value: liveStats.total_codes || 10,
                suffix: '+',
                label: 'KODEKSLAR',
              },
              {
                icon: 'M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z M9 12l2 2 4-4',
                value: 100,
                suffix: '%',
                label: 'XAVFSIZLIK',
              },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-2.5 px-5 py-3.5 flex-1">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-indigo-400/50 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d={s.icon} />
                </svg>
                <div>
                  <div className="text-[14px] font-bold text-white/85 leading-none">
                    {statsLoading ? (
                      '—'
                    ) : (
                      <AnimatedCounter value={s.value} suffix={s.suffix} compact />
                    )}
                  </div>
                  <div className="text-[8px] text-white/30 tracking-[0.15em] uppercase mt-1">
                    {s.label}
                  </div>
                </div>
                {i < 2 && <div className="w-px h-7 bg-white/8 ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Auth
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 relative"
        style={{ background: BRAND.offWhite }}
      >
        {/* Language selector — top right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all duration-200 border border-transparent hover:border-gray-200"
            aria-label="Tilni o'zgartirish"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            UZ
            <svg
              className="w-3 h-3 opacity-50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-[16px] mb-3"
              style={{
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.violet})`,
                boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" />
                <path d="M12 8v8M9 12h6" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-gray-900">JURISTIV</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">Huquqiy AI Platformasi</p>
          </div>

          {/* Auth Card */}
          <div
            className="bg-white rounded-[20px] p-7 sm:p-8"
            style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
              border: '1px solid #E8E8F0',
            }}
          >
            {/* Card icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.violet})`,
                  boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[20px] font-bold text-gray-900 text-center mb-1">Xush kelibsiz!</h2>
            <p className="text-[13px] text-gray-500 text-center mb-7">
              Hisobingizga kiring yoki yangi hisob yarating
            </p>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-[12px] p-1 mb-6">
              <button
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccessMsg('')
                }}
                className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3" />
                </svg>
                Kirish
              </button>
              <button
                onClick={() => {
                  setMode('register')
                  setError('')
                  setSuccessMsg('')
                }}
                className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Ro'yxatdan o'tish
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-[12px] bg-red-50 border border-red-100 text-[13px] text-red-600 flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-[12px] bg-emerald-50 border border-emerald-100 text-[13px] text-emerald-600 flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <AuthInput
                  label="Ismingiz"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Ismingizni kiriting"
                  icon={
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                />
              )}

              <AuthInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Email manzilingizni kiriting"
                required
                icon={
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                }
              />

              <AuthInput
                label="Parol"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Parolingizni kiriting"
                required
                minLength={6}
                icon={
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                }
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
              />

              {/* Remember + Forgot */}
              {mode === 'login' && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-[13px] text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Meni eslab qolish
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[13px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[48px] rounded-[12px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-2"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.violet})`,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kirilmoqda...
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="px-3 bg-white text-gray-400">yoki</span>
              </div>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full h-[46px] rounded-[12px] text-[14px] font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Google orqali kirish
            </button>
          </div>

          {/* Terms */}
          <p className="text-center text-[11px] text-gray-400 mt-5 leading-relaxed px-4">
            Davom etish orqali siz{' '}
            <button
              type="button"
              onClick={() => router.push('/terms')}
              className="text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
            >
              Xizmat ko'rsatish shartlari
            </button>{' '}
            va{' '}
            <button
              type="button"
              onClick={() => router.push('/privacy')}
              className="text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
            >
              Maxfiylik siyosati
            </button>{' '}
            bilan rozilik bildirasiz
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#0B1630' }}
        >
          <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
