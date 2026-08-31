'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface InstructionStep {
  title: string
  description: string
  icon?: string
}

interface FeatureInstructionsProps {
  featureName: string
  steps: InstructionStep[]
  tips?: string[]
}

export default function FeatureInstructions({
  featureName,
  steps,
  tips,
}: FeatureInstructionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  // Body scroll lock when open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, isMobile])

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`${featureName} — Yordam`}
        aria-label={`${featureName} yordam`}
        className="fixed bottom-20 right-4 z-[9998] flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer print:hidden"
      >
        <HelpCircle size={20} />
      </button>

      {/* Mobile: full-screen modal */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col print:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
            <h4 className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <span>📖</span> {featureName}
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50"
              >
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {step.icon && <span className="text-base">{step.icon}</span>}
                    <h5 className="font-medium text-sm text-gray-800 dark:text-white">
                      {step.title}
                    </h5>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
            {tips && tips.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                  💡 Maslahatlar
                </h5>
                <ul className="space-y-1">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop: floating panel */}
      {isOpen && !isMobile && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998] print:hidden" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden print:hidden"
            style={{ top: '80px', right: '16px', width: '380px', maxHeight: 'calc(100vh - 100px)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800/30 flex-shrink-0">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">📖</span> {featureName}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: 'calc(100vh - 140px)' }}
            >
              <div className="p-4 space-y-3">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50"
                  >
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {step.icon && <span className="text-base">{step.icon}</span>}
                        <h5 className="font-medium text-sm text-gray-800 dark:text-white">
                          {step.title}
                        </h5>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {tips && tips.length > 0 && (
                <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                  <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                    💡 Maslahatlar
                  </h5>
                  <ul className="space-y-1">
                    {tips.map((tip, i) => (
                      <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
