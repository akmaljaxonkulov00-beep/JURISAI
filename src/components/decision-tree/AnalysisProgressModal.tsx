'use client'

import React, { useEffect, useState } from 'react'
import {
  Loader2,
  CheckCircle2,
  FileSearch,
  Scale,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

interface AnalysisProgressModalProps {
  isOpen: boolean
  currentStep?: number
}

const STEPS = [
  { id: 1, title: 'Ish maʼlumotlari va faktlar tahlil qilinmoqda', icon: FileSearch },
  { id: 2, title: 'Huquqiy masalalar va ziddiyatlar aniqlanmoqda', icon: Scale },
  { id: 3, title: 'O‘zbekiston qonunlar bazasidan mos moddalar qidirilmoqda', icon: BookOpenIcon },
  { id: 4, title: 'Strategik qaror variantlari va shoxlari tuzilmoqda', icon: GitBranch },
  { id: 5, title: 'Xavf, ehtimollik, muddat va xarajatlar baholanmoqda', icon: ShieldCheck },
  { id: 6, title: 'Interaktiv qarorlar daraxti tayyorlanmoqda', icon: Sparkles },
]

function BookOpenIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

export default function AnalysisProgressModal({ isOpen }: AnalysisProgressModalProps) {
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(1)
      return
    }

    const interval = setInterval(() => {
      setActiveStep(prev => (prev < 6 ? prev + 1 : 6))
    }, 1800)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-8 overflow-hidden">
        {/* Animated Glow in background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-4 ring-8 ring-blue-500/5">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
            Huquqiy Ish Tahlil Qilinmoqda...
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Sunʼiy intellekt Oʻzbekiston qonunchiligi asosida strategiyani hisoblamoqda
          </p>
        </div>

        {/* 6 Step Progress List */}
        <div className="relative space-y-3.5">
          {STEPS.map(step => {
            const isCompleted = activeStep > step.id
            const isCurrent = activeStep === step.id
            const Icon = step.icon

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm'
                    : isCompleted
                      ? 'bg-slate-50/50 dark:bg-zinc-800/30 border-slate-100 dark:border-zinc-800/50 opacity-85'
                      : 'border-transparent opacity-40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-xs font-semibold leading-tight truncate ${
                      isCurrent
                        ? 'text-blue-900 dark:text-blue-200'
                        : isCompleted
                          ? 'text-slate-700 dark:text-zinc-300'
                          : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1.5">
            <span>Jarayon</span>
            <span>{Math.round((activeStep / 6) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(activeStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
