'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { firebaseAuth } from '@/services/firebase-auth'
import { useAuth } from '@/app/providers'

// ═══════════════════════════════════════════════════════════════════════════
// 3D Interactive Legal Shield Canvas
// ═══════════════════════════════════════════════════════════════════════════

function ShieldCanvas({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let time = 0
    const particles: {
      x: number; y: number; vx: number; vy: number
      size: number; alpha: number; pulse: number
      orbitAngle: number; orbitSpeed: number; orbitRadius: number
    }[] = []
    const PARTICLE_COUNT = 90

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2
      const radius = 60 + Math.random() * 150
      particles.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        orbitAngle: angle,
        orbitSpeed: (0.001 + Math.random() * 0.003) * (i % 2 === 0 ? 1 : -1),
        orbitRadius: radius,
      })
    }

    const cx = () => canvas.width / 2
    const cy = () => canvas.height / 2

    const drawShield = (isDark: boolean) => {
      const shieldX = cx()
      const shieldY = cy() - 10
      const pulseScale = 1 + 0.02 * Math.sin(time * 0.5)

      const glow = ctx.createRadialGradient(shieldX, shieldY, 30, shieldX, shieldY, 130)
      glow.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)')
      glow.addColorStop(0.5, isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)')
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(shieldX, shieldY)
      ctx.scale(pulseScale, pulseScale)

      const sw = 80, sh = 100
      ctx.beginPath()
      ctx.moveTo(0, -sh / 2)
      ctx.lineTo(sw / 2, -sh / 4)
      ctx.lineTo(sw / 2, sh / 4)
      ctx.quadraticCurveTo(sw / 2, sh / 2 + 10, 0, sh / 2 + 20)
      ctx.quadraticCurveTo(-sw / 2, sh / 2 + 10, -sw / 2, sh / 4)
      ctx.lineTo(-sw / 2, -sh / 4)
      ctx.closePath()

      const grad = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0)
      grad.addColorStop(0, isDark ? '#1D4ED8' : '#2563EB')
      grad.addColorStop(0.5, isDark ? '#10B981' : '#059669')
      grad.addColorStop(1, isDark ? '#1D4ED8' : '#2563EB')
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.12 + 0.04 * Math.sin(time * 0.8)
      ctx.fill()

      ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(37, 99, 235, 0.15)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-12, 8)
      ctx.lineTo(-12, -8)
      ctx.moveTo(12, 8)
      ctx.lineTo(12, -8)
      ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(37, 99, 235, 0.25)'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(0, -4, 4 + 1.5 * Math.sin(time), 0, Math.PI)
      ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.restore()
    }

    const animate = () => {
      time += 0.02
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark = document.documentElement.classList.contains('dark')
      drawShield(isDark)

      particles.forEach((p) => {
        p.orbitAngle += p.orbitSpeed
        const targetX = cx() + Math.cos(p.orbitAngle) * p.orbitRadius
        const targetY = cy() - 10 + Math.sin(p.orbitAngle) * p.orbitRadius * 0.7
        p.x += (targetX - p.x) * 0.02 + p.vx
        p.y += (targetY - p.y) * 0.02 + p.vy
        p.pulse += 0.03

        const dx = mousePos.x - p.x
        const dy = mousePos.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.05
          p.x -= dx * force
          p.y -= dy * force
        }

        const alpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? `rgba(96, 165, 250, ${alpha})` : `rgba(37, 99, 235, ${alpha})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i += 3) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j += 3) {
          const p2 = particles[j]
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const dist2 = Math.sqrt(dx * dx + dy * dy)
          if (dist2 < 120) {
            const la = (1 - dist2 / 120) * 0.1
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = isDark ? `rgba(96, 165, 250, ${la})` : `rgba(37, 99, 235, ${la})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animate()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [mousePos])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ═══════════════════════════════════════════════════════════════════════════
// Floating Badge
// ═══════════════════════════════════════════════════════════════════════════

function GlowingBadge({
  icon, text, className, delay = 0
}: {
  icon: React.ReactNode; text: string; className?: string; delay?: number
}) {
  return (
    <div
      className={`hidden lg:flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass-card shadow-lg border border-white/20 backdrop-blur-md whitespace-nowrap ${className || ''}`}
      style={{ animation: `floatBadge 7s ease-in-out ${delay}s infinite` }}
    >
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-800 dark:text-white">{text}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Main SignIn Content
// ═══════════════════════════════════════════════════════════════════════════

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  // Handle Google OAuth redirect on mount
  useEffect(() => {
    firebaseAuth.handleRedirectResult().then(result => {
      if (result.success && result.data) {
        const emailNorm = result.data.email?.toLowerCase().trim()
        router.push(emailNorm === 'akmaljaxonkulov00@gmail.com' ? '/admin' : (searchParams.get('redirectTo') || '/dashboard'))
      }
    }).catch(() => { })
  }, [router, searchParams])

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.role === 'ADMIN' || user.email?.toLowerCase() === 'akmaljaxonkulov00@gmail.com' ? '/admin' : '/dashboard')
    }
  }, [user, authLoading, router])

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) { setEmail(remembered); setRememberMe(true) }
  }, [])

  // ── Email/Password Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await firebaseAuth.signIn(email, password)
        if (result.success) {
          if (rememberMe) localStorage.setItem('rememberedEmail', email)
          else localStorage.removeItem('rememberedEmail')

          const emailNorm = result.data?.email?.toLowerCase().trim()
          router.push(emailNorm === 'akmaljaxonkulov00@gmail.com' ? '/admin' : '/dashboard')
        } else {
          setError(result.error || "Email yoki parol noto'g'ri")
        }
      } else {
        if (!name.trim()) { setError("Ism kiritilishi shart"); setIsSubmitting(false); return }
        const result = await firebaseAuth.signUp(email, password, name)
        if (result.success) {
          setSuccessMsg("Ro'yxatdan o'tish muvaffaqiyatli!")
          setTimeout(() => router.replace('/dashboard'), 1500)
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

  // ── Google Login ──
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      const result = await firebaseAuth.signInWithGoogle()
      if (result.success && result.data) {
        const emailNorm = result.data.email?.toLowerCase().trim()
        router.push(emailNorm === 'akmaljaxonkulov00@gmail.com' ? '/admin' : '/dashboard')
      } else if (result.error) {
        setError(result.error)
      }
    } catch {
      setError('Google orqali kirishda xatolik')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // ── Forgot Password ──
  const handleForgotPassword = async () => {
    if (!email) { setError('Avval email manzilingizni kiriting'); return }
    setIsSubmitting(true)
    try {
      const result = await firebaseAuth.resetPassword(email)
      if (result.success) setSuccessMsg("Parolni tiklash bo'yicha email yuborildi!")
      else setError(result.error || 'Parolni tiklashda xatolik')
    } catch { setError('Xatolik yuz berdi') }
    finally { setIsSubmitting(false) }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2" onMouseMove={handleMouseMove}>

      {/* ═══ LEFT PANEL (desktop only) ═══ */}
      <div className="hidden lg:block relative min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-green-700 overflow-hidden">
        {/* Animated orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

        {/* Canvas */}
        <div className="absolute inset-0 z-10">
          <ShieldCanvas mousePos={mousePos} />
        </div>

        {/* Badges — positioned relatively within the panel, not with global % */}
        <div className="absolute z-20 inset-0">
          <GlowingBadge
            icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l9 4.5v7c0 4.5-4 8.5-9 9-5-0.5-9-4.5-9-9v-7l9-4.5z" /></svg>}
            text="10,000+ Yuridik Hujjatlar"
            className="absolute left-[8%] top-[20%]"
            delay={0}
          />
          <GlowingBadge
            icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
            text="O'zR Qonunchiligiga 100% Mos AI"
            className="absolute right-[8%] top-[15%]"
            delay={0.8}
          />
          <GlowingBadge
            icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>}
            text="Virtual Sud Simulyatori"
            className="absolute right-[8%] bottom-[30%]"
            delay={2}
          />
          <GlowingBadge
            icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>}
            text="8 ta Qonun Kodeksi"
            className="absolute left-[8%] top-[65%]"
            delay={1.2}
          />
          <GlowingBadge
            icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /><path d="M3 6l3-3M3 6l3 3" /></svg>}
            text="IRAC Huquqiy Tahlil"
            className="absolute left-[35%] top-[8%]"
            delay={1.5}
          />
        </div>

        {/* Center text */}
        <div className="absolute z-20 inset-0 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-white text-center leading-tight">
            Huquqiy AI<br />Yordamchingiz
          </h2>
          <p className="text-blue-100/70 text-sm text-center max-w-xs mt-3">
            O'zbekiston qonunchiligi bo'yicha eng zamonaviy sun'iy intellekt tizimi
          </p>
        </div>

        {/* Bottom stats */}
        <div className="absolute z-20 bottom-8 left-0 right-0 flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-xl font-bold text-white">50K+</div>
            <div className="text-blue-200/60 text-[10px]">Faol foydalanuvchilar</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-xl font-bold text-white">8</div>
            <div className="text-blue-200/60 text-[10px]">Qonun kodekslari</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-xl font-bold text-white">1M+</div>
            <div className="text-blue-200/60 text-[10px]">AI so'rovlari</div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Login / Register Form ═══ */}
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-[400px] mx-auto">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg mb-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">JURISAI</h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Huquqiy AI yordamchingiz</p>
          </div>

          {/* Glass Form Card */}
          <div className="relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/15 to-green-500/15 dark:from-blue-500/10 dark:to-green-500/10 rounded-2xl blur-xl" />

            <div className="relative p-6 sm:p-7 rounded-2xl glass-card shadow-xl border border-gray-200/50 dark:border-zinc-700/50 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70">
              {/* Mode Toggle */}
              <div className="flex mb-5 bg-gray-100/80 dark:bg-zinc-800/80 rounded-lg p-0.5">
                <button onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}>
                  <svg className="w-3.5 h-3.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3" />
                  </svg>
                  Kirish
                </button>
                <button onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'register'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}>
                  <svg className="w-3.5 h-3.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Ro'yxatdan o'tish
                </button>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50/90 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-green-50/90 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {successMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Ism Familiya</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                      </svg>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Email</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Parol</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" required minLength={6}
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                      {showPassword
                        ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot Password */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-600 dark:text-zinc-400">Meni eslab qol</span>
                    </label>
                    <button type="button" onClick={handleForgotPassword}
                      className="text-xs text-blue-600 hover:text-blue-500 font-medium" disabled={isSubmitting}>
                      Parolni unutdingizmi?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-sm font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3" />
                    </svg>
                  )}
                  {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-zinc-700" /></div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-2 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500">yoki</span>
                </div>
              </div>

              {/* Google Button */}
              <button onClick={handleGoogleLogin} disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-750 transition-all disabled:opacity-60 hover:shadow-sm active:scale-[0.98]">
                {isGoogleLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Google orqali kirish
              </button>

              {/* Mode Switch */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {mode === 'login' ? (
                    <>Hisobingiz yo'qmi?{' '}
                      <button onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }} className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                        Ro'yxatdan o'ting
                      </button>
                    </>
                  ) : (
                    <>Hisobingiz bormi?{' '}
                      <button onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }} className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                        Kiring
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-gray-400 dark:text-zinc-500 mt-4">
            Davom etish orqali siz{' '}
            <a href="/terms" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Foydalanish shartlari</a>
            {' '}va{' '}
            <a href="/privacy" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Maxfiylik siyosati</a>
            {' '}ga rozilik bildirasiz
          </p>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .dark .glass-card {
          background: rgba(11, 17, 33, 0.85);
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page Export
// ═══════════════════════════════════════════════════════════════════════════

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
