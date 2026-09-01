'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/supabase-auth'
import { isAdminRole } from '@/lib/roles'
import { useAuth } from '@/app/providers'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import AnimatedCounter from '@/components/AnimatedCounter'

import { motion, useSpring, useTransform, useMotionValue, type MotionValue } from 'framer-motion'
import type { PlatformStats } from '@/hooks/useRealtimeStats'

// ═══════════════════════════════════════════════════════════════════════════
// ICONS (Premium Legal-themed SVG)
// ═══════════════════════════════════════════════════════════════════════════

function ScaleIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2v20M3 12h18" />
      <path d="M6 6l3 3M18 6l-3 3" />
      <circle cx="6" cy="10" r="1" />
      <circle cx="18" cy="10" r="1" />
      <path d="M8 18c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 0z" />
      <path d="M12 18c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 0z" />
    </svg>
  )
}

function BrainIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6v3a1 1 0 001 1h6a1 1 0 001-1v-3c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z" />
      <path d="M10 21h4" />
      <path d="M12 2v3" />
      <circle cx="12" cy="9" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

function FileTextIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <circle cx="11" cy="11" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

function BookIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M12 2v16" opacity="0.3" />
    </svg>
  )
}

function ChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 4-6" />
      <circle cx="7" cy="16" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="11" cy="8" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="19" cy="6" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HEXAGONAL LAYOUT — 6 cards at exact 60° intervals, radius 200px
// ═══════════════════════════════════════════════════════════════════════════

const HEX_RADIUS = 200
const HEX_NODES = [
  {
    id: 'court',
    icon: <ScaleIcon className="w-5 h-5" />,
    title: 'Virtual Sud AI',
    desc: 'Sud jarayonlarini simulyatsiya qilish',
    accent: '#06b6d4',
    route: '/virtual-court',
  },
  {
    id: 'brain',
    icon: <BrainIcon className="w-5 h-5" />,
    title: 'AI Huquqiy Agent',
    desc: "O'zR qonunchiligi asosida AI yordamchi",
    accent: '#6366f1',
    route: '/ai-assistant',
  },
  {
    id: 'docs',
    icon: <FileTextIcon className="w-5 h-5" />,
    title: 'AI Hujjat Generator',
    desc: "Da'vo va shartnomalarni avtomatik yaratish",
    accent: '#f59e0b',
    route: '/document-generator',
  },
  {
    id: 'laws',
    icon: <BookIcon className="w-5 h-5" />,
    title: "O'zbekiston Qonunchiligi",
    desc: 'Kodekslar va normativ hujjatlar bazasi',
    accent: '#10b981',
    route: '/legal-database-new',
  },
  {
    id: 'search',
    icon: <SearchIcon className="w-5 h-5" />,
    title: 'Smart Huquqiy Qidiruv',
    desc: "Sun'iy intellekt bilan semantik qidiruv",
    accent: '#8b5cf6',
    route: '/legal-database-new',
  },
  {
    id: 'analytics',
    icon: <ChartIcon className="w-5 h-5" />,
    title: 'AI Analitika',
    desc: 'Huquqiy tahlil va bashoratli tavsiyalar',
    accent: '#ef4444',
    route: '/statistics',
  },
].map((n, i) => {
  const angle = (i * 60 - 90) * (Math.PI / 180) // 12 o'clock, clockwise
  return {
    ...n,
    x: Math.round(HEX_RADIUS * Math.sin(angle)),
    y: Math.round(-HEX_RADIUS * Math.cos(angle)),
  }
})

// SVG paths: center→node + ring edges
const HEX_LINES: string[] = [
  ...HEX_NODES.map(n => `M0,0 L${n.x},${n.y}`),
  ...HEX_NODES.map((n, i) => {
    const next = HEX_NODES[(i + 1) % HEX_NODES.length]
    return `M${n.x},${n.y} L${next.x},${next.y}`
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE FIELD — Parallax mouse-reactive dots
// ═══════════════════════════════════════════════════════════════════════════

function ParticleField({
  mouseX,
  mouseY,
}: {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}) {
  const particles = useRef(
    [...Array(40)].map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${5 + Math.random() * 90}%`,
      size: 1.5 + Math.random() * 2.5,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 6,
      parallaxFactor: 0.3 + Math.random() * 0.7,
      opacity: 0.06 + Math.random() * 0.2,
    }))
  ).current

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(147,197,253,0.7), transparent)',
            boxShadow: `0 0 ${p.size * 4}px rgba(147,197,253,0.2)`,
            x: useTransform(mouseX, [0, 1], [-p.parallaxFactor * 15, p.parallaxFactor * 15]),
            y: useTransform(mouseY, [0, 1], [-p.parallaxFactor * 15, p.parallaxFactor * 15]),
          }}
          animate={{
            opacity: [p.opacity * 0.2, p.opacity, p.opacity * 0.2],
            scale: [0.5, 1.4, 0.5],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING ECO-CARD — Glassmorphism with stagger + hover
// ═══════════════════════════════════════════════════════════════════════════

function EcoCard({
  node,
  index,
  mouseX,
  mouseY,
  onNavigate,
}: {
  node: (typeof HEX_NODES)[number]
  index: number
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  onNavigate: (href: string) => void
}) {
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), { stiffness: 60, damping: 16 })
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), { stiffness: 60, damping: 16 })

  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${node.x}px - 76px)`,
        top: `calc(50% + ${node.y}px - 38px)`,
        width: 152,
        rotateX,
        rotateY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: 0.4 + index * 0.12,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        scale: 1.06,
        z: 40,
        transition: { type: 'spring', stiffness: 300, damping: 15 },
      }}
    >
      <button onClick={() => onNavigate(node.route)} className="w-full text-left group">
        <div
          className="relative rounded-2xl p-3.5 backdrop-blur-xl border border-white/[0.12] shadow-2xl overflow-hidden transition-all duration-500 group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${node.accent}15, ${node.accent}08, transparent)`,
            }}
          />
          {/* Bottom reflection */}
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10 flex items-start gap-2.5">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${node.accent}50, ${node.accent}20)`,
                color: node.accent,
                boxShadow: `0 2px 12px ${node.accent}25`,
              }}
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
            >
              {node.icon}
            </motion.div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[11px] font-semibold text-white/90 leading-tight">
                {node.title}
              </h3>
              <p className="text-[9px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">
                {node.desc}
              </p>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CENTER ORB — Hero element with breathing + slow rotation
// ═══════════════════════════════════════════════════════════════════════════

function CenterOrb({
  mouseX,
  mouseY,
}: {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}) {
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), { stiffness: 70, damping: 16 })
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), { stiffness: 70, damping: 16 })

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 14 }}
      style={{ rotateX, rotateY, perspective: 1000, transformStyle: 'preserve-3d' }}
    >
      {/* Outer glow — breathing */}
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width: 160, height: 160, left: -32, top: -32 }}
        animate={{
          background: [
            'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
            'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(59,130,246,0.10) 40%, transparent 70%)',
            'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
          ],
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Crystal orb */}
      <motion.div
        className="relative rounded-2xl backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-center overflow-hidden"
        style={{
          width: 100,
          height: 100,
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 50%, rgba(99,102,241,0.10) 100%)',
          boxShadow:
            '0 0 40px rgba(99,102,241,0.12), 0 12px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {/* Inner reflections */}
        <div className="absolute top-2.5 left-3.5 w-5 h-3.5 rounded-full bg-white/25 blur-sm rotate-[-30deg]" />
        <div className="absolute bottom-2.5 right-3.5 w-3 h-1.5 rounded-full bg-white/15 blur-sm" />

        {/* Scales of justice icon */}
        <svg
          viewBox="0 0 32 32"
          className="w-8 h-8 relative z-10"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.3))' }}
        >
          <path d="M16 4v24" />
          <path d="M12 7h8" />
          <path d="M8 12l8-2.5 8 2.5" />
          <path d="M7 12v3.5c0 2.2 4 3.5 9 3.5s9-1.3 9-3.5V12" />
          <path d="M7 12l-2 6a.5.5 0 00.5.5h1.5c1.7 0 3-.6 3-1.2V13" />
          <path d="M25 12l2 6a.5.5 0 01-.5.5h-1.5c-1.7 0-3-.6-3-1.2V13" />
          <path d="M12 28h8" />
        </svg>
      </motion.div>

      {/* Pulse rings */}
      <motion.div
        className="absolute rounded-full border border-indigo-400/20 pointer-events-none"
        style={{ width: 120, height: 120, left: -10, top: -10 }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full border border-blue-400/12 pointer-events-none"
        style={{ width: 140, height: 140, left: -20, top: -20 }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
      />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING SCENE — Full hexagonal ecosystem
// ═══════════════════════════════════════════════════════════════════════════

function FloatingScene({
  mouseX,
  mouseY,
  onNavigate,
}: {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  onNavigate: (href: string) => void
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central ambient glow */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 35%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="relative"
        style={{ width: HEX_RADIUS * 2 + 160, height: HEX_RADIUS * 2 + 160 }}
      >
        {/* SVG connection lines — stroke-dasharray animation */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`${-HEX_RADIUS - 80} ${-HEX_RADIUS - 80} ${(HEX_RADIUS + 80) * 2} ${(HEX_RADIUS + 80) * 2}`}
          style={{ overflow: 'visible' }}
        >
          {HEX_LINES.map((d, idx) => {
            const isCenterLine = idx < 6
            return (
              <motion.path
                key={idx}
                d={d}
                stroke={isCenterLine ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)'}
                strokeWidth={isCenterLine ? 1.2 : 0.7}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.8, delay: 0.2 + idx * 0.04, ease: 'easeInOut' }}
              />
            )
          })}
        </svg>

        {/* Hexagonal cards */}
        {HEX_NODES.map((node, i) => (
          <EcoCard
            key={node.id}
            node={node}
            index={i}
            mouseX={mouseX}
            mouseY={mouseY}
            onNavigate={onNavigate}
          />
        ))}

        {/* Center orb */}
        <CenterOrb mouseX={mouseX} mouseY={mouseY} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SIGN IN CONTENT
// ═══════════════════════════════════════════════════════════════════════════

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { stats: liveStats, loading: statsLoading } = useRealtimeStats()

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

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

  // Load logo from admin settings
  useEffect(() => {
    fetch('/api/settings/logo', { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.logoUrl) setLogoUrl(data.logoUrl)
      })
      .catch(() => {})
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width)
      mouseY.set((e.clientY - rect.top) / rect.height)
    },
    [mouseX, mouseY]
  )

  // OAuth error params
  useEffect(() => {
    const errParam = searchParams?.get('error')
    if (errParam) setError(decodeURIComponent(errParam))
    const linked = searchParams?.get('linked')
    if (linked === '1') {
      setSuccessMsg(
        'Akkauntlaringiz birlashtirildi! Endi Google yoki email/parol bilan kirsangiz ham bitta profil ochiladi.'
      )
    }
  }, [searchParams])

  // Process OAuth callbacks
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
              "Ro'yxatdan o'tish muvaffaqiyatli! Tasdiqlash xati emailingizga yuborildi. Iltimos, emailingizni tekshiring."
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-2"
      onMouseMove={handleMouseMove}
      style={{ ['--hex-radius' as string]: `${HEX_RADIUS}px` }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — ANIMATED ECOSYSTEM (hidden on mobile)
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:block relative min-h-screen overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #081a38 0%, #0b2148 30%, #0f2a5a 55%, #123e73 100%)',
        }}
      >
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(ellipse at 25% 20%, rgba(99,102,241,0.10) 0%, transparent 50%), radial-gradient(ellipse at 75% 80%, rgba(59,130,246,0.07) 0%, transparent 50%)',
              'radial-gradient(ellipse at 40% 30%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 60% 70%, rgba(59,130,246,0.09) 0%, transparent 50%)',
              'radial-gradient(ellipse at 30% 25%, rgba(99,102,241,0.10) 0%, transparent 50%), radial-gradient(ellipse at 70% 75%, rgba(59,130,246,0.07) 0%, transparent 50%)',
            ],
            transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Particles */}
        <ParticleField mouseX={mouseX} mouseY={mouseY} />

        {/* Main content — 3 balanced zones */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-12 px-4">
          {/* Top zone: Logo (absolute positioned above) */}
          <div className="flex-shrink-0 h-16" />

          {/* Center zone: Diagram */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0">
            <FloatingScene mouseX={mouseX} mouseY={mouseY} onNavigate={h => router.push(h)} />
          </div>

          {/* Bottom zone: Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex-shrink-0 flex items-center justify-center gap-8"
          >
            {[
              { label: 'Foydalanuvchilar', value: liveStats.total_users, suffix: '+' },
              { label: 'Kodekslar', value: liveStats.total_codes, suffix: '' },
              { label: "AI So'rov", value: liveStats.total_ai_requests, suffix: '+' },
              { label: 'Hujjatlar', value: liveStats.total_documents, suffix: '+' },
            ]
              .filter(s => s.value > 0)
              .map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-base font-bold text-white/90">
                    {statsLoading ? (
                      '—'
                    ) : (
                      <AnimatedCounter
                        value={s.value}
                        suffix={s.suffix}
                        compact
                        stiffness={90}
                        damping={20}
                      />
                    )}
                  </div>
                  <div className="text-blue-200/40 text-[9px] tracking-wider uppercase">
                    {s.label}
                  </div>
                </div>
              ))}
          </motion.div>
        </div>

        {/* Header — Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="absolute z-20 top-8 left-0 right-0 text-center pointer-events-none"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="JURISTIV Logo"
              className="h-10 mx-auto object-contain"
              onError={() => setLogoUrl(null)}
            />
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white/90 tracking-tight">
                JURIST<span className="text-indigo-400">IV</span>
              </h1>
              <p className="text-blue-200/40 text-xs mt-0.5 font-light tracking-[0.2em] uppercase">
                Huquqiy AI Platformasi
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — LOGIN / REGISTER FORM
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="signin-right-panel min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <style>{`
        @media (prefers-color-scheme: light) {
          .signin-right-panel {
            background: linear-gradient(135deg, #f8fafc, #ffffff, #f1f5f9);
          }
        }
        @media (prefers-color-scheme: dark) {
          .signin-right-panel {
            background: linear-gradient(135deg, #0c0f1a, #111827, #0f172a);
          }
        }
      `}</style>
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="lg:hidden text-center mb-6"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="JURISTIV Logo"
                className="h-12 mx-auto object-contain mb-3"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg mb-3">
                  <svg
                    viewBox="0 0 28 28"
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14 3v22" />
                    <path d="M10 6h8" />
                    <path d="M7 10l7-2 7 2" />
                    <path d="M6 10v3c0 2 3.5 3.5 8 3.5s8-1.5 8-3.5v-3" />
                    <path d="M6 10l-1.5 5a.5.5 0 00.5.5h1c1.5 0 2.5-.5 2.5-1V11" />
                    <path d="M22 10l1.5 5a.5.5 0 01-.5.5h-1c-1.5 0-2.5-.5-2.5-1V11" />
                    <path d="M10 25h8" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">JURISTIV</h1>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Huquqiy AI Platformasi
                </p>
              </>
            )}
          </motion.div>

          {/* Premium Glass Form Card */}
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-2xl blur-xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.06), rgba(99,102,241,0.08))',
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative p-6 sm:p-7 rounded-2xl bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-zinc-700/60 shadow-xl dark:shadow-2xl dark:shadow-black/30">
              {/* Mode Toggle */}
              <div className="flex mb-5 bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setSuccessMsg('')
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'login' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                >
                  <svg
                    className="w-3.5 h-3.5 inline mr-1.5"
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
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'register' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                >
                  <svg
                    className="w-3.5 h-3.5 inline mr-1.5"
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

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2"
                >
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
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
                >
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
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                      Ismingiz
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ismingizni kiriting"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all duration-300"
                    />
                  </motion.div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Parol
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all duration-300 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-0.5 transition-colors"
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

                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Eslab qolish
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

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-60 hover:shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? 'Kirish...' : "Ro'yxatdan o'tish..."}
                    </span>
                  ) : mode === 'login' ? (
                    'Kirish'
                  ) : (
                    "Ro'yxatdan o'tish"
                  )}
                </motion.button>
              </form>

              <div className="mt-5">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500">
                      yoki
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-60"
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
                </motion.button>
              </div>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-[10px] text-gray-400 dark:text-zinc-500 mt-4 leading-relaxed"
          >
            Davom etish orqali siz{' '}
            <button
              type="button"
              onClick={() => router.push('/terms')}
              className="text-indigo-500 hover:text-indigo-600 underline"
            >
              Xizmat ko'rsatish shartlari
            </button>{' '}
            va{' '}
            <button
              type="button"
              onClick={() => router.push('/privacy')}
              className="text-indigo-500 hover:text-indigo-600 underline"
            >
              Maxfiylik siyosati
            </button>{' '}
            bilan rozilik bildirasiz
          </motion.p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT (Suspense-wrapped for useSearchParams)
// ═══════════════════════════════════════════════════════════════════════════

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
