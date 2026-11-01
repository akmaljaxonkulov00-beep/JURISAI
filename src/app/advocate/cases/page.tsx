'use client'

import React, { useState, useEffect } from 'react'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  Briefcase,
  FileText,
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  Lock,
  User,
  Phone,
  Edit,
  X,
  AlertCircle,
} from 'lucide-react'

export default function AdvocateCasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // New Case Modal State
  const [showModal, setShowModal] = useState(false)
  const [caseTitle, setCaseTitle] = useState('')
  const [caseCategory, setCaseCategory] = useState('Fuqarolik nizosi')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCases = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cases')
      const json = await res.json()
      if (json.success && json.data) setCases(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseTitle.trim() || !clientName.trim() || !clientPhone.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseTitle,
          caseCategory,
          clientName,
          clientPhone,
          clientEmail,
          description,
          deadline,
          privateNotes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowModal(false)
        setCaseTitle('')
        setClientName('')
        setClientPhone('')
        setPrivateNotes('')
        loadCases()
      }
    } catch {
      alert('Ish yaratishda xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="advocate" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Sud ishlari dosyesi va boshqaruvi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mijozlar sud ishlari, muddatlar, vazifalar va faqat advokat uchun maxfiy eslatmalar
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Yangi ish ochish
          </button>
        </div>

        {/* Security Alert Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            Ushbu dosye va undagi shaxsiy eslatmalar (private notes) faqat advokat uchun
            ochiq. Mijozlar, talabalar yoki begona shaxslar bu yozuvlarga kirish huquqiga ega emas.
          </span>
        </div>

        {/* Cases Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border">
            Ishlar yuklanmoqda...
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed space-y-3">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hozircha birorta ham ish ochilmagan
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Birinchi ishni ochish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map(c => (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {c.case_category}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                      {c.case_title}
                    </h3>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Faol
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Mijoz: <strong className="text-gray-900 dark:text-white">{c.client_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Telefon: {c.client_phone}</span>
                  </div>
                  {c.deadline && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sud muddati: {c.deadline}</span>
                    </div>
                  )}
                </div>

                {c.description && (
                  <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl leading-relaxed">
                    {c.description}
                  </p>
                )}

                {/* Private Notes Box (Advocate Eyes Only) */}
                {c.private_notes && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Advokat maxfiy qaydi (Faqat siz uchun):
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-mono">
                      {c.private_notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Case Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Yangi sud ishi kartochkasini ochish
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCase} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ish nomi / mavzusi
                  </label>
                  <input
                    type="text"
                    value={caseTitle}
                    onChange={e => setCaseTitle(e.target.value)}
                    placeholder="Masalan: Mehnat ta’tili kompensatsiyasi bo‘yicha da’vo"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Mijoz F.I.Sh.
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Anvar Qodirov"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Nizo sohasi
                    </label>
                    <select
                      value={caseCategory}
                      onChange={e => setCaseCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    >
                      <option value="Fuqarolik nizosi">Fuqarolik nizosi</option>
                      <option value="Mehnat nizosi">Mehnat nizosi</option>
                      <option value="Oilaviy nizo">Oilaviy nizo</option>
                      <option value="Meros nizosi">Meros nizosi</option>
                      <option value="Iqtisodiy/Biznes">Iqtisodiy/Biznes</option>
                      <option value="Jinoyat ishi">Jinoyat ishi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Sud muddati / Deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Umumiy ish tavsifi
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ishning qisqacha mazmuni va da’vo talablari..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Maxfiy advokat eslatmasi (Private Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={privateNotes}
                    onChange={e => setPrivateNotes(e.target.value)}
                    placeholder="Mijozga ko‘rsatilmaydigan ichki strategiya, zaifliklar va xulosalar..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border text-xs"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    {isSubmitting ? 'Saqlanmoqda...' : 'Dosyeni ochish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
