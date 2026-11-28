'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  FileText,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle,
  Scale,
  Sparkles,
  BookOpen,
  ArrowRight,
  Plus,
  Flame,
  Globe,
  Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  OFFICIAL_DOCUMENTS_REGISTRY,
  OfficialLegalDocument,
  renderOfficialDocumentText,
} from '@/lib/documents/official-documents-data'
import { Download } from 'lucide-react'
import { generateLegalDocx, downloadDocxBlob } from '@/lib/docx-generator'
import OfficialDocumentFillerModal from './OfficialDocumentFillerModal'

const CATEGORIES = [
  { id: 'all', label: 'Barchasi', icon: '📚' },
  { id: 'civil', label: 'Fuqarolik', icon: '⚖️' },
  { id: 'family', label: 'Oilaviy', icon: '👨‍👩‍👧' },
  { id: 'labor', label: 'Mehnat', icon: '💼' },
  { id: 'contracts', label: 'Shartnomalar', icon: '📝' },
  { id: 'inheritance', label: 'Meros', icon: '📜' },
  { id: 'administrative', label: 'Ma’muriy', icon: '🏛️' },
  { id: 'criminal', label: 'Jinoyat', icon: '🛡️' },
  { id: 'notarial', label: 'Notariat', icon: '📑' },
  { id: 'procedural', label: 'Sud protsessual', icon: '⚖️' },
  { id: 'other', label: 'Boshqa', icon: '📋' },
]

const SOURCES = ['Barchasi', 'Oliy Sud', 'LexUZ', 'my.sud.uz', 'Adliya vazirligi']

export default function OfficialDocumentsCatalog() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'popular' | 'sources'>('all')
  const [selectedSource, setSelectedSource] = useState('Barchasi')
  const [activeModalDoc, setActiveModalDoc] = useState<OfficialLegalDocument | null>(null)
  const [documents, setDocuments] = useState<OfficialLegalDocument[]>(OFFICIAL_DOCUMENTS_REGISTRY)

  const downloadBlankDoc = async (doc: OfficialLegalDocument, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const content = renderOfficialDocumentText(doc, {})
      const blob = await generateLegalDocx({
        title: doc.documentName,
        content,
        legalBasis: doc.officialSourceName,
        isCourtDocument: true,
      })
      downloadDocxBlob(blob, `Asl_Blank_${doc.documentName.replace(/\s+/g, '_')}.docx`)
    } catch (err) {
      console.error('DOCX yaratishda xatolik:', err)
      alert('DOCX faylni yaratishda xatolik yuz berdi.')
    }
  }

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = selectedCategory === 'all' || doc.category === selectedCategory
      const matchSource = selectedSource === 'Barchasi' || doc.officialSourceName === selectedSource
      const matchPopular = filterTab !== 'popular' || doc.downloadCount >= 400

      const query = searchQuery.toLowerCase().trim()
      if (!query) return matchCat && matchSource && matchPopular

      const matchName = doc.documentName.toLowerCase().includes(query)
      const matchDesc = doc.description.toLowerCase().includes(query)
      const matchSourceName = doc.officialSourceName.toLowerCase().includes(query)
      const matchLaws = doc.legalBasis.some(
        (lb) =>
          lb.article.toLowerCase().includes(query) ||
          lb.code.toLowerCase().includes(query) ||
          lb.title.toLowerCase().includes(query)
      )

      return matchCat && matchSource && matchPopular && (matchName || matchDesc || matchSourceName || matchLaws)
    })
  }, [documents, selectedCategory, searchQuery, selectedSource, filterTab])

  return (
    <div className="space-y-6">
      {/* Top Banner: Authentic Guarantee */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-indigo-900/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rasmiy Davlat Manbalari Asosida
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hujjatlar Konstruktori
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              LexUZ, Oliy Sud (my.sud.uz) va Adliya vazirligi tomonidan tasdiqlangan rasmiy yuridik blanklar elektron kutubxonasi. AI qonunlarni o‘ylab topmaydi — faqat tasdiqlangan talablar bo‘yicha to‘ldiriladi.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 100% LexUZ qonun moddalariga mos
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Sudya va advokatlar ko‘rik-namunalari
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> SHA-256 xesh tekshiruvi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs (All, Popular, Sources) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Barcha Blanklar ({documents.length})</span>
          </button>
          <button
            onClick={() => setFilterTab('popular')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              filterTab === 'popular'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Eng ko‘p ishlatilgan</span>
          </button>
        </div>

        {/* Source Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Manba:
          </span>
          {SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                selectedSource === src
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hujjat nomi, qonun moddasi (masalan: FK 732, aliment, mehnat, ijara) yoki kalit so‘z bo‘yicha qidiring..."
            className="pl-10 h-12 text-sm bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? documents.length
                : documents.filter((d) => d.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="group flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200"
          >
            <div className="space-y-3">
              {/* Card Header: Source & Category */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                  {doc.categoryNameUz}
                </span>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 text-[11px]"
                >
                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> {doc.officialSourceName}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                {doc.documentName}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {doc.description}
              </p>

              {/* Legal Bases */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {doc.legalBasis.map((lb, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                  >
                    {lb.code} {lb.article}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={(e) => downloadBlankDoc(doc, e)}
                className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 transition"
                title="Rasmiy sud blankining haqiqiy .docx nusxasini yuklab olish"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Asl blank (.docx)</span>
              </button>

              <Button
                onClick={() => setActiveModalDoc(doc)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs flex items-center gap-1 shadow-sm"
              >
                <span>To‘ldirish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Hujjat topilmadi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Qidiruv so‘zini o‘zgartiring yoki barcha kategoriyalarni tanlang
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('all')
              setSelectedSource('Barchasi')
              setFilterTab('all')
              setSearchQuery('')
            }}
            className="mt-4 rounded-xl text-xs"
          >
            Barcha hujjatlarni ko‘rish
          </Button>
        </div>
      )}

      {/* Active Fill/Preview Modal */}
      {activeModalDoc && (
        <OfficialDocumentFillerModal
          document={activeModalDoc}
          onClose={() => setActiveModalDoc(null)}
        />
      )}
    </div>
  )
}
