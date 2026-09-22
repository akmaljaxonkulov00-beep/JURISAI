'use client'

import React, { useState } from 'react'
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ArrowRight,
  ShieldAlert,
  Info,
  ExternalLink,
} from 'lucide-react'
import { calculateDeadlines } from '@/lib/calculators-engine'
import { DeadlineCategory } from '@/types/professional-tools'
import { useLanguage } from '@/context/LanguageContext'

export default function DeadlinesWorkspace() {
  const { t } = useLanguage()
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [disputeCategory, setDisputeCategory] = useState<DeadlineCategory>('civil_general')

  const result = calculateDeadlines({
    disputeCategory,
    startDate,
  })

  return (
    <div className="space-y-6">
      {/* Category Selection and Start Date Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Huquqiy va Protsessual Muddatlarni Hisoblash</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              Nizo yoki Protsessual Harakat Turi
            </label>
            <select
              value={disputeCategory}
              onChange={e => setDisputeCategory(e.target.value as DeadlineCategory)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="civil_general">Fuqarolik huquqi — Umumiy da‘vo muddati (3 yil)</option>
              <option value="labor_reinstatement">Mehnat huquqi — Ishga tiklash (1 oy)</option>
              <option value="labor_other">Mehnat huquqi — Boshqa mehnat nizolari (6 oy)</option>
              <option value="contract_breach">Shartnomaviy majburiyat buzilishi (3 yil)</option>
              <option value="appeal_civil">Fuqarolik sudi — Apellyatsiya shikoyati (1 oy)</option>
              <option value="appeal_economic">Iqtisodiy sud — Apellyatsiya shikoyati (1 oy)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              Muddat Boshlanish Sanasi (Voqea / Qaror chiqqan sana)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status card */}
        <div
          className={`p-6 rounded-2xl border flex flex-col justify-between ${
            result.isExpired
              ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-300'
              : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              {result.isExpired ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">
                {result.isExpired ? 'Muddat o‘tgan' : 'Muddat amalda'}
              </span>
            </div>

            <p className="text-2xl font-black mt-1">
              {result.isExpired ? 'O‘tkazib yuborilgan' : `${result.daysRemaining} kun qoldi`}
            </p>
            <p className="text-xs opacity-80 mt-1">Belgilangan muddat: {result.durationText}</p>
          </div>

          <div className="pt-4 mt-4 border-t border-current/10 text-xs">
            <span className="opacity-70 block">Oxirgi muddat sanasi:</span>
            <span className="font-bold text-sm">
              {new Date(result.deadlineDate).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Procedural Steps & Action guidance */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Tavsiya etilgan protsessual harakatlar</span>
            </h3>

            <div className="space-y-2 mb-4">
              {result.proceduralSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-300 p-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal bases */}
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
              Qonuniy Asos (2026-yil holatiga)
            </span>
            <div className="flex flex-wrap gap-2">
              {result.legalBases.map((basis, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                >
                  <Scale className="w-3 h-3" />
                  {basis}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
