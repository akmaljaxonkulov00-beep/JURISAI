'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  FileText,
  CheckCircle2,
  ExternalLink,
  Download,
  Printer,
  Copy,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Info,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  OfficialLegalDocument,
  renderOfficialDocumentText,
} from '@/lib/documents/official-documents-data'
import { generateLegalPdf, downloadPdfBlob } from '@/lib/pdf-generator'
import { generateLegalDocx, downloadDocxBlob } from '@/lib/docx-generator'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface Props {
  document: OfficialLegalDocument
  initialValues?: Record<string, string>
  onClose: () => void
}

export default function OfficialDocumentFillerModal({
  document: doc,
  initialValues = {},
  onClose,
}: Props) {
  const [formData, setFormData] = useState<Record<string, string>>(initialValues)
  const [activeStep, setActiveStep] = useState<'fill' | 'preview'>('fill')
  const [renderedContent, setRenderedContent] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)
  const [savingDoc, setSavingDoc] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showEduGuide, setShowEduGuide] = useState(true)
  const [aiReviewing, setAiReviewing] = useState(false)
  const [aiReviewText, setAiReviewText] = useState<string | null>(null)
  const [aiReviewError, setAiReviewError] = useState<string | null>(null)
  const [aiSuggestionApplied, setAiSuggestionApplied] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Auto-render on change
  useEffect(() => {
    const text = renderOfficialDocumentText(doc, formData)
    setRenderedContent(text)
  }, [doc, formData])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationError) setValidationError(null)
  }

  const validateAndPreview = () => {
    const missing = doc.fields
      .filter((f) => f.required && (!formData[f.name] || formData[f.name].trim() === ''))
      .map((f) => f.label)

    if (missing.length > 0) {
      setValidationError(`Iltimos, quyidagi majburiy maydonlarni to‘ldiring: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`)
      return
    }

    setValidationError(null)
    setActiveStep('preview')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Matnni sud standarti bo'yicha HTML ga o'tkazamiz
    const paragraphs = renderedContent.split('\n')
    let htmlContent = ''
    let inHeader = true

    for (const p of paragraphs) {
      const trimmed = p.trim()
      if (!trimmed) {
        htmlContent += '<div style="height: 10px;"></div>'
        continue
      }
      if (trimmed.match(/^DA['']?VO\s+ARIZA/i) || trimmed.match(/^SUD\s+BUYRUG['']?I/i) || trimmed.match(/^TURAR\s+JOY/i) || trimmed.match(/^QARZ\s+SHARTNOMASI/i) || trimmed.match(/^ILTIMOSNOMA/i) || trimmed.match(/^SHIKOYAT/i) || trimmed.match(/^KO['']?CHMAS\s+MULK/i) || trimmed.match(/^NOTARIAL/i)) {
        inHeader = false
        htmlContent += `<div style="text-align: center; font-weight: bold; font-size: 14pt; margin: 20px 0 5px 0;">${trimmed}</div>`
        continue
      }
      if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        inHeader = false
        htmlContent += `<div style="text-align: center; font-size: 12pt; margin-bottom: 20px;">${trimmed}</div>`
        continue
      }
      if (inHeader) {
        htmlContent += `<div style="width: 52%; margin-left: 48%; line-height: 1.25; margin-bottom: 4px;">${trimmed}</div>`
      } else {
        const isBold = trimmed.startsWith('So‘rayman') || trimmed.startsWith("So'rayman") || trimmed.startsWith('SO‘RAYMAN') || trimmed.startsWith("SO'RAYMAN") || trimmed.startsWith('ILTIMOS QILAMAN') || trimmed.startsWith('Ilova')
        const isSign = trimmed.startsWith('Da‘vogar:') || trimmed.startsWith("Da'vogar:") || trimmed.startsWith('Arizachi:')
        if (isSign) {
          htmlContent += `<div style="margin-top: 35px; display: flex; justify-content: space-between; font-weight: bold;">${trimmed}</div>`
        } else if (isBold) {
          htmlContent += `<div style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">${trimmed}</div>`
        } else {
          htmlContent += `<div style="text-indent: 1.25cm; text-align: justify; margin-bottom: 10px; line-height: 1.3;">${trimmed}</div>`
        }
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.documentName}</title>
          <style>
            @page { size: A4; margin: 20mm 15mm 20mm 25mm; }
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.3; padding: 25px; color: #000; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadDoc = async (isBlank = false) => {
    setDownloadingDocx(true)
    try {
      const contentToUse = isBlank ? renderOfficialDocumentText(doc, {}) : renderedContent
      const blob = await generateLegalDocx({
        title: doc.documentName,
        content: contentToUse,
        legalBasis: doc.officialSourceName,
        isCourtDocument: true,
      })
      const prefix = isBlank ? 'Bosh_Rasmiy_Blank_' : ''
      downloadDocxBlob(blob, `${prefix}${doc.documentName.replace(/\s+/g, '_')}.docx`)
    } catch (e) {
      console.error('DOCX generation error:', e)
      alert('Word (.docx) faylini yaratishda xatolik yuz berdi.')
    } finally {
      setDownloadingDocx(false)
    }
  }

  const handleSaveOfficialDocument = async () => {
    setSavingDoc(true)
    setSaveMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/official-documents/${doc.id}/fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ values: formData }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveMessage({
          type: 'error',
          text: data.error || 'Hujjatni saqlash uchun tizimga kiring.',
        })
        return
      }
      setSaveMessage({
        type: 'success',
        text: 'Hujjat shaxsiy kabinetingizga muvaffaqiyatli saqlandi!',
      })
    } catch {
      setSaveMessage({
        type: 'error',
        text: 'Server bilan bog‘lanishda xatolik yuz berdi.',
      })
    } finally {
      setSavingDoc(false)
    }
  }

  const handleAiDraftingCoach = async () => {
    setAiReviewing(true)
    setAiReviewError(null)
    setAiSuggestionApplied(false)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          documentText: renderedContent,
          documentType: doc.documentName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiReviewError(data.error || 'AI tahlilini olishda xatolik yuz berdi.')
        return
      }
      setAiReviewText(data.analysis || 'Tahlil natijasi topilmadi.')
    } catch {
      setAiReviewError('AI Drafting Coach bilan bog‘lanishda xatolik yuz berdi.')
    } finally {
      setAiReviewing(false)
    }
  }

  const handleDownloadPdf = async (isBlank = false) => {
    setDownloadingPdf(true)
    try {
      const contentToUse = isBlank ? renderOfficialDocumentText(doc, {}) : renderedContent
      const blob = await generateLegalPdf({
        title: doc.documentName,
        content: contentToUse,
        isCourtDocument: true,
      })
      const prefix = isBlank ? 'Bosh_Rasmiy_Blank_' : ''
      downloadPdfBlob(blob, `${prefix}${doc.documentName.replace(/\s+/g, '_')}.pdf`)
    } catch (e) {
      console.error(e)
      alert('PDF yaratishda xatolik yuz berdi. Word (.doc) shaklida yuklab olishingiz mumkin.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1">
                  {doc.documentName}
                </h3>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 text-[10px] hidden sm:inline-flex">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> {doc.officialSourceName} Rasmiy Andozasi
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O‘zbekiston sud amaliyoti talablariga mos haqiqiy sud hujjati
              </p>
            </div>
          </div>

          {/* Action Buttons Top Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadDoc(true)}
              disabled={downloadingDocx}
              className="rounded-xl flex items-center gap-1 text-xs border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title="To'ldirilmagan rasmiy bo'sh blankni haqiqiy .docx formatida yuklab olish"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Bo‘sh</span> Blank (.docx)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadDoc(false)}
              disabled={downloadingDocx}
              className="rounded-xl flex items-center gap-1 text-xs"
              title="To'ldirilgan hujjatni haqiqiy Word (.docx) formatida yuklab olish"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Word</span> (.docx)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveOfficialDocument}
              disabled={savingDoc}
              className="rounded-xl flex items-center gap-1 text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
              title="Hujjatni shaxsiy kabinetga saqlash"
            >
              {savingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Saqlash</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleDownloadPdf(false)}
              disabled={downloadingPdf}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1 text-xs shadow-sm"
              title="A4 formatidagi rasmiy sud PDF faylini yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? '...' : 'Rasmiy PDF'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl flex items-center gap-1 text-xs hidden sm:flex"
              title="To'g'ridan-to'g'ri chop etish"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chop etish</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="lg:hidden flex items-center justify-center p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveStep('fill')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                activeStep === 'fill' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Rekvizitlarni kiritish
            </button>
            <button
              onClick={() => setActiveStep('preview')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                activeStep === 'preview' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Haqiqiy Hujjat (A4)
            </button>
          </div>
        </div>

        {/* Main Body: Split Screen Studio */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-100 dark:bg-slate-950">
          {/* Left Column: Form Inputs (40% on Desktop) */}
          <div
            className={`lg:col-span-5 h-full overflow-y-auto p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 ${
              activeStep === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Hujjat Rekvizitlari
              </h4>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                ● Jonli o‘ng tomonda yangilanadi
              </span>
            </div>

            {saveMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs border ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Educational Guide */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/70 dark:bg-indigo-950/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEduGuide((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  O‘quv qo‘llanma: Hujjat tuzilishi va ilovalar
                </span>
                {showEduGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showEduGuide && (
                <div className="px-3 pb-3 pt-1 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 border-t border-indigo-100 dark:border-indigo-900/50">
                  <p>
                    <strong>Maqsadi:</strong> {doc.description || doc.documentName}
                  </p>
                  <p>
                    <strong>Kim tayyorlaydi:</strong> Manfaatdor taraf (da’vogar, arizachi yoki uning vakili/advokati).
                  </p>
                  <p>
                    <strong>Huquqiy asos:</strong> {doc.legalBasis?.join(', ') || doc.officialSourceName}
                  </p>
                  <p>
                    <strong>Majburiy ilovalar:</strong> Shaxsni tasdiqlovchi hujjat nusxasi, davlat boji to‘langanligi kvitansiyasi va da’vo talabini tasdiqlovchi dalillar.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3.5">
              {doc.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </span>
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Tanlang...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 space-y-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleAiDraftingCoach}
                disabled={aiReviewing}
                className="w-full border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl text-xs py-2 flex items-center justify-center gap-1.5"
              >
                {aiReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{aiReviewing ? 'AI Drafting Coach tekshirmoqda...' : 'AI Drafting Coach: Hujjatni tekshirish'}</span>
              </Button>

              {aiReviewError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300">
                  {aiReviewError}
                </div>
              )}

              {aiReviewText && (
                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> AI Drafting Coach tavsiyasi
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiReviewText(null)}
                      className="text-[11px] text-slate-500 hover:text-slate-700"
                    >
                      Yopish
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {aiReviewText}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAiSuggestionApplied(true)}
                      className="text-[11px] h-7 border-emerald-400 text-emerald-700 dark:text-emerald-300"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {aiSuggestionApplied ? 'Qabul qilindi' : 'Tavsiyani belgilash'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAiReviewText(null)
                        setAiSuggestionApplied(false)
                      }}
                      className="text-[11px] h-7"
                    >
                      Rad etish
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleDownloadPdf(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Rasmiy Sud PDF Hujjatini Yuklab Olish</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Authentic Live A4 Paper Sheet (60% on Desktop) */}
          <div
            className={`lg:col-span-7 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center ${
              activeStep === 'fill' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="w-full max-w-[720px] bg-white text-black p-8 sm:p-12 shadow-xl border border-slate-200 rounded-sm font-serif min-h-[820px] leading-relaxed self-start">
              {(() => {
                const paragraphs = renderedContent.split('\n')
                let inHeader = true

                return (
                  <div className="space-y-1">
                    {paragraphs.map((p, idx) => {
                      const trimmed = p.trim()
                      if (!trimmed) {
                        return <div key={idx} className="h-2.5" />
                      }

                      // Sarlavhani aniqlash
                      const isMainTitle =
                        trimmed.match(/^DA['']?VO\s+ARIZA/i) ||
                        trimmed.match(/^SUD\s+BUYRUG['']?I/i) ||
                        trimmed.match(/^TURAR\s+JOY/i) ||
                        trimmed.match(/^QARZ\s+SHARTNOMASI/i) ||
                        trimmed.match(/^ILTIMOSNOMA/i) ||
                        trimmed.match(/^SHIKOYAT/i) ||
                        trimmed.match(/^KO['']?CHMAS\s+MULK/i) ||
                        trimmed.match(/^NOTARIAL/i)
                      const isSubTitle = trimmed.startsWith('(') && trimmed.endsWith(')')

                      if (isMainTitle) {
                        inHeader = false
                        return (
                          <div key={idx} className="text-center font-bold text-sm sm:text-base pt-3 pb-0.5 tracking-wide uppercase">
                            {trimmed}
                          </div>
                        )
                      }

                      if (isSubTitle) {
                        inHeader = false
                        return (
                          <div key={idx} className="text-center italic text-xs sm:text-sm pb-3 text-slate-800">
                            {trimmed}
                          </div>
                        )
                      }

                      if (inHeader) {
                        const isBoldHeader =
                          trimmed.startsWith('Fuqarolik') ||
                          trimmed.startsWith('Da‘vogar:') ||
                          trimmed.startsWith("Da'vogar:") ||
                          trimmed.startsWith('Javobgar:') ||
                          trimmed.startsWith('Da‘vo mazmuni:') ||
                          trimmed.startsWith("Da'vo mazmuni:")
                        return (
                          <div key={idx} className="flex justify-end">
                            <div className={`w-full max-w-[280px] sm:max-w-[340px] text-xs sm:text-[13px] leading-snug ${isBoldHeader ? 'font-bold' : ''}`}>
                              {trimmed}
                            </div>
                          </div>
                        )
                      }

                      const isSection =
                        trimmed.startsWith('SO‘RAYMAN') ||
                        trimmed.startsWith("SO'RAYMAN") ||
                        trimmed.startsWith('So‘rayman') ||
                        trimmed.startsWith("So'rayman") ||
                        trimmed.startsWith('ILTIMOS QILAMAN') ||
                        trimmed.startsWith('Ilova') ||
                        trimmed.startsWith('1.') ||
                        trimmed.startsWith('2.') ||
                        trimmed.startsWith('3.') ||
                        trimmed.startsWith('4.') ||
                        trimmed.startsWith('5.')

                      const isSignature =
                        trimmed.startsWith('Da‘vogar:') ||
                        trimmed.startsWith("Da'vogar:") ||
                        trimmed.startsWith('Arizachi:') ||
                        trimmed.startsWith('Sotuvchi:') ||
                        trimmed.startsWith('Ijaraga beruvchi:')

                      if (isSignature) {
                        return (
                          <div key={idx} className="pt-6 flex items-center justify-between text-xs sm:text-[13px] font-bold border-t border-slate-200 mt-4">
                            <span>{trimmed}</span>
                          </div>
                        )
                      }

                      if (isSection) {
                        return (
                          <div key={idx} className="font-bold text-xs sm:text-[13px] pt-1.5 pb-0.5">
                            {trimmed}
                          </div>
                        )
                      }

                      return (
                        <p key={idx} className="text-xs sm:text-[13px] text-justify indent-6 sm:indent-8 leading-relaxed mb-1.5">
                          {trimmed}
                        </p>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
