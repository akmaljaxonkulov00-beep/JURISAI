'use client'

import React, { useState } from 'react'
import {
  X,
  Sparkles,
  BookOpen,
  UserCheck,
  Target,
  FileText,
  Users,
  Clock,
  HelpCircle,
  Briefcase,
  AlertCircle,
} from 'lucide-react'

export interface NewCaseFormData {
  name: string
  case_type: string
  user_role: string
  objectives: string
  known_facts: string
  evidence_docs: string
  opposing_party: string
  deadlines: string
  additional_notes: string
}

interface NewCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: NewCaseFormData) => void
  loading?: boolean
}

export const LEGAL_DOMAINS = [
  { value: 'fuqarolik', label: 'Fuqarolik huquqi', icon: '🏛️' },
  { value: 'shartnoma', label: 'Shartnoma nizolari', icon: '📜' },
  { value: 'mehnat', label: 'Mehnat huquqi', icon: '💼' },
  { value: 'oila', label: 'Oila huquqi', icon: '👨‍👩‍👧' },
  { value: 'meros', label: 'Meros huquqi', icon: '🏠' },
  { value: 'mamuriy', label: 'Maʼmuriy huquq', icon: '⚖️' },
  { value: 'jinoyat', label: 'Jinoyat ishlari', icon: '🛡️' },
  { value: 'boshqa', label: 'Boshqa soha', icon: '📂' },
]

export const USER_ROLES = [
  { value: 'davogar', label: 'Daʼvogar (Ariza beruvchi)' },
  { value: 'javobgar', label: 'Javobgar (Qarshi tomon)' },
  { value: 'jabrlanuvchi', label: 'Jabrlanuvchi' },
  { value: 'ayblanuvchi', label: 'Ayblanuvchi / Gumondor' },
  { value: 'advokat', label: 'Advokat / Yurist' },
  { value: 'ish_beruvchi', label: 'Ish beruvchi (Tashkilot)' },
  { value: 'xodim', label: 'Xodim' },
  { value: 'boshqa', label: 'Boshqa manfaatdor shaxs' },
]

export const PRESET_TEMPLATES = [
  {
    name: 'Qarz va shartnoma majburiyatini undirish',
    case_type: 'shartnoma',
    user_role: 'davogar',
    objectives: 'Qarzdorlik summasi va hisoblangan penyani toʻliq undirish',
    known_facts:
      '2024-yil 15-yanvarda xizmat koʻrsatish shartnomasi tuzilgan. Xizmatlar toʻliq koʻrsatilgan, biroq buyurtmachi 45 000 000 soʻm toʻlovni 6 oydan buyon kechiktirmoqda.',
    evidence_docs: 'Shartnoma, hisob-faktura, dalolatnoma, toʻlov talabnomasi',
    opposing_party: 'MChJ shaklidagi kontragent tashkilot',
    deadlines: 'Daʼvo muddati 3 yil, muddat oʻtib ketmagan',
  },
  {
    name: 'Ishdan noqonuniy boʻshatish va kompensatsiya',
    case_type: 'mehnat',
    user_role: 'xodim',
    objectives: 'Avvalgi lavozimga tiklanish va majburiy progul uchun haq undirish',
    known_facts:
      'Xodim shtat qisqarishi vaji bilan ogohlantirishsiz va tegishli toʻlovlarsiz ishdan boʻshatilgan. Kasaba uyushmasi roziligi olinmagan.',
    evidence_docs: 'Mehnat daftarchasi, buyruq nusxasi, oylik maosh maʼlumotnomasi',
    opposing_party: 'Kompaniya rahbariyati',
    deadlines: 'Mehnat Kodeksi boʻyicha sudga murojaat muddati 1 oy',
  },
  {
    name: 'Meros mulkini taqsimlash nizosi',
    case_type: 'meros',
    user_role: 'davogar',
    objectives: 'Merosdagi qonuniy ulushni ajratib olish va mulkka egalikni qayd etish',
    known_facts:
      'Vafot etgan ota nomidagi turar-joy binosi boshqa voris tomonidan toʻliq oʻzlashtirib olingan va notarial tartibda taqsimlanmagan.',
    evidence_docs: 'Tugʻilganlik haqidagi guvohnoma, vafot haqidagi guvohnoma, kadastr hujjati',
    opposing_party: 'Ikkinchi voris (aka/uka)',
    deadlines: 'Merosni qabul qilishning 6 oylik muddati',
  },
]

export default function NewCaseModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: NewCaseModalProps) {
  const [formData, setFormData] = useState<NewCaseFormData>({
    name: '',
    case_type: 'fuqarolik',
    user_role: 'davogar',
    objectives: '',
    known_facts: '',
    evidence_docs: '',
    opposing_party: '',
    deadlines: '',
    additional_notes: '',
  })

  if (!isOpen) return null

  const handleApplyTemplate = (tpl: (typeof PRESET_TEMPLATES)[0]) => {
    setFormData({
      name: tpl.name,
      case_type: tpl.case_type,
      user_role: tpl.user_role,
      objectives: tpl.objectives,
      known_facts: tpl.known_facts,
      evidence_docs: tpl.evidence_docs,
      opposing_party: tpl.opposing_party,
      deadlines: tpl.deadlines,
      additional_notes: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.known_facts.trim()) return
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                Yangi Huquqiy Ish Yaratish
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Ish tafsilotlarini kiriting — AI qonunlar bazasidan tahlil qilib qarorlar daraxtini
                tuzadi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates Bar */}
        <div className="px-6 py-3 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex-shrink-0 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> Tayyor namunalar:
          </span>
          {PRESET_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="text-[11px] font-medium px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors flex-shrink-0"
            >
              {tpl.name.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 1. Ish nomi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
              A) Ish nomi / Mavzusi *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: Kontragentdan 45 mln so'm qarzni va zararni undirish"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 2. Soha & Rol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
                B) Huquq sohasi *
              </label>
              <select
                value={formData.case_type}
                onChange={e => setFormData({ ...formData, case_type: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LEGAL_DOMAINS.map(d => (
                  <option key={d.value} value={d.value}>
                    {d.icon} {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
                C) Foydalanuvchining roli *
              </label>
              <select
                value={formData.user_role}
                onChange={e => setFormData({ ...formData, user_role: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {USER_ROLES.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Maqsad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
              D) Asosiy maqsad — “Men nimaga erishmoqchiman?”
            </label>
            <input
              type="text"
              value={formData.objectives}
              onChange={e => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="Masalan: Shartnomani bekor qilish va to'langan avansni qaytarish"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 4. Ma'lum faktlar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
              E) Maʼlum faktlar va voqealar rivoji *
            </label>
            <textarea
              required
              rows={3}
              value={formData.known_facts}
              onChange={e => setFormData({ ...formData, known_facts: e.target.value })}
              placeholder="Vaziyatni batafsil yozing: qachon nima bo'ldi, qanday kelishuv bor edi, kim o'z majburiyatini bajarmadi..."
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 5. Dalillar & Qarshi tomon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
                F) Mavjud hujjatlar / dalillar
              </label>
              <input
                type="text"
                value={formData.evidence_docs}
                onChange={e => setFormData({ ...formData, evidence_docs: e.target.value })}
                placeholder="Shartnoma, chek, yozishmalar, guvohlar..."
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
                G) Qarama-qarshi tomon
              </label>
              <input
                type="text"
                value={formData.opposing_party}
                onChange={e => setFormData({ ...formData, opposing_party: e.target.value })}
                placeholder="Jismoniy shaxs yoki tashkilot nomi"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 6. Muddatlar & Qo'shimcha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
                H) Vaqt cheklovi / muddatlar
              </label>
              <input
                type="text"
                value={formData.deadlines}
                onChange={e => setFormData({ ...formData, deadlines: e.target.value })}
                placeholder="Da'vo muddati yoki zudlik bilan kerak bo'lgan muddat"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-1">
                I) Qoʻshimcha izoh
              </label>
              <input
                type="text"
                value={formData.additional_notes}
                onChange={e => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Yana qanday muhim holatlar bor?"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.known_facts.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              <Sparkles className="w-4 h-4" />
              AI bilan tahlil qilish va daraxt yaratish
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
