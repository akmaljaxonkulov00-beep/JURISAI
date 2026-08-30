'use client'

import { useState } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
      >
        <HelpCircle size={16} />
        <span>{featureName} qanday ishlatiladi?</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-gray-800 dark:text-white">
              📖 {featureName} — Yo'riqnoma
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-100 dark:border-zinc-700 cursor-pointer hover:shadow-sm transition-all"
                onClick={() => setExpandedStep(expandedStep === i ? null : i)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {step.icon && <span>{step.icon}</span>}
                      <h5 className="font-medium text-sm text-gray-800 dark:text-white">
                        {step.title}
                      </h5>
                    </div>
                    {(expandedStep === i || steps.length <= 3) && (
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tips && tips.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
              <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
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
      )}
    </div>
  )
}
