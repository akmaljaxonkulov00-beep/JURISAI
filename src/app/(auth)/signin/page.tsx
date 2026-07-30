'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { firebaseAuth } from '@/services/firebase-auth'
import { useAuth } from '@/app/providers'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import AnimatedCounter from '@/components/AnimatedCounter'

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM 3D GLASS CARD
// ═══════════════════════════════════════════════════════════════════════════

function FloatingCard({
  children,
  depth = 0,
  index = 0,
  mouseX,
  mouseY,
  className = '',
}: {
  children: React.ReactNode
  depth?: number
  index?: number
  mouseX: any
  mouseY: any
  className?: string
}) {
  const rotateX = useTransform(mouseY, [0, 1], [depth * 2.5, -depth * 2.5])
  const rotateY = useTransform(mouseX, [0, 1], [-depth * 2.5, depth * 2.5])
  const springRotateX = useSpring(rotateX, { stiffness: 55, damping: 16 })
  const springRotateY = useSpring(rotateY, { stiffness: 55, damping: 16 })

  const floatDur = 6 + index * 1.5
  const floatDel = index * 0.8

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: [0, -10 - index * 2, 0],
        scale: [1, 1.01, 1],
        transition: {
          opacity: { duration: 0.7, delay: 0.2 + index * 0.12 },
          y: { duration: floatDur, delay: floatDel, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: floatDur * 0.6, delay: floatDel, repeat: Infinity, ease: 'easeInOut' },
        },
      }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.07,
        z: 45,
        transition: { type: 'spring', stiffness: 250, damping: 12 },
      }}
      className={`relative group cursor-default ${className}`}
    >
      <div
        className="relative rounded-2xl p-4 backdrop-blur-xl border border-white/[0.12] shadow-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        {/* Gradient border glow on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05), transparent)',
          }}
        />
        {/* Hover glow ring */}
        <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        {/* Bottom reflection */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON COMPONENTS (Premium Legal-themed SVG icons)
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
      <path d="M12 4a4 4 0 014 4c0 2-2 3-2 3s-2-1-2-3a4 4 0 014-4z" />
      <path d="M6 16c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 4 4 4 0 01-4-4z" />
      <path d="M18 16c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 4 4 4 0 01-4-4z" />
      <circle cx="12" cy="5" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="7" cy="18" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="17" cy="18" r="2" fill="currentColor" opacity="0.4" />
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
// PARTICLE FIELD — Tiny glowing dots in background
// ═══════════════════════════════════════════════════════════════════════════

function ParticleField() {
  const particles = useRef(
    [...Array(35)].map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${5 + Math.random() * 90}%`,
      size: 1.5 + Math.random() * 2.5,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 6,
      driftX: (Math.random() - 0.5) * 50,
      driftY: (Math.random() - 0.5) * 50,
      opacity: 0.08 + Math.random() * 0.25,
    }))
  ).current

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1200px' }}
    >
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(147,197,253,0.6), transparent)',
            boxShadow: `0 0 ${p.size * 3}px rgba(147,197,253,0.15)`,
          }}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX, 0],
            opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3],
            scale: [0.6, 1.3, 0.6],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING SCENE — Premium 3D Legal Ecosystem
// ═══════════════════════════════════════════════════════════════════════════

interface EcosystemNode {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  accent: string
  depth: number
  x: number
  y: number
  floatAmp: number
  floatDur: number
  floatDelay: number
  pulseDelay: number
}

const ECOSYSTEM_NODES: EcosystemNode[] = [
  {
    id: 'court',
    icon: <ScaleIcon className="w-4.5 h-4.5" />,
    title: 'Virtual Sud AI',
    description: 'Sud jarayonlarini simulyatsiya qilish',
    accent: '#06b6d4',
    depth: 5,
    x: 0,
    y: -168,
    floatAmp: 9,
    floatDur: 5.5,
    floatDelay: 0.2,
    pulseDelay: 0,
  },
  {
    id: 'gavel',
    icon: <BrainIcon className="w-4.5 h-4.5" />,
    title: 'AI Huquqiy Agent',
    description: "O'zR qonunchiligi asosida AI yordamchi",
    accent: '#6366f1',
    depth: 4,
    x: 146,
    y: -84,
    floatAmp: 7,
    floatDur: 6.2,
    floatDelay: 0.7,
    pulseDelay: 0.5,
  },
  {
    id: 'documents',
    icon: <FileTextIcon className="w-4.5 h-4.5" />,
    title: 'AI Hujjat Generator',
    description: "Da'vo va shartnomalarni avtomatik yaratish",
    accent: '#f59e0b',
    depth: 3,
    x: 146,
    y: 84,
    floatAmp: 8,
    floatDur: 5.8,
    floatDelay: 1.2,
    pulseDelay: 1.0,
  },
  {
    id: 'laws',
    icon: <BookIcon className="w-4.5 h-4.5" />,
    title: "O'zbekiston Qonunchiligi",
    description: 'Kodekslar va normativ hujjatlar bazasi',
    accent: '#10b981',
    depth: 6,
    x: 0,
    y: 168,
    floatAmp: 6,
    floatDur: 6.8,
    floatDelay: 1.7,
    pulseDelay: 1.5,
  },
  {
    id: 'search',
    icon: <SearchIcon className="w-4.5 h-4.5" />,
    title: 'Smart Huquqiy Qidiruv',
    description: "Sun'iy intellekt bilan semantik qidiruv",
    accent: '#8b5cf6',
    depth: 4,
    x: -146,
    y: 84,
    floatAmp: 10,
    floatDur: 5.3,
    floatDelay: 2.2,
    pulseDelay: 2.0,
  },
  {
    id: 'analytics',
    icon: <ChartIcon className="w-4.5 h-4.5" />,
    title: 'AI Analitika',
    description: 'Huquqiy tahlil va bashoratli tavsiyalar',
    accent: '#ef4444',
    depth: 5,
    x: -146,
    y: -84,
    floatAmp: 5,
    floatDur: 7.0,
    floatDelay: 0.5,
    pulseDelay: 0.3,
  },
]

// SVG curved Bezier connections — center to each node + hex ring
const NODE_CONNECTIONS: [number, number, string][] = [
  [0, 0, 'M0,0 C15,-95 0,-145 0,-168'],
  [0, 1, 'M0,0 C60,-30 100,-50 146,-84'],
  [0, 2, 'M0,0 C60,30 100,50 146,84'],
  [0, 3, 'M0,0 C40,100 40,140 0,168'],
  [0, 4, 'M0,0 C-60,30 -100,50 -146,84'],
  [0, 5, 'M0,0 C-60,-30 -100,-50 -146,-84'],
  [1, 2, 'M146,-84 C160,-20 160,20 146,84'],
  [2, 3, 'M146,84 C80,140 60,150 0,168'],
  [3, 4, 'M0,168 C-80,140 -60,150 -146,84'],
  [4, 5, 'M-146,84 C-160,20 -160,-20 -146,-84'],
  [5, 1, 'M-146,-84 C-80,-140 -60,-150 146,-84'],
  [1, 0, 'M146,-84 C80,-140 60,-150 0,-168'],
]

function FloatingScene({
  mouseX,
  mouseY,
  onNavigate,
  stats,
  statsLoading,
}: {
  mouseX: any
  mouseY: any
  onNavigate: (href: string) => void
  stats: any
  statsLoading: boolean
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central ambient glow */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 35%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative w-[460px] h-[480px]">
        {/* SVG curved neon connection lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="-230 -240 460 480"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="neonLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.08)" />
              <stop offset="50%" stopColor="rgba(59,130,246,0.12)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.08)" />
            </linearGradient>
          </defs>
          {NODE_CONNECTIONS.map(([fi, ti], idx) => {
            const isCenter = fi === 0 || ti === 0
            const node = ECOSYSTEM_NODES[Math.max(fi, ti)]
            return (
              <motion.path
                key={idx}
                d={NODE_CONNECTIONS[idx][2]}
                stroke={isCenter ? 'rgba(99,102,241,0.10)' : 'rgba(99,102,241,0.05)'}
                strokeWidth={isCenter ? 1 : 0.4}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.3 + idx * 0.04, ease: 'easeInOut' }}
              />
            )
          })}
          {/* Pulse dots along connections */}
          {ECOSYSTEM_NODES.map((node, i) => (
            <motion.circle
              key={`dot-${i}`}
              r={1.8}
              fill={node.accent}
              filter="url(#glow)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.7, 0],
                cx: [node.x * 0.15, node.x * 0.85],
                cy: [node.y * 0.15, node.y * 0.85],
              }}
              transition={{
                duration: 3,
                delay: node.pulseDelay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </svg>

        {/* Ecosystem Cards — hexagonal layout */}
        {ECOSYSTEM_NODES.map((node, i) => {
          const cardW = 168,
            cardH = 80
          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: `calc(50% + ${node.x}px - ${cardW / 2}px)`,
                top: `calc(50% + ${node.y}px - ${cardH / 2}px)`,
                width: cardW,
              }}
              initial={{ opacity: 0, scale: 0.7, y: node.y + 30 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { delay: 0.3 + i * 0.12, duration: 0.6, ease: 'easeOut' },
              }}
            >
              <FloatingCard depth={node.depth} index={i} mouseX={mouseX} mouseY={mouseY}>
                <button
                  onClick={() => {
                    const rm: Record<string, string> = {
                      court: '/case-solver',
                      gavel: '/dashboard',
                      documents: '/document-generator',
                      laws: '/qonunlar',
                      search: '/qonunlar',
                      analytics: '/statistics',
                    }
                    onNavigate(rm[node.id] || '/')
                  }}
                  className="w-full text-left block"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${node.accent}55, ${node.accent}22)`,
                        color: node.accent,
                      }}
                    >
                      {node.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[11px] font-semibold text-white/90 leading-tight">
                        {node.title}
                      </h3>
                      <p className="text-[9px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  </div>
                </button>
              </FloatingCard>
            </motion.div>
          )
        })}

        {/* Center — Crystal Glass Orb with Legal AI */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 16 }}
          style={{
            rotateX: useSpring(useTransform(mouseY, [0, 1], [4, -4]), { stiffness: 70 }),
            rotateY: useSpring(useTransform(mouseX, [0, 1], [-4, 4]), { stiffness: 70 }),
          }}
        >
          {/* Outer glow */}
          <motion.div
            className="absolute rounded-full blur-2xl pointer-events-none"
            style={{
              width: 130,
              height: 130,
              left: -27,
              top: -27,
              background:
                'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Crystal orb */}
          <div
            className="relative rounded-2xl backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-center overflow-hidden"
            style={{
              width: 76,
              height: 76,
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 50%, rgba(99,102,241,0.08) 100%)',
              boxShadow:
                '0 0 30px rgba(99,102,241,0.08), 0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Inner reflections */}
            <div className="absolute top-2 left-3 w-4 h-3 rounded-full bg-white/20 blur-sm rotate-[-30deg]" />
            <div className="absolute bottom-2 right-3 w-2 h-1 rounded-full bg-white/10 blur-sm" />
            {/* Legal AI icon */}
            <svg
              viewBox="0 0 28 28"
              className="w-7 h-7 relative z-10"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1.5"
            >
              <path d="M14 4a3 3 0 013 3c0 1.5-1.5 2.25-1.5 2.25S14 8.5 14 7a3 3 0 013-3z" />
              <path d="M8 16a3 3 0 013 3c0 1.5-1.5 2.25-1.5 2.25S8 20.5 8 19a3 3 0 013-3z" />
              <path d="M20 16a3 3 0 013 3c0 1.5-1.5 2.25-1.5 2.25S20 20.5 20 19a3 3 0 013-3z" />
              <circle cx="14" cy="5.5" r="1.5" fill="rgba(255,255,255,0.3)" />
              <circle cx="9.5" cy="18" r="1.5" fill="rgba(255,255,255,0.3)" />
              <circle cx="18.5" cy="18" r="1.5" fill="rgba(255,255,255,0.3)" />
              <line x1="14" y1="9" x2="14" y2="14" strokeWidth="1" opacity="0.4" />
              <line x1="11" y1="17" x2="13.5" y2="14.5" strokeWidth="1" opacity="0.4" />
              <line x1="17" y1="17" x2="14.5" y2="14.5" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
          {/* Pulse ring */}
          <motion.div
            className="absolute rounded-full border border-indigo-400/15 pointer-events-none"
            style={{ width: 96, height: 96, left: -10, top: -10 }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
          <motion.div
            className="absolute rounded-full border border-blue-400/10 pointer-events-none"
            style={{ width: 110, height: 110, left: -17, top: -17 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 1 }}
          />
        </motion.div>
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
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 })

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      mouseX.set(x)
      mouseY.set(y)
      lastMousePos.current = { x: e.clientX, y: e.clientY, time: Date.now() }
    },
    [mouseX, mouseY]
  )

  // Check for OAuth error from URL params (e.g. /signin?error=...)
  useEffect(() => {
    const errParam = searchParams?.get('error')
    if (errParam) {
      setError(decodeURIComponent(errParam))
    }
  }, [searchParams])

  // Process OAuth callbacks ONLY (e.g. Google login returning ?code=xxx)
  // NEVER auto-redirect on existing session — users must actively log in each time.
  useEffect(() => {
    const hasCode = searchParams?.get('code')
    const hasError = searchParams?.get('error')
    const hasOAuthFlow = hasCode || hasError
    if (!hasOAuthFlow) return

    // Use role from session user metadata instead of hardcoded email
    firebaseAuth
      .handleRedirectResult()
      .then(result => {
        if (result.success && result.data) {
          const role = result.data.role
          router.replace(
            role === 'ADMIN' ? '/admin' : searchParams?.get('redirectTo') || '/dashboard'
          )
        }
      })
      .catch(() => {})
  }, [router, searchParams])

  // ── Auto-redirect REMOVED per user request ──
  // Users MUST always see the signin page and actively log in.
  // No auto-redirect to dashboard even if session exists.

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
        const result = await firebaseAuth.signIn(email, password)
        if (result.success) {
          if (rememberMe) localStorage.setItem('rememberedEmail', email)
          else localStorage.removeItem('rememberedEmail')
          const role = result.data?.role
          router.push(role === 'ADMIN' ? '/admin' : '/dashboard')
        } else {
          setError(result.error || "Email yoki parol noto'g'ri")
        }
      } else {
        if (!name.trim()) {
          setError('Ism kiritilishi shart')
          setIsSubmitting(false)
          return
        }
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

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      const result = await firebaseAuth.signInWithGoogle()
      if (result.success && result.data) {
        const role = result.data.role
        router.push(role === 'ADMIN' ? '/admin' : '/dashboard')
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
      const r = await firebaseAuth.resetPassword(email)
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

  // Always show the signin form — users MUST actively log in every time.
  // No auto-hide even if user already has a session.

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2" onMouseMove={handleMouseMove}>
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — DARK NAVY PREMIUM LEGALTECH ECOSYSTEM
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
            transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Subtle grid */}
        <motion.div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          animate={{ backgroundPosition: ['0px 0px', '20px 10px'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />

        {/* Secondary grid for depth */}
        <motion.div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '120px 120px',
          }}
          animate={{ backgroundPosition: ['0px 0px', '-20px -10px'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />

        {/* Particles */}
        <ParticleField />

        {/* Floating scene */}
        <div className="absolute inset-0">
          <FloatingScene
            mouseX={mouseX}
            mouseY={mouseY}
            onNavigate={h => router.push(h)}
            stats={liveStats}
            statsLoading={statsLoading}
          />
        </div>

        {/* Header — JURISAI */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute z-20 top-8 left-0 right-0 text-center pointer-events-none"
        >
          <h1 className="text-3xl font-bold text-white/90 tracking-tight">
            JURIS<span className="text-indigo-400">AI</span>
          </h1>
          <p className="text-blue-200/40 text-xs mt-0.5 font-light tracking-[0.2em] uppercase">
            Huquqiy AI Platformasi
          </p>
        </motion.div>

        {/* Bottom stats bar — no loading "..." texts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute z-20 bottom-6 left-0 right-0 flex items-center justify-center gap-8"
        >
          <div className="text-center">
            <div className="text-base font-bold text-white/90">
              {statsLoading ? (
                '—'
              ) : (
                <AnimatedCounter
                  value={liveStats.total_users}
                  suffix="+"
                  compact
                  stiffness={90}
                  damping={20}
                />
              )}
            </div>
            <div className="text-blue-200/40 text-[9px] tracking-wider uppercase">
              Foydalanuvchilar
            </div>
          </div>
          <div className="w-px h-6 bg-white/6" />
          <div className="text-center">
            <div className="text-base font-bold text-white/90">
              {statsLoading ? (
                '—'
              ) : (
                <AnimatedCounter value={liveStats.total_codes} stiffness={90} damping={20} />
              )}
            </div>
            <div className="text-blue-200/40 text-[9px] tracking-wider uppercase">Kodekslar</div>
          </div>
          <div className="w-px h-6 bg-white/6" />
          <div className="text-center">
            <div className="text-base font-bold text-white/90">
              {statsLoading ? (
                '—'
              ) : (
                <AnimatedCounter
                  value={liveStats.total_ai_requests}
                  suffix="+"
                  compact
                  stiffness={90}
                  damping={20}
                />
              )}
            </div>
            <div className="text-blue-200/40 text-[9px] tracking-wider uppercase">AI So'rov</div>
          </div>
          <div className="w-px h-6 bg-white/6" />
          <div className="text-center">
            <div className="text-base font-bold text-white/90">
              {statsLoading ? (
                '—'
              ) : (
                <AnimatedCounter
                  value={liveStats.total_documents}
                  suffix="+"
                  compact
                  stiffness={90}
                  damping={20}
                />
              )}
            </div>
            <div className="text-blue-200/40 text-[9px] tracking-wider uppercase">Hujjatlar</div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — LOGIN / REGISTER FORM
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, #f8fafc, #ffffff, #f1f5f9)' }}
      >
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg mb-3"
            >
              <svg
                viewBox="0 0 28 28"
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 4a3 3 0 013 3c0 1.5-1.5 2.25-1.5 2.25S14 8.5 14 7a3 3 0 013-3z" />
                <path d="M8 16a3 3 0 013 3c0 1.5-1.5 2.25-1.5 2.25S8 20.5 8 19a3 3 0 013-3z" />
                <path d="M20 16a3 3 0 013 3c0 1.5-1.5 2.25-1.5 2.25S20 20.5 20 19a3 3 0 013-3z" />
                <circle cx="14" cy="5.5" r="1.5" fill="rgba(255,255,255,0.3)" />
                <circle cx="9.5" cy="18" r="1.5" fill="rgba(255,255,255,0.3)" />
                <circle cx="18.5" cy="18" r="1.5" fill="rgba(255,255,255,0.3)" />
              </svg>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-2xl font-bold text-gray-900"
            >
              JURISAI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-xs text-gray-500 mt-0.5"
            >
              Huquqiy AI Platformasi
            </motion.p>
          </div>

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
            <div className="relative p-6 sm:p-7 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-xl">
              {/* Mode Toggle */}
              <div className="flex mb-5 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setSuccessMsg('')
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                  className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
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
                  className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2"
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Ismingiz
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ismingizni kiriting"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Parol</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
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
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
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
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Parolni unutdingizmi?
                    </button>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60"
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
                    <span className="px-3 bg-white text-gray-400">yoki</span>
                  </div>
                </div>
                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
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
            transition={{ delay: 0.6 }}
            className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed"
          >
            Davom etish orqali siz{' '}
            <a href="/terms" className="text-indigo-500 hover:text-indigo-600 underline">
              Xizmat ko'rsatish shartlari
            </a>{' '}
            va{' '}
            <a href="/privacy" className="text-indigo-500 hover:text-indigo-600 underline">
              Maxfiylik siyosati
            </a>{' '}
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
