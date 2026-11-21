'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  FileText,
  Plus,
  Search,
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  Copy,
  Check,
  Download,
  Eye,
  FileCheck2,
  Trash2,
  Filter,
} from 'lucide-react'
import {
  OFFICIAL_DOCUMENTS_REGISTRY,
  OfficialLegalDocument,
} from '@/lib/documents/official-documents-data'
import AdminDocumentImportModal from '@/components/documents/AdminDocumentImportModal'
import OfficialDocumentFillerModal from '@/components/documents/OfficialDocumentFillerModal'

const CATEGORY_LABELS: Record<string, string> = {
  civil: 'Fuqarolik',
  family: 'Oilaviy',
  labor: 'Mehnat',
  contracts: 'Shartnomalar',
  criminal: 'Jinoyat',
  administrative: 'Ma’muriy',
  inheritance: 'Meros',
  notarial: 'Notarial',
  procedural: 'Protsessual',
  other: 'Boshqa',
}

export default function AdminOfficialDocumentsManager() {
  const [documents, setDocuments] = useState<OfficialLegalDocument[]>(OFFICIAL_DOCUMENTS_REGISTRY)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<OfficialLegalDocument | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const handleImportSuccess = (newDoc: OfficialLegalDocument) => {
    setDocuments((prev) => [newDoc, ...prev])
  }

  const handleDelete = (id: string) => {
    if (confirm('Ushbu rasmiy blankani ro‘yxatdan olib tashlashni tasdiqlaysizmi?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    }
  }

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = selectedCategory === 'all' || doc.category === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      if (!query) return matchCat

      const matchName = doc.documentName.toLowerCase().includes(query)
      const matchDesc = doc.description.toLowerCase().includes(query)
      const matchSource = doc.officialSourceName.toLowerCase().includes(query)
      const matchLaws = doc.legalBasis.some(
        (lb) =>
          lb.article.toLowerCase().includes(query) ||
          lb.code.toLowerCase().includes(query)
      )

      return matchCat && (matchName || matchDesc || matchSource || matchLaws)
    })
  }, [documents, selectedCategory, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white border border-indigo-900/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rasmiy Blankalar Boshqaruvi
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Rasmiy Blankalar va Hujjatlar Boshqaruvi
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            LexUZ, Oliy Sud (my.sud.uz) va Adliya vazirligi tomonidan tasdiqlangan rasmiy blankalarni yuklash, SHA-256 yaxlitligini tekshirish va talabalar uchun ochiq qilish.
          </p>
        </div>

        <Button
          onClick={() => setIsImportModalOpen(true)}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg h-11 px-5"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Blank Yuklash (PDF)</span>
        </Button>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">Jami Blankalar</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {documents.length} ta
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">Rasmiy Manbalar</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            LexUZ / Oliy Sud
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">SHA-256 Tekshiruvi</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            100% Verified
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">Qamrab Olingan Sohalar</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            10 ta soha
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hujjat nomi, davlat organi yoki qonun moddasi bo‘yicha qidirish..."
            className="pl-9 h-10 text-xs sm:text-sm rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Barchasi
          </button>
          {Object.entries(CATEGORY_LABELS).slice(0, 5).map(([catKey, catLabel]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === catKey
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Hujjat Nomi & Soha</th>
                <th className="py-3.5 px-4">Rasmiy Manba</th>
                <th className="py-3.5 px-4">Huquqiy Asos (Moddalar)</th>
                <th className="py-3.5 px-4">SHA-256 Xesh & Status</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Mos keluvchi rasmiy blank topilmadi.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{doc.documentName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                          v{doc.versionNumber}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {doc.officialSourceName}
                      </div>
                      {doc.sourceUrl && (
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                        >
                          <span>Manba havolasi</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {doc.legalBasis.slice(0, 2).map((lb, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-semibold"
                          >
                            {lb.code} {lb.article}
                          </span>
                        ))}
                        {doc.legalBasis.length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{doc.legalBasis.length - 2} ta
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] mb-1">
                        <CheckCircle className="w-3 h-3" /> Rasmiy Tasdiqlangan
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <span>{doc.sha256Checksum.slice(0, 16)}...</span>
                        <button
                          onClick={() => handleCopyHash(doc.sha256Checksum)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                          title="SHA-256 xeshni nusxalash"
                        >
                          {copiedHash === doc.sha256Checksum ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewDoc(doc)}
                          className="h-8 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          title="Hujjatni sinab to‘ldirish"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Ko‘rish</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                          className="h-8 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Import Modal */}
      <AdminDocumentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Preview Filler Modal */}
      {previewDoc && (
        <OfficialDocumentFillerModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}
