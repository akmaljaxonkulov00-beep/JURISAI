'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { firebaseAuth } from '@/services/firebase-auth'
import { useAuth } from '@/app/providers'

// ═══════════════════════════════════════════════════════════════════════════
// 3D Interactive Floating Scene with Framer Motion
// ═══════════════════════════════════════════════════════════════════════════

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

function FloatingCard({ children, depth = 0, index = 0, mouseX, mouseY }: {
  children: React.ReactNode
  depth?: number
  index?: number
  mouseX: any
  mouseY: any
}) {
  const rotateX = useTransform(mouseY, [0, 1], [depth * 2, -depth * 2])
  const rotateY = useTransform(mouseX, [0, 1], [-depth * 2, depth * 2])
  const springRotateX = useSpring(rotateX, { stiffness: 80, damping: 12 })
  const springRotateY = useSpring(rotateY, { stiffness: 80, damping: 12 })

  const floatDuration = 5 + index * 1.3
  const floatDelay = index * 0.7

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: 1,
        y: [0, -8 - index * 2, 0],
        transition: {
          opacity: { duration: 0.6, delay: index * 0.15 },
          y: {
            duration: floatDuration,
            delay: floatDelay,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        perspective: 800,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.03,
        z: 30,
        transition: { type: 'spring', stiffness: 300, damping: 15 },
      }}
      className="relative group cursor-default"
    >
      <div
        className="relative rounded-2xl p-4 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.2)'
        }}
      >
        {/* Glass highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        {/* Group hover glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  )
}

function LegalShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function GavelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )
}

function ShineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.121 2.121m8.486 8.486l2.121 2.121M18.364 5.636l-2.121 2.121m-8.486 8.486l-2.121 2.121" />
    </svg>
  )
}

const floatingCards = [
  { icon: <LegalShieldIcon />, title: 'AI Huquqiy Agent', desc: 'O\'zbekiston qonunchiligi asosida maslahat', color: 'from-blue-400/30 to-blue-600/20', depth: 4 },
  { icon: <GavelIcon />, title: 'Virtual Sud AI', desc: 'Real vaqt rejimida sud simulyatsiyasi', color: 'from-emerald-400/30 to-emerald-600/20', depth: 6 },
  { icon: <FileIcon />, title: 'AI Hujjat Generator', desc: 'Da\'vo, shartnoma, ishonchnoma yarating', color: 'from-amber-400/30 to-amber-600/20', depth: 3 },
  { icon: <SearchIcon />, title: 'Smart Search', desc: 'Semantic va natural language qidiruv', color: 'from-purple-400/30 to-purple-600/20', depth: 7 },
  { icon: <NetworkIcon />, title: 'O\'zbekiston Qonunchiligi', desc: '10 ta kodeks, 3000+ modda, AI tahlil', color: 'from-cyan-400/30 to-cyan-600/20', depth: 5 },
  { icon: <ShineIcon />, title: 'AI Analitika', desc: 'Qonunlarni taqqoslash, risk analysis', color: 'from-rose-400/30 to-rose-600/20', depth: 8 },
]

function FloatingScene({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central glow */}
      <div className="absolute w-64 h-64 bg-gradient-to-r from-blue-500/15 to-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />

      {/* 3D Grid Cards — positioned in a ring around center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[420px] h-[420px]">
          {floatingCards.map((card, i) => {
            const angle = (i / floatingCards.length) * Math.PI * 2 - Math.PI / 2
            const radius = 170
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            const cardWidth = i % 2 === 0 ? 160 : 140
            const cardHeight = 80

            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px - ${cardWidth / 2}px)`,
                  top: `calc(50% + ${y}px - ${cardHeight / 2}px)`,
                  width: cardWidth,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
                }}
              >
                <FloatingCard depth={card.depth} index={i} mouseX={mouseX} mouseY={mouseY}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-white/90 leading-tight">{card.title}</h3>
                      <p className="text-[10px] text-white/50 mt-0.5 leading-tight">{card.desc}</p>
                    </div>
                  </div>
                </FloatingCard>
              </motion.div>
            )
          })}

          {/* Center logo */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
            style={{ rotateX: useSpring(useTransform(mouseY, [0, 1], [5, -5]), { stiffness: 100 }), rotateY: useSpring(useTransform(mouseX, [0, 1], [-5, 5]), { stiffness: 100 }) }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/30 to-emerald-500/30 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <LegalShieldIcon />
            </div>
          </motion.div>
        </div>
      </div>
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
  const [mouseSpeed, setMouseSpeed] = useState(0)
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 })
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
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
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x)
    mouseY.set(y)
    setMousePos({ x: e.clientX, y: e.clientY })
    const now = Date.now()
    const last = lastMousePos.current
    const dt = Math.max(16, now - last.time)
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    const speed = Math.sqrt(dx * dx + dy * dy) / dt * 10
    setMouseSpeed(Math.min(speed, 5))
    lastMousePos.current = { x: e.clientX, y: e.clientY, time: now }
  }, [mouseX, mouseY])

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

      {/* ═══ LEFT PANEL — 3D Floating Scene (desktop only) ═══ */}
      <div className="hidden lg:block relative min-h-screen bg-gradient-to-br from-zinc-900 via-blue-950 to-emerald-950 overflow-hidden">
        {/* Depth layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.05)_0%,transparent_60%)]" />
        
        {/* Animated grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Floating Particles via Canvas */}
        <div className="absolute inset-0">
          <ShieldCanvas mousePos={mousePos} />
        </div>

        {/* Floating 3D Scene */}
        <div className="absolute inset-0 z-10">
          <FloatingScene mouseX={mouseX} mouseY={mouseY} />
        </div>

        {/* Overlay text at top */}
        <div className="absolute z-10 top-12 left-0 right-0 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold text-white"
          >
            JURISAI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-blue-200/60 text-sm mt-1"
          >
            Huquqiy AI Platformasi
          </motion.p>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute z-10 bottom-8 left-0 right-0 flex items-center justify-center gap-8"
        >
          <div className="text-center">
            <div className="text-xl font-bold text-white">50K+</div>
            <div className="text-blue-200/60 text-[10px]">Faol foydalanuvchilar</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-xl font-bold text-white">10</div>
            <div className="text-blue-200/60 text-[10px]">Qonun kodekslari</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-xl font-bold text-white">1M+</div>
            <div className="text-blue-200/60 text-[10px]">AI so'rovlari</div>
          </div>
        </motion.div>
      </div>

      {/* ═══ RIGHT PANEL: Login / Register Form ═══ */}
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-md mx-auto">

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
