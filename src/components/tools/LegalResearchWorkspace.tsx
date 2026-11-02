'use client'

import React, { useState } from 'react'
import {
  Search,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Copy,
  Check,
  Filter,
  Sparkles,
  Loader2,
  AlertTriangle,
  Scale,
  FileText,
  Compass,
} from 'lucide-react'
import { OFFICIAL_LEGAL_SOURCES } from '@/lib/official-sources-registry'
import { getAuthHeaders } from '@/lib/api-auth-client'

export default function LegalResearchWorkspace() {
  const [activeTab, setActiveTab] = useState<'research' | 'registry'>('research')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [memo, setMemo] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Registry filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const sourcesList = Object.values(OFFICIAL_LEGAL_SOURCES)

  const filteredSources = sourcesList.filter(s => {
    const matchType = selectedType === 'all' || s.source_type === selectedType
    const matchSearch =
      !searchTerm.trim() ||
      s.source_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchType && matchSearch
  })

  const handleRunResearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim()
    if (!q || q.length < 5) {
      setError('Tadqiqot savolini kamida 5 ta belgidan iborat qilib kiriting')
      return
    }

    setLoading(true)
    setError(null)
    setMemo(null)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/tools/legal-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ query: q }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Tadqiqot natijalarini olishda xatolik yuz berdi')
      }

      setMemo(data.memo)
    } catch (err: any) {
      console.error('Legal research error:', err)
      setError(err.message || 'Tadqiqot jarayonida xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const copyCitation = (citation: string, key: string) => {
    navigator.clipboard.writeText(citation)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const SUGGESTED_QUERIES = [
    'Xodim bilan tuzilgan mehnat shartnomasini sinov muddati davrida bekor qilish tartibi va kafolatlari',
    'Ijara shartnomasida bir tomonlama voz kechish va zararni qoplash qoidalari',
    'Qarz tilxati bo‘yicha da‘vo qilish muddati va foizlarni undirish tartibi',
    'Oila mulkini bo‘lishda voyaga yetmagan bolalar manfaati hisobga olinishi',
  ]

  return (
    <div className="space-y-6">
      {/* Sub tabs: Research vs Registry */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'research'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Huquqiy Tadqiqot Dvigateli (AI & LexUZ)</span>
        </button>

        <button
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'registry'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Rasmiy Manbalar Reestri (2026)</span>
        </button>
      </div>

      {activeTab === 'research' ? (
        <div className="space-y-6">
          {/* Research Input Box */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Huquqiy Savol Bo‘yicha Ilmiy-Amaliy Tadqiqot
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Huquqiy nizo yoki masalani kiriting — AI normativ-huquqiy hujjatlarni tahlil qiladi, moddalarni aniqlaydi, manbalarni qiyoslaydi va rasmiy LexUZ havolalari bilan xulosa tayyorlaydi.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  rows={3}
                  placeholder="Masalan: Shartnomada penya miqdori belgilangan bo‘lsa, sud uni FK 326-moddasiga asosan kamaytirish uchun qanday shartlarni talab qiladi?..."
                  className="w-full p-4 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-gray-400">Tavsiya mavzular:</span>
                  {SUGGESTED_QUERIES.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(s)
                        handleRunResearch(s)
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 transition truncate max-w-xs"
                    >
                      {s.slice(0, 35)}...
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleRunResearch()}
                  disabled={loading || query.trim().length < 5}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Tadqiqot o‘tkazilmoqda...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Tadqiqot O‘tkazish
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Research Results Memorandum */}
          {memo && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header Box */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900">
                    <Scale className="w-3.5 h-3.5" />
                    Huquqiy Xulosa (Memorandum)
                  </span>
                  <span className="text-xs text-gray-400">
                    Sana: 2026-yil holatiga tasdiqlangan
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {memo.researchTitle}
                </h2>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {memo.issueSummary}
                </p>
              </div>

              {/* Applicable Normative Sources */}
              {memo.applicableSources && memo.applicableSources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Tegishli Normativ-Huquqiy Hujjatlar va Moddalar ({memo.applicableSources.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memo.applicableSources.map((source: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-3 text-xs shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900">
                              {source.articleNumber}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {source.currentStatus || 'Amalda (2026)'}
                            </span>
                          </div>

                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                            {source.sourceName}
                          </h5>

                          <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                            {source.normSummary}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 truncate max-w-[150px]">
                            {source.officialSource || 'Lex.uz'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                copyCitation(
                                  `${source.sourceName}, ${source.articleNumber}. Manba: ${source.officialUrl}`,
                                  `res_${idx}`
                                )
                              }
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                              title="Iqtibosdan nusxa olish"
                            >
                              {copiedKey === `res_${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <a
                              href={source.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              <span>Lex.uz da ko‘rish</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparative Analysis */}
              {memo.comparativeAnalysis && (
                <div className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Manbalar Qiyosiy Tahlili va Normalar Nisbati
                  </h4>
                  <p className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {memo.comparativeAnalysis}
                  </p>
                </div>
              )}

              {/* Conclusion and Risk Warnings */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-4 text-xs shadow-xs">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Yakuniy Huquqiy Xulosa va Tavsiyalar
                  </h4>
                  <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
                    {memo.conclusion}
                  </p>
                </div>

                {memo.riskWarnings && memo.riskWarnings.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-1 text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Muhim ogohlantirishlar va protsessual muddatlar:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                      {memo.riskWarnings.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Registry View */
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Qonun nomi, modda yoki hujjat raqami bo‘yicha qidiruv (masalan: FK, O‘RQ-600, BHM)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  aria-label="Manba turi bo‘yicha filtr"
                  className="px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barcha manbalar</option>
                  <option value="code">Kodekslar</option>
                  <option value="law">Qonunlar</option>
                  <option value="decree">Prezident Farmonlari</option>
                  <option value="plenum">Oliy Sud Plenum Qarorlari</option>
                  <option value="cbu_rate">Markaziy Bank Stavkalari</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSources.map(source => (
              <div
                key={source.source_key}
                className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:border-blue-300 dark:hover:border-blue-900/50 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                      {source.document_number}
                    </span>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>2026 Tasdiqlangan</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1.5">
                    {source.source_name}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3">
                    {source.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400 dark:text-zinc-500 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" /> {source.effective_date}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyCitation(
                          `${source.source_name} (${source.document_number}). Rasmiy havola: ${source.official_url}`,
                          source.source_key
                        )
                      }
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                      title="Iqtibosdan nusxa olish"
                    >
                      {copiedKey === source.source_key ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <a
                      href={source.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 transition"
                    >
                      <span>Lex.uz</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
