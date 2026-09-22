'use client'

import React from 'react'
import {
  X,
  Scale,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  BookOpen,
  Sparkles,
  Play,
  FileText,
} from 'lucide-react'
import { ComparisonVariant } from '@/types/decision-tree'
import { formatCurrencySom } from '@/lib/decision-tree-engine'

interface BranchComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  variants: ComparisonVariant[]
  onSelectVariant: (variantId: string) => void
}

export default function BranchComparisonModal({
  isOpen,
  onClose,
  variants,
  onSelectVariant,
}: BranchComparisonModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                Strategik Variantlarni Taqqoslash
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Har bir huquqiy yoʻnalishning xarajat, muddat, xavf va dalil talablarini yonma-yon
                solishtiring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          {variants.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
              <Scale className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Taqqoslash uchun shoxlar yetarli emas.</p>
            </div>
          ) : (
            <div className="min-w-[760px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {variants.map((v, i) => (
                <div
                  key={v.id}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Variant Title & Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 uppercase tracking-wide">
                          Variant {i + 1}
                        </span>
                        <span
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                            v.riskLevel === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : v.riskLevel === 'low'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {v.riskLevel === 'high' ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {v.riskLevel === 'high'
                            ? 'Yuqori xavf'
                            : v.riskLevel === 'low'
                              ? 'Past xavf'
                              : 'O‘rta xavf'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug">
                        {v.title}
                      </h3>
                    </div>

                    {/* Metrics Box */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px]">Taxminiy xarajat:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          {formatCurrencySom(v.estimatedCost)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Taxminiy muddat:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          {v.estimatedDuration}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-slate-400 text-[9px]">AI ishonchliligi:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {v.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Huquqiy Asos */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-600" /> Huquqiy asos
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        {v.legalBasis}
                      </p>
                    </div>

                    {/* Xavf sababi */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                        Xavf omillari
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                        {v.riskBasis}
                      </p>
                    </div>

                    {/* Afzallik & Kamchilik */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                          ✓ Afzalliklari:
                        </span>
                        <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                          {v.pros.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-emerald-500">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block mb-0.5">
                          ✕ Kamchiliklari:
                        </span>
                        <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                          {v.cons.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-rose-500">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Kerakli dalillar */}
                    {v.evidenceRequired.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Talab etiladigan dalillar
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {v.evidenceRequired.map((ev, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select CTA Button */}
                  <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        onSelectVariant(v.id)
                        onClose()
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Ushbu strategiyani tanlash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
