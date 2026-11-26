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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  OfficialLegalDocument,
  renderOfficialDocumentText,
} from '@/lib/documents/official-documents-data'
import { generateLegalPdf, downloadPdfBlob } from '@/lib/pdf-generator'

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

  const handleDownloadDoc = (isBlank = false) => {
    const contentToUse = isBlank ? renderOfficialDocumentText(doc, {}) : renderedContent
    const paragraphs = contentToUse.split('\n')
    let bodyHtml = ''
    let inHeader = true

    for (const p of paragraphs) {
      const trimmed = p.trim()
      if (!trimmed) {
        bodyHtml += '<p style="margin: 4pt 0; font-size: 6pt;">&nbsp;</p>'
        continue
      }
      if (trimmed.match(/^DA['']?VO\s+ARIZA/i) || trimmed.match(/^SUD\s+BUYRUG['']?I/i) || trimmed.match(/^TURAR\s+JOY/i) || trimmed.match(/^QARZ\s+SHARTNOMASI/i) || trimmed.match(/^ILTIMOSNOMA/i) || trimmed.match(/^SHIKOYAT/i) || trimmed.match(/^KO['']?CHMAS\s+MULK/i) || trimmed.match(/^NOTARIAL/i)) {
        inHeader = false
        bodyHtml += `<p style="text-align: center; font-weight: bold; font-size: 14pt; margin: 18pt 0 4pt 0;">${trimmed}</p>`
        continue
      }
      if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        inHeader = false
        bodyHtml += `<p style="text-align: center; font-size: 12pt; margin-bottom: 16pt;">${trimmed}</p>`
        continue
      }
      if (inHeader) {
        bodyHtml += `<p style="margin-left: 48%; text-align: left; margin-bottom: 3pt; font-size: 12pt; line-height: 1.15;">${trimmed}</p>`
      } else {
        const isBold = trimmed.startsWith('So‘rayman') || trimmed.startsWith("So'rayman") || trimmed.startsWith('SO‘RAYMAN') || trimmed.startsWith("SO'RAYMAN") || trimmed.startsWith('ILTIMOS QILAMAN') || trimmed.startsWith('Ilova')
        const isSign = trimmed.startsWith('Da‘vogar:') || trimmed.startsWith("Da'vogar:") || trimmed.startsWith('Arizachi:')
        if (isSign) {
          bodyHtml += `<p style="margin-top: 30pt; font-weight: bold; font-size: 12pt;">${trimmed}</p>`
        } else if (isBold) {
          bodyHtml += `<p style="font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; font-size: 12pt;">${trimmed}</p>`
        } else {
          bodyHtml += `<p style="text-indent: 1.25cm; text-align: justify; margin-bottom: 8pt; font-size: 12pt; line-height: 1.25;">${trimmed}</p>`
        }
      }
    }

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${doc.documentName}</title>
    <style>
      @page { size: 21cm 29.7cm; margin: 2cm 1.5cm 2cm 2.5cm; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
    </style></head>
    <body>${bodyHtml}</body></html>`
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const prefix = isBlank ? 'Bosh_Rasmiy_Blank_' : ''
    a.download = `${prefix}${doc.documentName.replace(/\s+/g, '_')}.doc`
    a.click()
    URL.revokeObjectURL(url)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg line-clamp-1">
                  {doc.documentName}
                </h3>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Rasmiy Tasdiqlangan
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manba: <span className="font-medium text-slate-700 dark:text-slate-300">{doc.officialSourceName}</span> · {doc.issuingAuthority}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveStep('fill')}
              className={`px-4 py-1.5 rounded-lg font-medium transition ${
                activeStep === 'fill'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              1. Rekvizitlarni to‘ldirish
            </button>
            <button
              onClick={validateAndPreview}
              className={`px-4 py-1.5 rounded-lg font-medium transition ${
                activeStep === 'preview'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              2. Rasmiy hujjat ko‘rinishi & Eksport
            </button>
          </div>

          <a
            href={doc.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> LexUZ asl manbasi
          </a>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeStep === 'fill' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-7 space-y-4">
                {validationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Info className="w-4 h-4 text-indigo-500" /> Rasmiy to‘ldirish qoidasi:
                  </div>
                  <p>
                    Quyidagi ma’lumotlarni shaxsingizni tasdiqlovchi hujjat (pasport yoki ID-karta) va rasmiy shartnomadagi yozuvlarga qat’iy mos holda kiriting.
                  </p>
                </div>

                <div className="space-y-4">
                  {doc.fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.legalContext && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                            {field.legalContext}
                          </span>
                        )}
                      </div>

                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : field.type === 'select' && field.options ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                          className="text-sm rounded-xl"
                        />
                      )}

                      {field.description && (
                        <p className="text-[11px] text-slate-400">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={validateAndPreview} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                    Hujjatni shakllantirish va ko‘rish →
                  </Button>
                </div>
              </div>

              {/* Right Column: Legal Citations & Fast Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Huquqiy Asoslar (Lex.uz)
                  </h4>
                  <div className="space-y-2">
                    {doc.legalBasis.map((lb, idx) => (
                      <div key={idx} className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {lb.code} {lb.article}
                          </span>
                          <a
                            href={lb.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 hover:text-indigo-500 flex items-center gap-0.5"
                          >
                            LexUZ <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{lb.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{lb.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Mini Preview Box */}
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Jonli ko‘rinish (Matn):</span>
                    <span className="text-[11px] text-emerald-400">● Avtomatik yangilanadi</span>
                  </div>
                  <pre className="text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed opacity-90 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    {renderedContent}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            /* Preview and Export View: Haqiqiy A4 oq qog'ozdagi sud hujjati */
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Yuqori bildirishnoma: 100% rasmiy andoza */}
              <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Ushbu hujjat {doc.officialSourceName} va amaldagi protsessual qonunchilik talablariga 100% mos rasmiy shaklda tayyorlandi.
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Sud qabuli uchun tayyor
                </span>
              </div>

              {/* A4 Formatidagi Oq Qog'oz Hujjat */}
              <div className="p-8 sm:p-12 bg-white text-black border border-slate-300 shadow-2xl rounded-sm font-serif min-h-[700px]">
                {(() => {
                  const paragraphs = renderedContent.split('\n')
                  let inHeader = true
                  return (
                    <div className="space-y-1">
                      {paragraphs.map((p, idx) => {
                        const trimmed = p.trim()
                        if (!trimmed) {
                          return <div key={idx} className="h-3" />
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
                            <div key={idx} className="text-center font-bold text-base sm:text-lg pt-4 pb-1 tracking-wide">
                              {trimmed}
                            </div>
                          )
                        }

                        if (isSubTitle) {
                          inHeader = false
                          return (
                            <div key={idx} className="text-center italic text-xs sm:text-sm pb-4 text-slate-800">
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
                              <div className={`w-full max-w-[320px] sm:max-w-[380px] text-xs sm:text-sm leading-snug ${isBoldHeader ? 'font-bold' : ''}`}>
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
                          trimmed.startsWith('3.')

                        const isSignature =
                          trimmed.startsWith('Da‘vogar:') ||
                          trimmed.startsWith("Da'vogar:") ||
                          trimmed.startsWith('Arizachi:') ||
                          trimmed.startsWith('Sotuvchi:') ||
                          trimmed.startsWith('Ijaraga beruvchi:')

                        if (isSignature) {
                          return (
                            <div key={idx} className="pt-8 flex items-center justify-between text-xs sm:text-sm font-bold">
                              <span>{trimmed}</span>
                            </div>
                          )
                        }

                        if (isSection) {
                          return (
                            <div key={idx} className="font-bold text-xs sm:text-sm pt-2 pb-1">
                              {trimmed}
                            </div>
                          )
                        }

                        return (
                          <p key={idx} className="text-xs sm:text-sm text-justify indent-6 sm:indent-8 leading-relaxed mb-2">
                            {trimmed}
                          </p>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Tugmalar paneli */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep('fill')}
                  className="rounded-xl text-xs"
                >
                  ← Qayta tahrirlash
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-xl flex items-center gap-1.5 text-xs"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Nusxalandi!' : 'Matnni nusxalash'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="rounded-xl flex items-center gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Chop etish</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDownloadDoc(true)}
                    className="rounded-xl flex items-center gap-1.5 text-xs border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50"
                    title="Sud blankasining asl to'ldirilmagan namunasini yuklab olish"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bo‘sh Asl Blank (.doc)</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDownloadDoc(false)}
                    className="rounded-xl flex items-center gap-1.5 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>To‘ldirilgan Word (.doc)</span>
                  </Button>

                  <Button
                    onClick={() => handleDownloadPdf(false)}
                    disabled={downloadingPdf}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 text-xs shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'Tayyorlanmoqda...' : 'Rasmiy PDF yuklab olish'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
