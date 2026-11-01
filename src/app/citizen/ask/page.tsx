'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  Brain,
  HelpCircle,
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react'

const CATEGORIES = [
  'Fuqarolik huquqi',
  'Mehnat huquqi',
  'Oilaviy huquq',
  'Jinoyat huquqi',
  'Meros huquqi',
  'Iste’molchilar huquqlari',
  'Uy-joy huquqi',
  'Soliq va moliya',
  'Yer va ko‘chmas mulk',
  'Biznes va korporativ huquq',
  'Ma’muriy huquq',
  'Yo‘l harakati va transport',
]

export default function AskQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Fuqarolik huquqi')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const [isClassifying, setIsClassifying] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI Category Auto-Suggest
  const handleAiSuggest = async () => {
    if (!title && !description) {
      setError('Iltimos, avval savol sarlavhasi yoki matnini yozing')
      return
    }
    setError(null)
    setIsClassifying(true)
    try {
      const res = await fetch('/api/questions/ai-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setAiSuggestion(json.data)
        if (json.data.category) {
          setCategory(json.data.category)
        }
      }
    } catch {
      setError('AI tahlilida xatolik yuz berdi')
    } finally {
      setIsClassifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Savol sarlavhasi va to‘liq tavsifi majburiy')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          urgency,
          visibility,
          is_anonymous: isAnonymous,
          ai_category_confidence: aiSuggestion?.confidence || 0.95,
        }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        router.push(`/citizen/questions/${json.data.id}`)
      } else {
        setError(json.error || 'Savolni yuborishda xatolik yuz berdi')
      }
    } catch {
      setError('Server bilan bog‘lanishda xatolik')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              Yuridik savol berish
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Muammoingizni batafsil bayon qiling. AI sohasi bo‘yicha to‘g‘ri tasniflashga va
              malakali advokatlar yoki amaliyotchi huquqshunoslardan asosli javob olishga yordam beradi.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Savol sarlavhasi (qisqa mazmuni) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masalan: Ish beruvchi yillik mehnat ta’tilini berishdan bosh tortmoqda"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Vaziyatning to‘liq tavsifi <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isClassifying}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isClassifying ? 'AI tahlil qilmoqda...' : 'AI orqali sohani aniqlash'}
                </button>
              </div>
              <textarea
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Voqea tafsilotlarini, tomonlarni, tuzilgan shartnomalarni va siz duch kelayotgan asosiy huquqiy to‘siqni yozing..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            {/* AI Suggestion Box */}
            {aiSuggestion && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  AI Tahlil Natijasi: {aiSuggestion.category} ({Math.round((aiSuggestion.confidence || 0.9) * 100)}% ishonch)
                </div>
                {aiSuggestion.summary && (
                  <p className="text-xs text-gray-600 dark:text-gray-300">{aiSuggestion.summary}</p>
                )}
                {aiSuggestion.hasSensitiveInfo && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{aiSuggestion.sensitiveWarning}</span>
                  </div>
                )}
              </div>
            )}

            {/* Category & Urgency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Huquqiy soha
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">
                  AI taklif qilgan sohani xohishingizga ko‘ra o‘zgartirishingiz mumkin.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Shoshilinchlik darajasi
                </label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Past (shoshilinch emas)</option>
                  <option value="medium">O‘rta (standart 24-48 soat)</option>
                  <option value="high">Yuqori (tezkor yordam lozim)</option>
                </select>
              </div>
            </div>

            {/* Visibility & Privacy Toggles */}
            <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Maxfiylik va ko‘rinish parametrlari
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-500" />
                      Ommaviy savol (bepul)
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Savolingiz ommaviy tasmada ko‘rinadi. Huquqshunos talabalar va mentor
                      advokatlar javob bera oladi.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4 text-amber-500" />
                      Faqat shaxsiy / Maxfiy konsultatsiya
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Savol va biriktirilgan hujjatlar hech qachon ommaga ko‘rinmaydi. Faqat siz
                      tayinlagan advokat ko‘ra oladi.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Mening ismim ommaviy ko‘rsatilmasin (Anonim qoldirish)
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Savolni e’lon qilish'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
