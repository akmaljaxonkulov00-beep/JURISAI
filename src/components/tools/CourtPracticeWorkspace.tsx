'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Search,
  BookOpen,
  Scale,
  ExternalLink,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react'
import { CourtPracticeItem } from '@/types/professional-tools'
import { getAuthHeaders } from '@/lib/api-auth-client'

export default function CourtPracticeWorkspace() {
  const [query, setQuery] = useState('Shartnoma bo‘yicha penya undirish va uni kamaytirish')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CourtPracticeItem[]>([])
  const [aiSynthesis, setAiSynthesis] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])
    setAiSynthesis('')

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/tools/court-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ query: query.trim(), category }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Qidiruvda xatolik yuz berdi')
      }

      setResults(data.results || [])
      setAiSynthesis(data.aiSynthesis || '')
    } catch (err) {
      console.error('Court practice search error:', err)
      setError(err instanceof Error ? err.message : 'Qidiruv jarayonida xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" /> Sud Amaliyoti va Oliy Sud Plenum
            Qarorlari Tahlili
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            O‘zbekiston Respublikasi sudlarining amaliyoti, Plenum qarorlari va huquqiy
            pozitsiyalarini qidiring
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nizo mavzusi yoki modda raqami (masalan: ishga tiklash, penya kamaytirish, er-xotin mulki)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Qidirilmoqda...
                </>
              ) : (
                'Qidirish'
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Soha:
            </span>
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'shartnoma', label: 'Shartnomalar' },
              { id: 'mehnat', label: 'Mehnat' },
              { id: 'fuqarolik', label: 'Fuqarolik & Zarar' },
              { id: 'oila', label: 'Oila & Mulk' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* AI Practice Synthesis Box */}
      {aiSynthesis && (
        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/70 dark:from-orange-950/20 dark:to-amber-950/20 p-6 rounded-3xl border border-orange-200/80 dark:border-orange-900/40 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 text-orange-900 dark:text-orange-200 font-bold">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Oliy Sud Pozitsiyasi va Sud Amaliyoti Tendensiyasi:</span>
          </div>
          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {aiSynthesis}
          </p>
        </div>
      )}

      {/* Verified Court Precedents List */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-orange-600" />
            Oliy Sud Plenumi Qarorlari va Huquqiy Mezonlar ({results.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-3 text-xs shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                      {item.plenumDecisionNumber || 'Plenum Qarori'}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.decisionDate}</span>
                  </div>

                  <h5 className="font-bold text-slate-800 dark:text-zinc-100 text-sm leading-snug">
                    {item.title}
                  </h5>

                  <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 text-[11px] space-y-1">
                    <span className="font-bold text-orange-600 dark:text-orange-400 block">
                      Sudlarga berilgan asosiy ko‘rsatma:
                    </span>
                    <p className="text-slate-700 dark:text-zinc-300 italic">“{item.keyRuling}”</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <div className="flex flex-wrap gap-1">
                    {item.citedLaws.map((law, lIdx) => (
                      <span
                        key={lIdx}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                      >
                        {law}
                      </span>
                    ))}
                  </div>

                  <a
                    href={item.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    Lex.uz / Sud.uz <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
