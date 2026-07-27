'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { firebaseAuth } from '@/services/firebase-auth'
import { useAuth } from '@/app/providers'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import AnimatedCounter from '@/components/AnimatedCounter'

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM 3D INTERACTIVE LEGAL ECOSYSTEM
// Framer Motion — Spring Physics — Parallax — Glassmorphism
// ═══════════════════════════════════════════════════════════════════════════

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

// ── 3D Glass Card with physics ──────────────────────────────────────────
function FloatingCard({ children, depth = 0, index = 0, mouseX, mouseY, className = '' }: {
  children: React.ReactNode
  depth?: number
  index?: number
  mouseX: any
  mouseY: any
  className?: string
}) {
  const rotateX = useTransform(mouseY, [0, 1], [depth * 2.5, -depth * 2.5])
  const rotateY = useTransform(mouseX, [0, 1], [-depth * 2.5, depth * 2.5])
  const springRotateX = useSpring(rotateX, { stiffness: 60, damping: 15 })
  const springRotateY = useSpring(rotateY, { stiffness: 60, damping: 15 })

  const floatDuration = 6 + index * 1.5
  const floatDelay = index * 0.8

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: [0, -12 - index * 3, 0],
        scale: [1, 1.02, 1],
        transition: {
          opacity: { duration: 0.7, delay: index * 0.15 },
          y: { duration: floatDuration, delay: floatDelay, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: floatDuration * 0.6, delay: floatDelay, repeat: Infinity, ease: 'easeInOut' },
        },
      }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.06,
        z: 40,
        transition: { type: 'spring', stiffness: 250, damping: 12 },
      }}
      className={`relative group cursor-default ${className}`}
    >
      <div
        className="relative rounded-2xl p-4 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)'
        }}
      >
        {/* Glass highlight reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent" />
        {/* Hover glow ring */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/12 to-emerald-500/12 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        {/* Bottom reflection line */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  )
}

// ── 3D Judge Gavel (animated SVG) ──────────────────────────────────────
function JudgeGavel({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  const rotateX = useTransform(mouseY, [0, 1], [8, -8])
  const rotateY = useTransform(mouseX, [0, 1], [-8, 8])
  const springRotateX = useSpring(rotateX, { stiffness: 40, damping: 20 })
  const springRotateY = useSpring(rotateY, { stiffness: 40, damping: 20 })

  return (
    <motion.div
      className="relative"
      style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000, transformStyle: 'preserve-3d' }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Gavel body */}
      <div className="w-16 h-16 mx-auto relative">
        {/* Handle */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-10 bg-gradient-to-t from-amber-700 to-amber-500 rounded-full"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(4px)' }}
          animate={{ rotateZ: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Head */}
        <motion.div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg shadow-lg"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(8px)' }}
          animate={{ rotateX: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Impact glow */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-amber-400/50 blur-sm rounded-full"
          animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>
    </motion.div>
  )
}

// ── 3D AI Hologram with Neural Nodes ───────────────────────────────────
function AIHologram({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  const rotateX = useTransform(mouseY, [0, 1], [10, -10])
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10])
  const springRotateX = useSpring(rotateX, { stiffness: 35, damping: 18 })
  const springRotateY = useSpring(rotateY, { stiffness: 35, damping: 18 })

  // Neural network nodes positions
  const nodes = [
    { x: 0, y: -14, size: 3, delay: 0 },
    { x: 10, y: -6, size: 2.5, delay: 0.5 },
    { x: -10, y: -6, size: 2.5, delay: 1 },
    { x: 7, y: 4, size: 2, delay: 1.5 },
    { x: -7, y: 4, size: 2, delay: 2 },
    { x: 0, y: 12, size: 3, delay: 2.5 },
    { x: 14, y: -2, size: 2, delay: 0.8 },
    { x: -14, y: -2, size: 2, delay: 1.3 },
  ]

  // Connection lines
  const connections = [
    [0, 1], [0, 2], [1, 6], [2, 7], [1, 3], [2, 4], [3, 5], [4, 5], [6, 3], [7, 4], [0, 6], [0, 7]
  ]

  return (
    <motion.div
      className="relative w-20 h-20 mx-auto"
      style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000, transformStyle: 'preserve-3d' }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-emerald-400/20 blur-xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Neural connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="-18 -18 36 36">
        {connections.map(([from, to], i) => (
          <motion.line
            key={i}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke="rgba(147, 197, 253, 0.3)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
      </svg>

      {/* Neural nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-400/70"
          style={{
            width: node.size + 1,
            height: node.size + 1,
            left: `calc(50% + ${node.x}px - ${(node.size + 1) / 2}px)`,
            top: `calc(50% + ${node.y}px - ${(node.size + 1) / 2}px)`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.8, 1],
            boxShadow: ['0 0 2px rgba(147,197,253,0.3)', '0 0 8px rgba(147,197,253,0.8)', '0 0 2px rgba(147,197,253,0.3)'],
          }}
          transition={{ duration: 2 + node.delay, delay: node.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Center AI core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-emerald-500/30 backdrop-blur-md border border-blue-400/30 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d', transform: 'translateZ(12px)' }}
        animate={{
          boxShadow: ['0 0 10px rgba(59,130,246,0.2)', '0 0 25px rgba(59,130,246,0.4)', '0 0 10px rgba(59,130,246,0.2)'],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a4 4 0 014 4c0 2-2 3-2 3s-2-1-2-3a4 4 0 014-4z" />
          <path d="M6 16c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 4 4 4 0 01-4-4z" />
          <path d="M18 16c0-2 2-3 2-3s2 1 2 3a4 4 0 01-4 4 4 4 0 01-4-4z" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" opacity="0.5" />
          <circle cx="8" cy="20" r="1.5" fill="currentColor" opacity="0.5" />
          <circle cx="16" cy="20" r="1.5" fill="currentColor" opacity="0.5" />
        </svg>
      </motion.div>

      {/* Thinking pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-blue-400/20"
          animate={{
            scale: [1, 2.5 + i * 0.5, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{ duration: 2.5, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  )
}

// ── Floating Law Book with page animation ──────────────────────────────
function LawBook({ mouseX, mouseY, index = 0 }: { mouseX: any; mouseY: any; index?: number }) {
  const rotateX = useTransform(mouseY, [0, 1], [6, -6])
  const rotateY = useTransform(mouseX, [0, 1], [-6, 6])
  const springRotateX = useSpring(rotateX, { stiffness: 45, damping: 20 })
  const springRotateY = useSpring(rotateY, { stiffness: 45, damping: 20 })

  const colors = [
    { cover: 'from-blue-800 to-blue-600', pages: 'from-blue-100 to-white', label: 'JK' },
    { cover: 'from-green-800 to-green-600', pages: 'from-green-100 to-white', label: 'FK' },
    { cover: 'from-amber-800 to-amber-600', pages: 'from-amber-100 to-white', label: 'MK' },
  ]
  const color = colors[index % colors.length]

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      animate={{ y: [0, -6 - index * 2, 0], rotateZ: [-1 + index * 0.5, 1 + index * 0.5, -1 + index * 0.5] }}
      transition={{ duration: 5 + index, delay: index * 0.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="relative">
        {/* Book body */}
        <div className={`w-14 h-18 rounded-r-lg bg-gradient-to-b ${color.cover} shadow-xl relative`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10% 100%, 0 85%)' }}
        >
          {/* Pages visible on side */}
          <div className={`absolute -right-0.5 top-1 bottom-1 w-1.5 rounded-r ${color.pages} opacity-60`} />
          {/* Spine text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-[6px] font-bold text-white/80 tracking-wider"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {color.label}
            </motion.span>
          </div>
        </div>
        {/* Bookmark ribbon */}
        <motion.div
          className="absolute -top-1 left-3 w-3 h-4 bg-red-50 dark:bg-red-900/20 rounded-t"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, delay: index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}

// ── 3D Court Scene ──────────────────────────────────────────────────────
function CourtScene({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  const rotateX = useTransform(mouseY, [0, 1], [5, -5])
  const rotateY = useTransform(mouseX, [0, 1], [-5, 5])
  const springRotateX = useSpring(rotateX, { stiffness: 30, damping: 22 })
  const springRotateY = useSpring(rotateY, { stiffness: 30, damping: 22 })

  return (
    <motion.div
      className="relative w-20 h-16 mx-auto"
      style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000, transformStyle: 'preserve-3d' }}
    >
      {/* Bench */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-gradient-to-r from-amber-800 to-amber-700 rounded shadow-lg"
        style={{ transform: 'translateZ(4px)' }}
      />
      {/* Bench top */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-18 h-1.5 bg-gradient-to-r from-amber-700 to-amber-600 rounded shadow-md"
        style={{ transform: 'translateZ(8px)' }}
        animate={{ width: [68, 72, 68] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Pillars */}
      <motion.div className="absolute bottom-5 left-5 w-1.5 h-8 bg-gradient-to-t from-amber-700/60 to-amber-500/40 rounded"
        style={{ transform: 'translateZ(2px)' }}
        animate={{ height: [30, 34, 30] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div className="absolute bottom-5 right-5 w-1.5 h-8 bg-gradient-to-t from-amber-700/60 to-amber-500/40 rounded"
        style={{ transform: 'translateZ(2px)' }}
        animate={{ height: [30, 34, 30] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      {/* Roof / canopy */}
      <motion.div
        className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gradient-to-r from-amber-700 to-amber-600 rounded shadow-md"
        style={{ transform: 'translateZ(10px)' }}
        animate={{ width: [62, 66, 62] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Scale symbol */}
      <motion.div
        className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2"
        style={{ transform: 'translateZ(6px)' }}
        animate={{ rotateZ: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-0.5 h-4 bg-amber-400/50" />
        <div className="w-0.5 h-4 bg-amber-400/50" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400/30" />
      </motion.div>
    </motion.div>
  )
}

// ── Enhanced Particle System ────────────────────────────────────────────
function ParticleField() {
  const particles = useRef(
    [...Array(20)].map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${5 + Math.random() * 90}%`,
      size: 2 + Math.random() * 4,
      duration: 4 + Math.random() * 8,
      delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 40,
      driftY: (Math.random() - 0.5) * 40,
      opacity: 0.1 + Math.random() * 0.4,
    }))
  ).current

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '1200px' }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? 'radial-gradient(circle, rgba(59,130,246,0.5), transparent)'
              : p.id % 3 === 1
              ? 'radial-gradient(circle, rgba(16,185,129,0.5), transparent)'
              : 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)',
            boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,0.05)`,
          }}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX, 0],
            opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function GavelIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  )
}

function FileIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function NetworkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )
}

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.121 2.121m8.486 8.486l2.121 2.121M18.364 5.636l-2.121 2.121m-8.486 8.486l-2.121 2.121" />
    </svg>
  )
}

function BookIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING SCENE — Premium 3D Legal Ecosystem
// ═══════════════════════════════════════════════════════════════════════════

interface FloatingSceneProps {
  mouseX: any
  mouseY: any
  onNavigate: (href: string) => void
  stats: any
  statsLoading: boolean
}

// ── Legal AI Ecosystem — Network Node ───────────────────────────────────
// Each node is a connected element in the premium legal ecosystem

interface EcosystemNode {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
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
    id: 'court', icon: <GavelIcon className="w-4 h-4" />, 
    title: 'Virtual Sud AI',
    description: 'Sud jarayonlarini virtual simulyatsiya qilish va tahlil qilish',
    color: 'from-emerald-400/40 to-emerald-600/30', depth: 5,
    x: 0, y: -175, floatAmp: 10, floatDur: 5.5, floatDelay: 0.2, pulseDelay: 0
  },
  { 
    id: 'gavel', icon: <SparkleIcon className="w-4 h-4" />, 
    title: 'AI Huquqiy Agent',
    description: "O'zbekiston Respublikasi qonunchiligi asosida AI yordamchisi",
    color: 'from-blue-400/40 to-blue-600/30', depth: 4,
    x: 155, y: -85, floatAmp: 8, floatDur: 6.2, floatDelay: 0.7, pulseDelay: 0.5
  },
  { 
    id: 'documents', icon: <FileIcon className="w-4 h-4" />, 
    title: 'AI Hujjat Generator',
    description: "Da'vo arizalari, shartnomalar va huquqiy hujjatlarni avtomatik yaratish",
    color: 'from-amber-400/40 to-amber-600/30', depth: 3,
    x: 155, y: 85, floatAmp: 9, floatDur: 5.8, floatDelay: 1.2, pulseDelay: 1.0
  },
  { 
    id: 'laws', icon: <BookIcon className="w-4 h-4" />, 
    title: "O'zbekiston Qonunchiligi",
    description: 'Barcha kodekslar, qonunlar va normativ hujjatlar yagona bazada',
    color: 'from-cyan-400/40 to-cyan-600/30', depth: 6,
    x: 0, y: 175, floatAmp: 7, floatDur: 6.8, floatDelay: 1.7, pulseDelay: 1.5
  },
  { 
    id: 'search', icon: <SearchIcon className="w-4 h-4" />, 
    title: 'Smart Huquqiy Qidiruv',
    description: "Sun'iy intellekt yordamida tezkor va semantik qidiruv",
    color: 'from-purple-400/40 to-purple-600/30', depth: 4,
    x: -155, y: 85, floatAmp: 11, floatDur: 5.3, floatDelay: 2.2, pulseDelay: 2.0
  },
  { 
    id: 'analytics', icon: <ShieldIcon className="w-4 h-4" />, 
    title: 'AI Analitika',
    description: 'Huquqiy ma\'lumotlarni tahlil qilish va tavsiyalar berish',
    color: 'from-rose-400/40 to-rose-600/30', depth: 5,
    x: -155, y: -85, floatAmp: 6, floatDur: 7.0, floatDelay: 0.5, pulseDelay: 0.3
  },
]

// Hexagonal connection pairs (center-to-node + adjacent connections)
const NODE_CONNECTIONS = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],  // center → all nodes (0=center, 1-6=nodes)
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],   // hexagon ring
]

function FloatingScene({ mouseX, mouseY, onNavigate, stats, statsLoading }: FloatingSceneProps) {
  // Stat badges for the bottom area
  const liveBadge = stats && !statsLoading ? (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 top-[calc(50%+195px)] flex items-center justify-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 100, damping: 18 }}
    >
      <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-[10px] text-blue-300 font-medium backdrop-blur-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <AnimatedCounter value={stats.active_users_today || 0} suffix=" bugun" compact stiffness={90} damping={20} className="text-blue-300" />
      </span>
      <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] text-emerald-300 font-medium backdrop-blur-sm">
        +<AnimatedCounter value={stats.documents_generated_today || 0} suffix=" hujjat" compact stiffness={90} damping={20} className="text-emerald-300" />
      </span>
    </motion.div>
  ) : null

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central ambient glow */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, rgba(16,185,129,0.06) 30%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative w-[500px] h-[520px]">
        {/* SVG Network Connection Lines */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox="-250 -260 500 520"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
              <stop offset="50%" stopColor="rgba(16,185,129,0.20)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.15)" />
            </linearGradient>
          </defs>
          {NODE_CONNECTIONS.map(([ci, cj], idx) => {
            const i = ci - 1, j = cj - 1
            const isCenter = ci === 0 || cj === 0
            const a = ci === 0 ? { x: 0, y: 0 } : ECOSYSTEM_NODES[i]
            const b = cj === 0 ? { x: 0, y: 0 } : ECOSYSTEM_NODES[j]
            return (
              <motion.line
                key={idx}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isCenter ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)'}
                strokeWidth={isCenter ? 1 : 0.5}
                strokeDasharray={isCenter ? '4 4' : '3 5'}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.8, delay: 0.5 + idx * 0.03, ease: 'easeInOut' }}
              />
            )
          })}
          {/* Pulse dots along center connections */}
          {ECOSYSTEM_NODES.map((node, i) => (
            <motion.circle
              key={`pulse-${i}`}
              r={2}
              fill="rgba(96,165,250,0.4)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                cx: [node.x * 0.2, node.x * 0.8],
                cy: [node.y * 0.2, node.y * 0.8],
              }}
              transition={{
                duration: 2.5,
                delay: node.pulseDelay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </svg>

        {/* Ecosystem Nodes — positioned in hexagonal layout */}
        {ECOSYSTEM_NODES.map((node, i) => {
          const cardWidth = 172
          const cardHeight = 82
          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: `calc(50% + ${node.x}px - ${cardWidth / 2}px)`,
                top: `calc(50% + ${node.y}px - ${cardHeight / 2}px)`,
                width: cardWidth,
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
                <button onClick={() => {
                  const routeMap: Record<string, string> = {
                    court: '/case-solver', gavel: '/ai-assistant', documents: '/document-generator',
                    laws: '/qonunlar', search: '/qonunlar', analytics: '/statistics'
                  }
                  onNavigate(routeMap[node.id] || '/')
                }} className="w-full text-left block">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${node.color} flex items-center justify-center text-white/90 flex-shrink-0 shadow-lg`}>
                      {node.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[11px] font-semibold text-white/90 leading-tight">{node.title}</h3>
                      <p className="text-[9px] text-white/45 mt-0.5 leading-relaxed line-clamp-2">
                        {stats && !statsLoading && node.id === 'gavel'
                          ? `${(stats.total_ai_requests || 0).toLocaleString()}+ AI so'rov, O'zR qonunchiligi`
                          : stats && !statsLoading && node.id === 'court'
                          ? `${(stats.active_users_today || 0)} ta bugungi seans`
                          : stats && !statsLoading && node.id === 'documents'
                          ? `${(stats.total_documents || 0).toLocaleString()}+ hujjat yaratildi`
                          : stats && !statsLoading && node.id === 'laws'
                          ? `${(stats.total_codes || 0)} ta kodeks, AI tahlil`
                          : stats && !statsLoading && node.id === 'search'
                          ? `${((stats.total_codes || 0) * 200).toLocaleString()}+ modda, semantic qidiruv`
                          : stats && !statsLoading && node.id === 'analytics'
                          ? `${(stats.total_users || 0).toLocaleString()}+ foydalanuvchi`
                          : node.description}
                      </p>
                    </div>
                  </div>
                </button>
              </FloatingCard>
            </motion.div>
          )
        })}

        {/* 3D Legal Objects — positioned between the center and the hexagonal cards */}
        <motion.div
          className="absolute"
          style={{ left: 'calc(50% - 30px)', top: 'calc(50% - 82px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <CourtScene mouseX={mouseX} mouseY={mouseY} />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ left: 'calc(50% + 55px)', top: 'calc(50% - 52px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <JudgeGavel mouseX={mouseX} mouseY={mouseY} />
        </motion.div>

        <motion.div
          className="absolute"
          style={{ left: 'calc(50% + 60px)', top: 'calc(50% + 42px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <AIHologram mouseX={mouseX} mouseY={mouseY} />
        </motion.div>

        <motion.div
          className="absolute flex gap-1.5"
          style={{ left: 'calc(50% - 65px)', top: 'calc(50% + 52px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <LawBook mouseX={mouseX} mouseY={mouseY} index={0} />
          <LawBook mouseX={mouseX} mouseY={mouseY} index={1} />
        </motion.div>

        {/* Live badges */}
        {liveBadge}

        {/* Center core — Premium Shield Logo with rotating rings */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 16 }}
          style={{
            rotateX: useSpring(useTransform(mouseY, [0, 1], [5, -5]), { stiffness: 70 }),
            rotateY: useSpring(useTransform(mouseX, [0, 1], [-5, 5]), { stiffness: 70 }),
          }}
        >
          <div 
            className="rounded-2xl bg-gradient-to-br from-blue-500/25 via-emerald-500/15 to-blue-500/25 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-2xl"
            style={{ width: 76, height: 76 }}
          >
            <ShieldIcon className="w-8 h-8 text-white/80" />
          </div>
          {/* Inner ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-blue-400/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ width: 102, height: 102, left: -13, top: -13 }}
          />
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-emerald-400/8"
            animate={{ rotate: -360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            style={{ width: 122, height: 122, left: -23, top: -23 }}
          />
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: 140, height: 140, left: -32, top: -32,
              background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x)
    mouseY.set(y)
    const now = Date.now()
    const last = lastMousePos.current
    const dt = Math.max(16, now - last.time)
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
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

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — PREMIUM 3D INTERACTIVE LEGAL ECOSYSTEM
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block relative min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 overflow-hidden">

        {/* Depth Layer 1: Animated ambient background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.15) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.10) 0%, transparent 55%)',
              'radial-gradient(ellipse at 45% 30%, rgba(99,102,241,0.12) 0%, transparent 55%), radial-gradient(ellipse at 55% 70%, rgba(16,185,129,0.12) 0%, transparent 55%)',
              'radial-gradient(ellipse at 25% 25%, rgba(59,130,246,0.15) 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(16,185,129,0.10) 0%, transparent 55%)',
              'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.15) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.10) 0%, transparent 55%)',
            ],
            transition: { duration: 10, repeat: Infinity, ease: 'easeInOut' }
          }}
        />

        {/* Depth Layer 2: Animated grid with subtle parallax movement */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
          animate={{ backgroundPosition: ['0px 0px', '25px 12px'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />

        {/* Depth Layer 3: Second grid layer with different speed for parallax */}
        <motion.div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }}
          animate={{ backgroundPosition: ['0px 0px', '-30px -15px'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        />

        {/* Depth Layer 4: Advanced particle field */}
        <ParticleField />

        {/* Depth Layer 5: Floating scene — 3D cards + legal objects */}
        <div className="absolute inset-0">
          <FloatingScene
            mouseX={mouseX}
            mouseY={mouseY}
            onNavigate={(href) => router.push(href)}
            stats={liveStats}
            statsLoading={statsLoading}
          />
        </div>

        {/* Header overlay */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute z-20 top-10 left-0 right-0 text-center pointer-events-none"
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">
            JURIS<span className="text-blue-400">AI</span>
          </h1>
          <p className="text-blue-200/50 text-sm mt-1 font-light tracking-wide">
            Huquqiy AI Platformasi
          </p>
        </motion.div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute z-20 bottom-8 left-0 right-0 flex items-center justify-center gap-10"
        >
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {statsLoading ? <span className="text-white/40 animate-pulse">...</span> : (
                <AnimatedCounter value={liveStats.total_users} suffix="+" compact stiffness={90} damping={20} />
              )}
            </div>
            <div className="text-blue-200/50 text-[10px] tracking-wide">Faol foydalanuvchilar</div>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {statsLoading ? <span className="text-white/40 animate-pulse">...</span> : (
                <AnimatedCounter value={liveStats.total_codes} stiffness={90} damping={20} />
              )}
            </div>
            <div className="text-blue-200/50 text-[10px] tracking-wide">Qonun kodekslari</div>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {statsLoading ? <span className="text-white/40 animate-pulse">...</span> : (
                <AnimatedCounter value={liveStats.total_ai_requests} suffix="+" compact stiffness={90} damping={20} />
              )}
            </div>
            <div className="text-blue-200/50 text-[10px] tracking-wide">AI so'rovlari</div>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {statsLoading ? <span className="text-white/40 animate-pulse">...</span> : (
                <AnimatedCounter value={liveStats.total_documents} suffix="+" compact stiffness={90} damping={20} />
              )}
            </div>
            <div className="text-blue-200/50 text-[10px] tracking-wide">Hujjatlar</div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — PREMIUM GLASS LOGIN / REGISTER FORM
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile Logo + badges */}
          <div className="lg:hidden text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-xl mb-3"
            >
              <ShieldIcon className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              JURISAI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5"
            >
              Huquqiy AI Platformasi
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex flex-wrap justify-center gap-2 mt-4"
            >
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                AI Huquqiy Agent
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800">
                Virtual Sud
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] font-medium border border-amber-200 dark:border-amber-800">
                Hujjat Generator
              </span>
            </motion.div>
          </div>

          {/* Premium Glass Form Card */}
          <div className="relative">
            {/* Glow border */}
            <motion.div
              className="absolute -inset-1.5 rounded-2xl blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.10), rgba(59,130,246,0.12))',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative p-6 sm:p-7 rounded-2xl glass-card shadow-xl border border-gray-200 dark:border-zinc-800/50 dark:border-zinc-700/50 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70">
              {/* Mode Toggle */}
              <div className="flex mb-5 bg-gray-100 dark:bg-zinc-800/80 dark:bg-zinc-800/80 rounded-lg p-0.5">
                <button onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}
                >
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
                  }`}
                >
                  <svg className="w-3.5 h-3.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Ro'yxatdan o'tish
                </button>
              </div>

              {/* Error / Success Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {successMsg}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Ism Familiya</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                      </svg>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Email</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Parol</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" required minLength={6}
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300">
                      {showPassword
                        ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot Password */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 dark:border-zinc-700 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-600 dark:text-zinc-400">Meni eslab qol</span>
                    </label>
                    <button type="button" onClick={handleForgotPassword}
                      className="text-xs text-blue-600 hover:text-blue-500 font-medium" disabled={isSubmitting}>
                      Parolni unutdingizmi?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3" />
                    </svg>
                  )}
                  {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-zinc-700" /></div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-2 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500">yoki</span>
                </div>
              </div>

              {/* Google Button */}
              <motion.button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-750 transition-all disabled:opacity-60 hover:shadow-sm"
              >
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
              </motion.button>

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
            <a href="/terms" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2">Foydalanish shartlari</a>
            {' '}va{' '}
            <a href="/privacy" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2">Maxfiylik siyosati</a>
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
// PAGE EXPORT
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
