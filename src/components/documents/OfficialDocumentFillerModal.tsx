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
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.documentName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; padding: 40px; color: #000; }
            pre { white-space: pre-wrap; font-family: inherit; }
            .header { text-align: right; margin-bottom: 30px; font-weight: bold; }
            .stamp { border: 2px dashed #000; padding: 10px; margin-top: 40px; font-size: 10pt; }
          </style>
        </head>
        <body>
          <pre>${renderedContent}</pre>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const blob = await generateLegalPdf({
        title: doc.documentName,
        subtitle: `Rasmiy blank: ${doc.officialSourceName} (${doc.issuingAuthority})`,
        content: renderedContent,
        date: new Date().toLocaleDateString('uz-UZ'),
        author: doc.officialSourceName,
        legalBasis: doc.legalBasis.map((l) => `${l.code} ${l.article}`).join(', '),
      })
      downloadPdfBlob(blob, `${doc.documentName.replace(/\s+/g, '_')}.pdf`)
    } catch (e) {
      console.error(e)
      alert('PDF yaratishda xatolik yuz berdi. Matn nusxasini nusxalab olishingiz mumkin.')
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
            /* Preview and Export View */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-8 bg-white border border-slate-300 shadow-lg rounded-xl text-slate-900 font-serif leading-relaxed text-sm">
                <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-wide">
                      O‘zbekiston Respublikasi Rasmiy Yuridik Hujjati
                    </h2>
                    <p className="text-xs text-slate-500">
                      Vakolatli organ tasdiqlagan elektron namuna · ID: {doc.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-400 font-sans text-xs">
                      ✓ Rasmiyblank
                    </Badge>
                  </div>
                </div>

                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-800">
                  {renderedContent}
                </pre>

                <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span>SHA-256 xesh: {doc.sha256Checksum.slice(0, 32)}...</span>
                  <span>Juristiv.uz Yuridik Hujjatlar Tizimi 2.0</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep('fill')}
                  className="rounded-xl"
                >
                  ← Qayta tahrirlash
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-xl flex items-center gap-1.5"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Nusxalandi!' : 'Matnni nusxalash'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="rounded-xl flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Chop etish</span>
                  </Button>

                  <Button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-4 h-4" />
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
