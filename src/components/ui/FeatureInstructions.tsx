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
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [])

  // Panel tashqarisiga bosilganda yopilishi
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

    const handleScroll = () => {
      updatePosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  return (
    <>
      {/* ── (? tugma — compact, responsive) ── */}
      <button
        ref={btnRef}
        onClick={e => {
          e.stopPropagation()
          if (!isOpen) updatePosition()
          setIsOpen(!isOpen)
        }}
        title={`${featureName} — Yordam`}
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 border border-blue-200 dark:border-blue-700/50 transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer"
      >
        <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>

      {/* ── Yo'riqnoma paneli — fixed positioning to avoid overflow clipping ── */}
      {isOpen && (
        <div
          id="feature-instructions-panel"
          className="fixed z-[9999] w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top: panelPos.top,
            right: panelPos.right,
            maxHeight: '70vh',
          }}
        >
          {/* Sarlavha */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800/30">
            <h4 className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-base">📖</span>
              {featureName}
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Controlling scroll */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 52px)' }}>
            {/* Qadamlar */}
            <div className="p-3 space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50"
                >
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {step.icon && <span className="text-sm">{step.icon}</span>}
                      <h5 className="font-medium text-[13px] text-gray-800 dark:text-white leading-tight">
                        {step.title}
                      </h5>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Maslahatlar */}
            {tips && tips.length > 0 && (
              <div className="mx-3 mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <h5 className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
                  💡 Maslahatlar
                </h5>
                <ul className="space-y-0.5">
                  {tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed"
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
