'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/supabase-auth'
import { isAdminRole } from '@/lib/roles'
import { useAuth } from '@/app/providers'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import AnimatedCounter from '@/components/AnimatedCounter'

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE ICONS
// ═══════════════════════════════════════════════════════════════════════════

function ServiceIcon({ d, color }: { d: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke={color} strokeWidth="1.5">
        <path d={d} />
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES DATA
// ═══════════════════════════════════════════════════════════════════════════

const SERVICES = [
  {
    title: 'AI Huquqiy Agent',
    desc: "O'zingiz uchun AI asosida huquqiy yordamchi",
    color: '#7C3AED',
    d: 'M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6v3a1 1 0 001 1h6a1 1 0 001-1v-3c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z M10 21h4 M12 2v3',
  },
  {
    title: 'AI Hujjat Generator',
    desc: "Shartnomalar, da'vo va boshqa hujjatlarni avtomatik yaratish",
    color: '#2563EB',
    d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9',
  },
  {
    title: 'Qonunchilik Bazasi',
    desc: "O'zbekiston qonunlari va kodekslariga tezkor kirish",
    color: '#0D9488',
    d: 'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z M12 2v16',
  },
  {
    title: 'Virtual Sud AI',
    desc: 'Sud jarayonlarini simulyatsiya qiling va tahlil qiling',
    color: '#D97706',
    d: 'M12 2v20 M3 12h18 M6 6l3 3 M18 6l-3 3 M7 10v3c0 2 3.5 3.5 8 3.5s8-1.5 8-3.5v-3 M7 10l-2 5h1.5c1.5 0 2.5-.5 2.5-1V11 M23 10l2 5h-1.5c-1.5 0-2.5-.5-2.5-1V11',
  },
  {
    title: 'AI Analitika',
    desc: "Huquqiy tahlil va statistik ma'lumotlar",
    color: '#4F46E5',
    d: 'M3 3v18h18 M7 16l4-8 4 4 4-6 M7 16l1.5 1.5 M11 8l1.5 1.5 M15 12l1.5 1.5 M19 6l1.5 1.5',
  },
  {
    title: 'Smart Huquqiy Qidiruv',
    desc: "Tezkor va aniq huquqiy ma'lumotlar izlash",
    color: '#DC2626',
    d: 'M11 3a8 8 0 100 16 8 8 0 000-16z M21 21l-4.35-4.35 M11 3a8 8 0 010 16 M11 7v4l3 2',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SIGN IN CONTENT
// ═══════════════════════════════════════════════════════════════════════════

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/logo', { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.logoUrl) setLogoUrl(data.logoUrl)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const errParam = searchParams?.get('error')
    if (errParam) setError(decodeURIComponent(errParam))
    const linked = searchParams?.get('linked')
    if (linked === '1') {
      setSuccessMsg('Akkauntlaringiz birlashtirildi!')
    }
  }, [searchParams])

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

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[58fr_42fr]">
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex relative min-h-screen overflow-hidden bg-[#0A0E27]">
        {/* Hero illustration background */}
        <div className="absolute inset-0">
          {/* Dark courthouse image overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%231a1f3a'/%3E%3Cstop offset='1' stop-color='%230A0E27'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='600'/%3E%3Crect x='350' y='100' width='100' height='400' fill='%231a2040' opacity='0.5' rx='4'/%3E%3Crect x='300' y='80' width='200' height='30' fill='%231a2040' opacity='0.4' rx='4'/%3E%3Crect x='280' y='70' width='240' height='15' fill='%231a2040' opacity='0.3' rx='4'/%3E%3Crect x='500' y='150' width='80' height='350' fill='%231a2040' opacity='0.4' rx='4'/%3E%3Crect x='220' y='150' width='80' height='350' fill='%231a2040' opacity='0.4' rx='4'/%3E%3Crect x='150' y='200' width='500' height='8' fill='%231a2040' opacity='0.2' rx='4'/%3E%3Crect x='150' y='380' width='500' height='8' fill='%231a2040' opacity='0.2' rx='4'/%3E%3C/svg%3E\")",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Glowing scales illustration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 320, height: 380 }}>
              {/* Glow ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 280,
                  height: 280,
                  left: 20,
                  top: 50,
                  background:
                    'radial-gradient(circle, rgba(79,127,255,0.15) 0%, rgba(79,127,255,0.05) 40%, transparent 70%)',
                  border: '1px solid rgba(79,127,255,0.1)',
                }}
              />
              {/* Scales SVG */}
              <svg
                viewBox="0 0 200 240"
                className="absolute inset-0 w-full h-full"
                style={{ filter: 'drop-shadow(0 0 20px rgba(79,127,255,0.3))' }}
              >
                <defs>
                  <linearGradient id="scaleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                {/* Central pillar */}
                <rect x="96" y="30" width="8" height="160" rx="4" fill="url(#scaleGrad)" />
                {/* Top beam */}
                <rect x="40" y="45" width="120" height="4" rx="2" fill="url(#scaleGrad)" />
                {/* Left pan chains */}
                <line
                  x1="50"
                  y1="49"
                  x2="35"
                  y2="90"
                  stroke="#4F7FFF"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                <line
                  x1="50"
                  y1="49"
                  x2="65"
                  y2="90"
                  stroke="#4F7FFF"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                {/* Left pan */}
                <ellipse
                  cx="50"
                  cy="95"
                  rx="25"
                  ry="8"
                  fill="none"
                  stroke="#4F7FFF"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <ellipse cx="50" cy="95" rx="25" ry="8" fill="rgba(79,127,255,0.1)" />
                {/* Right pan chains */}
                <line
                  x1="150"
                  y1="49"
                  x2="135"
                  y2="110"
                  stroke="#7C3AED"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                <line
                  x1="150"
                  y1="49"
                  x2="165"
                  y2="110"
                  stroke="#7C3AED"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                {/* Right pan */}
                <ellipse
                  cx="150"
                  cy="115"
                  rx="25"
                  ry="8"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <ellipse cx="150" cy="115" rx="25" ry="8" fill="rgba(124,58,237,0.1)" />
                {/* Base */}
                <rect x="70" y="190" width="60" height="6" rx="3" fill="url(#scaleGrad)" />
                <rect
                  x="80"
                  y="196"
                  width="40"
                  height="4"
                  rx="2"
                  fill="url(#scaleGrad)"
                  opacity="0.7"
                />
              </svg>
              {/* Floating particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 3 + Math.random() * 3,
                    height: 3 + Math.random() * 3,
                    background: i % 2 === 0 ? '#4F7FFF' : '#7C3AED',
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                    opacity: 0.4 + Math.random() * 0.3,
                    boxShadow: `0 0 ${6 + Math.random() * 6}px ${i % 2 === 0 ? 'rgba(79,127,255,0.5)' : 'rgba(124,58,237,0.5)'}`,
                    animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
          </div>
          {/* Gavel silhouette */}
          <div className="absolute bottom-32 right-16 opacity-20">
            <svg
              viewBox="0 0 60 80"
              className="w-16 h-20"
              fill="none"
              stroke="#4F7FFF"
              strokeWidth="1.5"
            >
              <rect x="25" y="10" width="10" height="50" rx="3" />
              <rect x="15" y="5" width="30" height="12" rx="4" />
              <rect x="10" y="60" width="40" height="8" rx="3" />
            </svg>
          </div>
          {/* Books */}
          <div className="absolute bottom-8 right-8 opacity-25">
            <svg viewBox="0 0 120 70" className="w-28">
              <rect
                x="5"
                y="10"
                width="110"
                height="20"
                rx="2"
                fill="#1a2040"
                stroke="#4F7FFF"
                strokeWidth="0.5"
              />
              <text
                x="60"
                y="24"
                textAnchor="middle"
                fill="#D4AF37"
                fontSize="7"
                fontFamily="serif"
                fontWeight="bold"
              >
                LAW
              </text>
              <rect
                x="10"
                y="32"
                width="100"
                height="18"
                rx="2"
                fill="#1a2040"
                stroke="#7C3AED"
                strokeWidth="0.5"
              />
              <text
                x="60"
                y="44"
                textAnchor="middle"
                fill="#C0C0C0"
                fontSize="5"
                fontFamily="serif"
              >
                THE SIGN OF JUSTICE
              </text>
              <rect
                x="15"
                y="52"
                width="90"
                height="14"
                rx="2"
                fill="#1a2040"
                stroke="#4F7FFF"
                strokeWidth="0.3"
              />
            </svg>
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col h-full w-full p-8 lg:p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(79,127,255,0.15)',
                border: '1px solid rgba(79,127,255,0.3)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="#4F7FFF"
                strokeWidth="1.5"
              >
                <path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" />
                <path d="M12 8v8M9 12h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                JURIST<span className="text-indigo-400">IV</span>
              </h1>
              <p className="text-[10px] text-white/40 tracking-[0.25em] uppercase font-light">
                Huquqiy AI Platformasi
              </p>
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              Huquqiy bilimlar
              <br />
              kelajagi – <span className="text-indigo-400">AI</span> bilan
              <br />
              bugundan boshlanadi
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-md">
              Sun'iy intellekt yordamida huquqiy tahlil qiling, hujjatlar yarating va
              bilimlaringizni yangi darajaga ko'taring.
            </p>
          </div>

          {/* Services — 2 columns × 3 rows */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-auto">
            {SERVICES.map(s => (
              <div key={s.title} className="flex items-start gap-2.5">
                <ServiceIcon d={s.d} color={s.color} />
                <div className="min-w-0">
                  <h3 className="text-[11px] font-semibold text-white/90 leading-tight">
                    {s.title}
                  </h3>
                  <p className="text-[9px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div
            className="mt-8 flex items-center justify-center gap-0 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
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
              <div key={s.label} className="flex items-center gap-2.5 px-5 py-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-indigo-400/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d={s.icon} />
                </svg>
                <div>
                  <div className="text-sm font-bold text-white/90">
                    {statsLoading ? (
                      '—'
                    ) : (
                      <AnimatedCounter value={s.value} suffix={s.suffix} compact />
                    )}
                  </div>
                  <div className="text-[8px] text-white/35 tracking-wider uppercase">{s.label}</div>
                </div>
                {i < 2 && <div className="w-px h-6 bg-white/10 ml-3" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — LOGIN / REGISTER FORM
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="signin-right-panel min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <style>{`
          @media (prefers-color-scheme: light) {
            .signin-right-panel { background: #F7F8FC; }
          }
          @media (prefers-color-scheme: dark) {
            .signin-right-panel { background: #111827; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
        `}</style>

        <div className="w-full max-w-[400px] mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg mb-3">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" />
                <path d="M12 8v8M9 12h6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">JURISTIV</h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Huquqiy AI Platformasi
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-7 sm:p-8">
            {/* Center icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0A0E27, #1a2040)',
                  boxShadow: '0 0 20px rgba(79,127,255,0.15)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  stroke="#4F7FFF"
                  strokeWidth="1.5"
                >
                  <path d="M12 2v20M3 12h18" />
                  <path d="M6 6l3 3M18 6l-3 3" />
                  <circle cx="6" cy="10" r="1" />
                  <circle cx="18" cy="10" r="1" />
                  <path d="M8 18c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 0z" />
                  <path d="M12 18c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
              Xush kelibsiz!
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-6">
              Hisobingizga kiring yoki yangi hisob yarating
            </p>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 mb-6">
              <button
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccessMsg('')
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${mode === 'login' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
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
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${mode === 'register' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
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

            {/* Error / Success */}
            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
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
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Ismingiz
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ismingizni kiriting"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email manzilingizni kiriting"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Parolingizni kiriting"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
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
                </div>
              </div>

              {/* Remember + Forgot */}
              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Meni eslab qolish
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              )}

              {/* Submit — arrow on RIGHT */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #4F7FFF, #7C3AED)',
                  boxShadow: '0 4px 15px rgba(79,127,255,0.3)',
                }}
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

            {/* Divider + Google */}
            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500">
                    yoki
                  </span>
                </div>
              </div>
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-gray-400 dark:text-zinc-500 mt-4 leading-relaxed px-4">
            Davom etish orqali siz{' '}
            <button
              type="button"
              onClick={() => router.push('/terms')}
              className="text-indigo-500 hover:text-indigo-600 underline font-medium"
            >
              Xizmat ko'rsatish shartlari
            </button>{' '}
            va{' '}
            <button
              type="button"
              onClick={() => router.push('/privacy')}
              className="text-indigo-500 hover:text-indigo-600 underline font-medium"
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

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
