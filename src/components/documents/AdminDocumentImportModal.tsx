'use client'

import React, { useState } from 'react'
import {
  X,
  Upload,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import crypto from 'crypto'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newDoc: any) => void
}

export default function AdminDocumentImportModal({ isOpen, onClose, onSuccess }: Props) {
  const [documentName, setDocumentName] = useState('')
  const [category, setCategory] = useState('civil')
  const [officialSourceName, setOfficialSourceName] = useState<'LexUZ' | 'Oliy Sud' | 'my.sud.uz' | 'Adliya vazirligi'>('Oliy Sud')
  const [officialSourceUrl, setOfficialSourceUrl] = useState('')
  const [issuingAuthority, setIssuingAuthority] = useState('')
  const [versionNumber, setVersionNumber] = useState('1.0')
  const [language, setLanguage] = useState<'uz' | 'ru'>('uz')
  const [description, setDescription] = useState('')
  const [legalArticle, setLegalArticle] = useState('')
  const [legalUrl, setLegalUrl] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED_OFFICIAL' | 'PENDING_VERIFICATION'>('VERIFIED_OFFICIAL')
  const [fileName, setFileName] = useState('')
  const [checksum, setChecksum] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    // Compute client-side SHA-256 checksum
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result
      if (buffer) {
        const hash = crypto.createHash('sha256').update(Buffer.from(buffer as ArrayBuffer)).digest('hex')
        setChecksum(hash)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentName.trim() || !officialSourceUrl.trim() || !issuingAuthority.trim()) {
      setError('Iltimos, hujjat nomi, rasmiy manba URL va vakolatli organni to‘liq kiriting.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const dummyChecksum = checksum || crypto.createHash('sha256').update(documentName + Date.now()).digest('hex')

      const newDoc = {
        id: `doc-${category}-${Date.now().toString().slice(-4)}`,
        documentName,
        category,
        categoryNameUz:
          category === 'civil' ? 'Fuqarolik huquqi' :
          category === 'family' ? 'Oilaviy huquq' :
          category === 'labor' ? 'Mehnat huquqi' :
          category === 'contracts' ? 'Shartnomalar' :
          category === 'inheritance' ? 'Meros huquqi' :
          category === 'administrative' ? 'Ma’muriy huquq' :
          category === 'criminal' ? 'Jinoyat huquqi' :
          category === 'notarial' ? 'Notariat' :
          category === 'procedural' ? 'Sud protsessual' : 'Boshqa',
        officialSourceName,
        officialSourceUrl,
        storagePath: `juristiv-official-documents/${category}/${fileName || 'official_document.pdf'}`,
        originalFilename: fileName || `${documentName}.pdf`,
        fileSize: 150000,
        language,
        issuingAuthority,
        publicationDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        versionNumber,
        verificationStatus,
        lastVerifiedAt: new Date().toISOString(),
        sha256Checksum: dummyChecksum,
        description,
        fields: [
          {
            id: 'court_or_authority',
            name: 'court_or_authority',
            label: 'Sud yoki vakolatli organ nomi',
            type: 'text',
            required: true,
            placeholder: 'Vakolatli sud yoki organ',
          },
          {
            id: 'applicant_fullname',
            name: 'applicant_fullname',
            label: 'Arizachi / Murojaatchi F.I.Sh.',
            type: 'text',
            required: true,
            placeholder: 'Familiya Ism Sharif',
          },
          {
            id: 'case_details',
            name: 'case_details',
            label: 'Holat va talab mazmuni',
            type: 'textarea',
            required: true,
            placeholder: 'Murojaat asosi va talablar...',
          },
        ],
        fillableType: 'form_fields',
        legalBasis: [
          {
            code: legalArticle.split(' ')[0] || 'Qonun',
            article: legalArticle.split(' ')[1] || '1-modda',
            title: documentName,
            officialUrl: legalUrl || officialSourceUrl,
            description: issuingAuthority,
          },
        ],
        downloadCount: 0,
      }

      onSuccess(newDoc)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Hujjatni saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Rasmiy PDF Import & Tasdiqlash (Admin)
              </h3>
              <p className="text-xs text-slate-500">
                Davlat organlari va LexUZ rasmiy blanklarini kutubxonaga kiritish
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rasmiy Hujjat Nomi <span className="text-red-500">*</span>
              </label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Masalan: Nikohni bekor qilish to‘g‘risida da’vo arizasi"
                className="text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kategoriya (10 ta rasmiy soha)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="civil">Fuqarolik huquqi</option>
                <option value="criminal">Jinoyat huquqi</option>
                <option value="administrative">Ma’muriy huquq</option>
                <option value="family">Oilaviy huquq</option>
                <option value="labor">Mehnat huquqi</option>
                <option value="contracts">Shartnomalar</option>
                <option value="inheritance">Meros huquqi</option>
                <option value="notarial">Notariat</option>
                <option value="procedural">Sud protsessual</option>
                <option value="other">Boshqa</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rasmiy Manba
              </label>
              <select
                value={officialSourceName}
                onChange={(e) => setOfficialSourceName(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Oliy Sud">O‘zbekiston Oliy Sudi</option>
                <option value="my.sud.uz">my.sud.uz Sud Portali</option>
                <option value="LexUZ">LexUZ Qonunchilik Boshqarmasi</option>
                <option value="Adliya vazirligi">Adliya Vazirligi</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rasmiy Manba URL havolasi <span className="text-red-500">*</span>
              </label>
              <Input
                value={officialSourceUrl}
                onChange={(e) => setOfficialSourceUrl(e.target.value)}
                placeholder="https://my.sud.uz/templates/... yoki https://lex.uz/docs/..."
                className="text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vakolatli Organ / Plenum <span className="text-red-500">*</span>
              </label>
              <Input
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="O‘zbekiston Respublikasi Oliy Sudi Plenumi"
                className="text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hujjat Versiyasi
              </label>
              <Input
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="2.1"
                className="text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Huquqiy Asosi (Modda)
              </label>
              <Input
                value={legalArticle}
                onChange={(e) => setLegalArticle(e.target.value)}
                placeholder="FK 732-modda yoki FPK 189-modda"
                className="text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                LexUZ modda havolasi
              </label>
              <Input
                value={legalUrl}
                onChange={(e) => setLegalUrl(e.target.value)}
                placeholder="https://lex.uz/docs/111189#..."
                className="text-sm rounded-xl"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rasmiy Blank PDF fayli (Ixtiyoriy)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {checksum && (
                <p className="text-[11px] font-mono text-emerald-600 truncate mt-1">
                  SHA-256 xesh: {checksum}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hujjat Tavsifi va Qo‘llanilishi
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ushbu rasmiy namuna qachon va qaysi sudda qo‘llaniladi..."
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> VERIFIED_OFFICIAL maqomi beriladi
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? 'Saqlanmoqda...' : 'Blankni Tasdiqlash & Kiritish'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
