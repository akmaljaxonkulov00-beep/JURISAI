'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [panelPos, setPanelPos] = useState<{
    top: number
    right: number
  }>({ top: 80, right: 16 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top: rect.top,
        right: window.innerWidth - rect.left + 8,
      })
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const panel = document.getElementById('feature-instructions-panel')
      if (btnRef.current && !btnRef.current.contains(target) && panel && !panel.contains(target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, updatePosition])

  return (
    <>
      {/* ── Floating help button — always right side of viewport ── */}
      <button
        ref={btnRef}
        onClick={e => {
          e.stopPropagation()
          if (!isOpen) updatePosition()
          setIsOpen(!isOpen)
        }}
        title={`${featureName} — Yordam`}
        className="fixed bottom-20 right-4 z-[9998] flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer print:hidden"
      >
        <HelpCircle size={20} />
      </button>

      {/* ── Panel — opens to the LEFT of the button ── */}
      {isOpen && (
        <div
          id="feature-instructions-panel"
          className="fixed z-[9999] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden print:hidden"
          style={{
            top: Math.max(16, Math.min(panelPos.top, window.innerHeight - 32)),
            right: panelPos.right,
            width: 'min(380px, calc(100vw - 1.5rem))',
            maxHeight: 'calc(100vh - 32px)',
          }}
        >
          {/* Sarlavha */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800/30">
            <h4 className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-lg">📖</span>
              {featureName}
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 96px)' }}>
            {/* Qadamlar */}
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
                      <h5 className="font-medium text-sm text-gray-800 dark:text-white leading-snug">
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

            {/* Maslahatlar */}
            {tips && tips.length > 0 && (
              <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                  💡 Maslahatlar
                </h5>
                <ul className="space-y-1">
                  {tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed"
                    >
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
