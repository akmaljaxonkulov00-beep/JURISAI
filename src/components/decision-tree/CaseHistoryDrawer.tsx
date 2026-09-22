'use client'

import React, { useState } from 'react'
import {
  X,
  Search,
  FolderOpen,
  Calendar,
  Layers,
  Trash2,
  Copy,
  ArrowRight,
  Filter,
  Plus,
} from 'lucide-react'
import { DecisionCase } from '@/types/decision-tree'

interface CaseHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  cases: DecisionCase[]
  onOpenCase: (decisionCase: DecisionCase) => void
  onDeleteCase: (caseId: string) => void
  onDuplicateCase?: (decisionCase: DecisionCase) => void
  onNewCase: () => void
  loading?: boolean
}

export default function CaseHistoryDrawer({
  isOpen,
  onClose,
  cases,
  onOpenCase,
  onDeleteCase,
  onDuplicateCase,
  onNewCase,
  loading = false,
}: CaseHistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  if (!isOpen) return null

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.known_facts && c.known_facts.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === 'all' || c.case_type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-r border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                Saqlangan Qaror Daraxtlari
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Jami {cases.length} ta tahlil qilingan ish
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

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 space-y-2 bg-white dark:bg-zinc-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ishlar orasidan qidirish..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {['all', 'fuqarolik', 'shartnoma', 'mehnat', 'oila', 'meros', 'mamuriy', 'jinoyat'].map(
              t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                    filterType === t
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
                >
                  {t === 'all' ? 'Barchasi' : t}
                </button>
              )
            )}
          </div>
        </div>

        {/* Cases List */}
        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
          {filteredCases.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Qarorlar daraxti topilmadi</p>
              <button
                onClick={() => {
                  onClose()
                  onNewCase()
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100"
              >
                Yangi ish yaratish
              </button>
            </div>
          ) : (
            filteredCases.map(c => (
              <div
                key={c.id}
                className="group relative p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 uppercase tracking-wide">
                    {c.case_type}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString('uz-UZ', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-snug">
                  {c.name}
                </h4>

                {c.known_facts && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
                    {c.known_facts}
                  </p>
                )}

                {/* Footer Controls */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {onDuplicateCase && (
                      <button
                        onClick={() => onDuplicateCase(c)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Nusxa olish"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteCase(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Oʻchirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onOpenCase(c)
                      onClose()
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Ochish <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create New Case Button */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
          <button
            onClick={() => {
              onClose()
              onNewCase()
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Yangi ish tahlilini boshlash
          </button>
        </div>
      </div>
    </div>
  )
}
