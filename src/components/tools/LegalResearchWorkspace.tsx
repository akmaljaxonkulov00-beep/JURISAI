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
} from 'lucide-react'
import { OFFICIAL_LEGAL_SOURCES } from '@/lib/official-sources-registry'
import { useLanguage } from '@/context/LanguageContext'

export default function LegalResearchWorkspace() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const sourcesList = Object.values(OFFICIAL_LEGAL_SOURCES)

  const filtered = sourcesList.filter(s => {
    const matchType = selectedType === 'all' || s.source_type === selectedType
    const matchSearch =
      !searchTerm.trim() ||
      s.source_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchType && matchSearch
  })

  const copyCitation = (s: (typeof sourcesList)[0]) => {
    const citation = `${s.source_name} (${s.document_number}). Rasmiy manba: ${s.official_url}`
    navigator.clipboard.writeText(citation)
    setCopiedKey(s.source_key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Qonun nomi, modda yoki hujjat raqami bo‘yicha qidiruv (masalan: FK, O‘RQ-600, BHM)..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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

      {/* Sources Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            Mos keluvchi rasmiy manba topilmadi
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
            Qidiruv so‘zini o‘zgartirib yoki filtrni tozalab qayta urinib ko‘ring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(source => (
            <div
              key={source.source_key}
              className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-900/50 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                    {source.document_number}
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
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
                    onClick={() => copyCitation(source)}
                    className="flex items-center gap-1 px-2.5 py-1 text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {copiedKey === source.source_key ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] text-emerald-600 font-medium">Nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Havola</span>
                      </>
                    )}
                  </button>

                  <a
                    href={source.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg font-medium transition-colors text-[11px]"
                  >
                    <span>{source.official_domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
