'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  FileDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Search,
  Printer,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { supabase } from '@/lib/supabase-browser'
import { OfficialTemplate } from '@/types/professional-tools'
import { getAuthHeaders } from '@/lib/api-auth-client'

const DEFAULT_OFFICIAL_TEMPLATES: OfficialTemplate[] = [
  {
    id: 'tpl_davo_qarz',
    slug: 'davo-arizasi-qarz',
    name: 'Qarz summasini undirish to‘g‘risida da‘vo arizasi',
    category: 'fuqarolik',
    description: 'Qarz tilxati yoki shartnomasi bo‘yicha muddati o‘tgan pulni sud orqali undirish',
    law_ref: 'FK 732-736-moddalari, FPK 189-191-moddalari',
    format: 'DOCX',
    content: `FUQAROLIK ISHLARI BO‘YICHA (tuman/shahar) SUDIGA

Da‘vogar: (F.I.Sh., yashash manzili, telefon raqami)
Javobgar: (F.I.Sh., yashash manzili)
Da‘vo bahosi: ___________ so'm

DA‘VO ARIZASI
(Qarz summasini undirish to‘g‘risida)

Javobgar bilan o‘rtamizda tuzilgan qarz shartnomasiga (tilxatga) asosan, men javobgarga ___________ so'm miqdorida qarz bergan edim. Qarzni qaytarish muddati tugagan bo‘lsa-da, javobgar qarzni qaytarishdan bosh tortib kelmoqda.

(da'vo asoslari batafsil yoziladi)

O‘zbekiston Respublikasi Fuqarolik Kodeksining 732, 735, 736-moddalariga, FPKning 189-191-moddalariga asosan,

SO‘RAYMAN:
1. Javobgardan mening foydamga ___________ so'm qarz summasini undirishingizni;
2. To‘langan davlat boji va sud xarajatlarini javobgar hisobidan qoplashingizni.

Ilova qilinayotgan hujjatlar:
1. Da‘vo arizasi nusxalari.
2. Qarz tilxati (shartnomasi) nusxasi.
3. Davlat boji to‘langanligi haqida kvitansiya.

Da‘vogar: (da'vogarning F.I.Sh.) ___________
Sana: 2026-yil "___" __________`,
  },
  {
    id: 'tpl_ishga_tiklash',
    slug: 'davo-arizasi-mehnat',
    name: 'Ishga tiklash va oylik ish haqini undirish arizasi',
    category: 'mehnat',
    description: 'Noqonuniy ishdan bo‘shatish yuzasidan sudga murojaat qilish shakli',
    law_ref: 'Yangi MK 161, 560-moddalari, FPK 189-moddasi',
    format: 'DOCX',
    content: `FUQAROLIK ISHLARI BO‘YICHA (tuman/shahar) SUDIGA

Da‘vogar: (F.I.Sh., yashash manzili, telefon raqami)
Javobgar: (F.I.Sh., yashash manzili)

DA‘VO ARIZASI
(Ishga tiklash va majburiy progul haqini undirish to‘g‘risida)

Men javobgar tashkilotida ishlab kelganman. 2026-yilda asossiz ravishda ishdan bo‘shatildim.

(da'vo asoslari batafsil yoziladi)

O‘zbekiston Respublikasi Mehnat Kodeksining 161, 560-moddalariga asosan,

SO‘RAYMAN:
1. Meni avvalgi lavozimimga ishga tiklashingizni;
2. Majburiy progul kunlari uchun o‘rtacha ish haqini undirishingizni.

Da‘vogar: (da'vogarning F.I.Sh.) ___________
Sana: 2026-yil "___" __________`,
  },
  {
    id: 'tpl_shartnoma_oldi_sotdi',
    slug: 'oldi-sotdi-shartnomasi',
    name: 'Mahsulot yetkazib berish va oldi-sotdi shartnomasi (2026)',
    category: 'iqtisodiy',
    description: 'Xo‘jalik yurituvchi subyektlar o‘rtasidagi rasmiy kontrakt shakli',
    law_ref: 'FK 386, 437-moddalari, 670-I-son Qonun',
    format: 'DOCX',
    content: `MAHSULOT YETKAZIB BERISH SHARTNOMASI № ___

Toshkent shahri                                              2026-yil "___" __________

Bir tomondan (F.I.Sh., yashash manzili, telefon raqami) (keyingi o‘rinlarda "Sotuvchi"),
ikkinchi tomondan (F.I.Sh., yashash manzili) (keyingi o‘rinlarda "Xaridor"),
quyidagilar to‘g‘risida mazkur shartnomani tuzdilar:

1. SHARTNOMA PREDMETI
1.1. Sotuvchi mahsulotni Xaridor mulkiga yetkazib berish, Xaridor esa qabul qilib to‘lash majburiyatini oladi.
1.2. Shartnoma umumiy summasi: ___________ so'm.

(da'vo asoslari batafsil yoziladi)

2. TARAFLARNING JAVOBGARLIGI
2.1. Majburiyatlar kechiktirilganda kuniga 0.5% penya hisoblanadi (max 50% - 670-I Qonun).

Sotuvchi: ____________________          Xaridor: ____________________`,
  },
]

export default function DocumentConstructorWorkspace() {
  const [templates, setTemplates] = useState<OfficialTemplate[]>(DEFAULT_OFFICIAL_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<OfficialTemplate | null>(
    DEFAULT_OFFICIAL_TEMPLATES[0]
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Form Fields
  const [formData, setFormData] = useState<Record<string, string>>({
    court_name: 'Fuqarolik ishlari bo‘yicha Shayxontohur tumanlararo sudiga',
    davogar_info: '',
    javobgar_info: '',
    davogar_name: '',
    claim_amount: '',
    facts: '',
    demands: '',
  })

  // Load templates from database
  useEffect(() => {
    async function loadTemplates() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('document_templates')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          setTemplates(data as OfficialTemplate[])
          setSelectedTemplate(data[0] as OfficialTemplate)
        } else {
          setTemplates(DEFAULT_OFFICIAL_TEMPLATES)
          setSelectedTemplate(DEFAULT_OFFICIAL_TEMPLATES[0])
        }
      } catch (err) {
        console.error('Error loading templates:', err)
        setTemplates(DEFAULT_OFFICIAL_TEMPLATES)
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  const filteredTemplates = templates.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCat
  })

  // Generate Preview Text
  const renderedContent = React.useMemo(() => {
    if (!selectedTemplate) return ''
    let content = selectedTemplate.content

    if (formData.court_name) {
      content = content.replace(
        /O'ZBEKISTON RESPUBLIKASI \(tuman\/shahar\) SUDIGA/g,
        formData.court_name.toUpperCase()
      )
    }
    if (formData.davogar_info) {
      content = content.replace(
        /\(F\.I\.Sh\., yashash manzili, telefon raqami\)/g,
        formData.davogar_info
      )
    }
    if (formData.javobgar_info) {
      content = content.replace(/\(F\.I\.Sh\., yashash manzili\)/g, formData.javobgar_info)
    }
    if (formData.davogar_name) {
      content = content.replace(/\(da'vogarning F\.I\.Sh\.\)/g, formData.davogar_name)
    }
    if (formData.claim_amount) {
      content = content.replace(
        /___________ so'm/g,
        `${Number(formData.claim_amount.replace(/[^\d]/g, '')).toLocaleString()} so'm`
      )
    }
    if (formData.facts) {
      content = content.replace(/\(da'vo asoslari batafsil yoziladi\)/g, formData.facts)
    }
    if (formData.demands) {
      content = content.replace(/\(da'vogarning aniq talabi yoziladi\)/g, formData.demands)
    }

    return content
  }, [selectedTemplate, formData])

  // Backend sync helper
  const syncDocumentToBackend = async () => {
    if (!selectedTemplate) return
    try {
      const headers = await getAuthHeaders()
      await fetch('/api/tools/document-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          templateSlug: selectedTemplate.slug,
          formData,
          title: selectedTemplate.name,
          customContent: renderedContent,
        }),
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stats-updated'))
      }
    } catch (err) {
      console.warn('Doc sync error:', err)
    }
  }

  // PDF Export
  const handleExportPdf = async () => {
    if (!selectedTemplate || !renderedContent) return
    setGenerating(true)
    try {
      syncDocumentToBackend()
      const doc = await PDFDocument.create()
      const pageSize: [number, number] = [595.28, 841.89] // A4
      const margin = 50
      const pageWidth = pageSize[0] - margin * 2
      let page = doc.addPage(pageSize)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const bold = await doc.embedFont(StandardFonts.HelveticaBold)

      let y = pageSize[1] - margin

      const sanitize = (s: string) =>
        s
          .replace(/ʻ|’|‘|`/g, "'")
          .replace(/—|–/g, '-')
          .replace(/[^\x20-\x7E\n]/g, ' ')

      const lines = sanitize(renderedContent).split('\n')

      for (const line of lines) {
        if (y < margin + 40) {
          page = doc.addPage(pageSize)
          y = pageSize[1] - margin
        }

        if (line.trim().length === 0) {
          y -= 10
          continue
        }

        const isHeading = line.toUpperCase() === line && line.length < 60 && line.trim().length > 3
        const f = isHeading ? bold : font
        const size = isHeading ? 11 : 9.5

        page.drawText(line.slice(0, 95), {
          x: margin,
          y,
          size,
          font: f,
          color: rgb(0.1, 0.1, 0.15),
        })
        y -= 14
      }

      const pdfBytes = await doc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedTemplate.slug || 'hujjat'}.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setGenerating(false)
    }
  }

  // TXT / DOCX Export
  const handleExportDocx = () => {
    if (!renderedContent) return
    syncDocumentToBackend()
    const blob = new Blob([renderedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedTemplate?.slug || 'hujjat'}.txt`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Template Browser & Form */}
      <div className="lg:col-span-5 space-y-4">
        {/* Template Search & Selection */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Rasmiy Shablonlar Katalogi
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {templates.length} ta tasdiqlangan
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Shablon nomini qidirish..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {filteredTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate?.id === t.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200/60 dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[200px]">
                    {t.name}
                  </h4>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                    {t.category}
                  </span>
                </div>
                {t.law_ref && (
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
                    {t.law_ref}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Fields Form */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-3.5 shadow-sm text-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            Hujjat Maydonlarini To‘ldirish
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Sud yoki tashkilot nomi
            </label>
            <input
              type="text"
              value={formData.court_name}
              onChange={e => setFormData({ ...formData, court_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Da‘vogar (Ariza beruvchi) F.I.Sh., manzili, tel
            </label>
            <input
              type="text"
              value={formData.davogar_info}
              onChange={e =>
                setFormData({
                  ...formData,
                  davogar_info: e.target.value,
                  davogar_name: e.target.value.split(',')[0],
                })
              }
              placeholder="Aliyev Vali G'aniyevich, Toshkent sh., +998901234567"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Javobgar F.I.Sh., manzili
            </label>
            <input
              type="text"
              value={formData.javobgar_info}
              onChange={e => setFormData({ ...formData, javobgar_info: e.target.value })}
              placeholder="Karimov Anvar Sobirovich, Toshkent sh."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Da‘vo summasi (so‘mda)
            </label>
            <input
              type="text"
              value={formData.claim_amount}
              onChange={e => setFormData({ ...formData, claim_amount: e.target.value })}
              placeholder="35000000"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Holat bayoni (Faktlar)
            </label>
            <textarea
              rows={3}
              value={formData.facts}
              onChange={e => setFormData({ ...formData, facts: e.target.value })}
              placeholder="Majburiyatlar buzilishi va nizoga olib kelgan holatlar..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Sudga talab (Talabnoma qismi)
            </label>
            <input
              type="text"
              value={formData.demands}
              onChange={e => setFormData({ ...formData, demands: e.target.value })}
              placeholder="Javobgardan 35 000 000 so'm qarz va davlat boji undirish"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Live A4 Document Preview & Download */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between shadow-sm min-h-[600px]">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" /> A4 Rasmiy Hujjat Ko‘rinishi (Preview)
              </h3>
              {selectedTemplate?.law_ref && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                  Qonuniy asos: {selectedTemplate.law_ref}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDocx}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                title="DOCX / Matn yuklab olish"
              >
                <Download className="w-3.5 h-3.5" /> DOCX
              </button>
              <button
                onClick={handleExportPdf}
                disabled={generating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
                title="PDF yuklab olish"
              >
                <FileDown className="w-3.5 h-3.5" />
                {generating ? 'Yaratilmoqda...' : 'PDF Yuklab Olish'}
              </button>
            </div>
          </div>

          {/* A4 Paper Sheet Preview */}
          <div className="my-5 p-8 bg-slate-50 dark:bg-zinc-950/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 font-serif text-slate-900 dark:text-zinc-100 text-xs leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text shadow-inner">
            {renderedContent || 'Shablon yuklanmoqda...'}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <span>✓ Rasmiy sud shakllari va FPK qoidalariga mos</span>
          <span>A4 Format • Standart hoshiyalar (20mm)</span>
        </div>
      </div>
    </div>
  )
}
