'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  BookOpen,
  Search,
  Filter,
  Brain,
  Scale,
  Send,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Shield,
  X,
} from 'lucide-react'

export default function LawStudentQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Answer Modal State
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null)
  const [answerContent, setAnswerContent] = useState('')
  const [legalBasis, setLegalBasis] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answerSuccess, setAnswerSuccess] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)

  // AI Structure Helper
  const [aiStructuring, setAiStructuring] = useState(false)

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/questions?category=${categoryFilter}&search=${encodeURIComponent(searchQuery)}`)
      const json = await res.json()
      if (json.success && json.data) {
        setQuestions(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [categoryFilter, searchQuery])

  const openAnswerModal = (q: any) => {
    setSelectedQuestion(q)
    setAnswerContent('')
    setLegalBasis('')
    setAnswerSuccess(false)
    setAnswerError(null)
  }

  // IRAC Structure Generator with AI
  const handleGenerateIracStructure = () => {
    if (!selectedQuestion) return
    setAiStructuring(true)
    setTimeout(() => {
      setAnswerContent(
        `1. HUQUQIY MUAMMO (Issue):\nFuqaro ${selectedQuestion.title} masalasida huquqiy yechim so‘ramoqda.\n\n2. QO‘LLANILADIGAN QONUN NORMARI (Rule):\nO‘zbekiston Respublikasining tegishli qonun moddalari talablariga binoan...\n\n3. ISH HOLATLARINING QONUN BILAN TAHLILI (Application):\nVaziyat tahlili shuni ko‘rsatadiki...\n\n4. YAKUNIY XULOSA VA AMALIY TAVSIYA (Conclusion):\nFuqaroga amaliy tavsiya sifatida quyidagi tartibda harakat qilish tavsiya etiladi...`
      )
      setLegalBasis(`O‘zbekiston Respublikasi ${selectedQuestion.category}ga oid tegishli kodeks moddalari`)
      setAiStructuring(false)
    }, 400)
  }

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion || !answerContent.trim()) return

    setIsSubmitting(true)
    setAnswerError(null)

    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          content: answerContent,
          legalBasis,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setAnswerSuccess(true)
        setTimeout(() => {
          setSelectedQuestion(null)
          setAnswerSuccess(false)
          loadQuestions()
        }, 1500)
      } else {
        setAnswerError(json.error || 'Javob yuborishda xatolik yuz berdi')
      }
    } catch {
      setAnswerError('Server bilan aloqa uzildi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="law_student" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Ommaviy yuridik savollar bazasi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fuqarolar tomonidan yo‘llangan ommaviy savollarga javob yozib, amaliyot o‘tang
            </p>
          </div>

          <Link
            href="/law-student/answers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            Mening yuborgan javoblarim
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Savollar ichidan qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 whitespace-nowrap">Soha:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barcha sohalar</option>
              <option value="Fuqarolik huquqi">Fuqarolik huquqi</option>
              <option value="Mehnat huquqi">Mehnat huquqi</option>
              <option value="Oilaviy huquq">Oilaviy huquq</option>
              <option value="Meros huquqi">Meros huquqi</option>
              <option value="Iste’molchilar huquqlari">Iste’molchilar huquqlari</option>
              <option value="Uy-joy huquqi">Uy-joy huquqi</option>
              <option value="Jinoyat huquqi">Jinoyat huquqi</option>
            </select>
          </div>
        </div>

        {/* Questions Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
            Yuklanmoqda...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed space-y-2">
            <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Savollar topilmadi
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <div
                key={q.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {q.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {q.answers_count || 0} ta mavjud javob
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {q.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {q.description}
                </p>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Fuqaro: {q.citizen_name}
                  </span>

                  <button
                    onClick={() => openAnswerModal(q)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Javob yozish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Answer Submission Modal */}
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedQuestion(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  Talaba Javobi ({selectedQuestion.category})
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedQuestion.title}
                </h3>
              </div>

              {/* Question Context summary */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                {selectedQuestion.description}
              </div>

              {answerSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm">Javob muvaffaqiyatli yuborildi!</p>
                  <p className="text-xs">
                    Javobingiz mentor advokatga taqriz uchun yo‘naltirildi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  {answerError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                      {answerError}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Javob matni
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateIracStructure}
                      disabled={aiStructuring}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      IRAC strukturasi shablonini yuklash
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={answerContent}
                    onChange={e => setAnswerContent(e.target.value)}
                    placeholder="Qonuniy asoslar, tahlil va fuqaro uchun aniq yechimni bayon qiling..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Asoslangan qonun moddalari (masalan: MK 161-modda, FK 1135-modda)
                    </label>
                    <input
                      type="text"
                      value={legalBasis}
                      onChange={e => setLegalBasis(e.target.value)}
                      placeholder="Aniq qonun va modda raqamlarini kiriting"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 text-[11px] text-blue-800 dark:text-blue-300">
                    <Shield className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Javobingiz professional mentor advokat tomonidan tekshiriladi va tasdiqlangach
                    &ldquo;Advokat tomonidan tekshirilgan&rdquo; maqomini oladi.
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuestion(null)}
                      className="px-4 py-2 rounded-xl border text-xs font-medium"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      {isSubmitting ? 'Yuborilmoqda...' : 'Javobni taqrizga yuborish'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
