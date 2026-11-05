'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
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
  Lock,
  Unlock,
  Clock,
  Award,
  AlertTriangle,
  ChevronRight,
  FileCheck,
} from 'lucide-react'

export default function LawStudentQuestionsPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected Question & Locking
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null)
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState<number>(0)
  const [isLocking, setIsLocking] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)

  // Answer Submission State
  const [answerContent, setAnswerContent] = useState('')
  const [legalBasis, setLegalBasis] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  // Countdown timer for question lock
  useEffect(() => {
    if (lockRemainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setLockRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lockRemainingSeconds])

  const handleStartAnswering = async (q: any) => {
    setLockError(null)
    setIsLocking(true)
    try {
      // Call lock endpoint to lock question for 20 minutes
      const res = await fetch(`/api/questions/${q.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' }),
      })
      const json = await res.json()
      if (!json.success) {
        setLockError(json.error || 'Savolni band qilib bo‘lmadi')
        setIsLocking(false)
        return
      }

      // Success locking: calculate remaining seconds (20 mins = 1200s)
      const expiresAt = json.lockedUntil ? new Date(json.lockedUntil).getTime() : Date.now() + 20 * 60 * 1000
      const remainingSecs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))

      setSelectedQuestion(q)
      setLockRemainingSeconds(remainingSecs || 1200)
      setAnswerContent('')
      setLegalBasis('')
      setEvaluationResult(null)
      setAnswerError(null)
    } catch {
      setLockError('Tarmoq xatosi, qayta urinib ko‘ring')
    } finally {
      setIsLocking(false)
    }
  }

  const handleCancelAnswering = async () => {
    if (selectedQuestion) {
      try {
        await fetch(`/api/questions/${selectedQuestion.id}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unlock' }),
        })
      } catch (e) {
        console.error(e)
      }
    }
    setSelectedQuestion(null)
    setEvaluationResult(null)
    setLockRemainingSeconds(0)
    loadQuestions()
  }

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion || !answerContent.trim()) return

    if (lockRemainingSeconds <= 0) {
      setAnswerError('Ajratilgan 20 daqiqalik vaqt tugadi. Iltimos, savolni qayta band qiling.')
      return
    }

    setIsSubmitting(true)
    setAnswerError(null)

    try {
      const res = await fetch('/api/law-student/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          content: answerContent,
          legalBasis,
          citations: legalBasis ? legalBasis.split(',').map((s: string) => s.trim()) : [],
        }),
      })

      const json = await res.json()
      if (json.success) {
        setEvaluationResult({
          evaluation: json.evaluation,
          rewardAmount: json.rewardAmount,
        })
        loadQuestions()
      } else {
        setAnswerError(json.error || 'Javobni saqlashda xatolik yuz berdi')
      }
    } catch {
      setAnswerError('Server bilan aloqa uzildi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="law_student" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Ommaviy yuridik savollar (Bir savolga — bitta talaba)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Savolni tanlang va 20 daqiqaga band qiling. Sifatli javob uchun kafolatlangan pul mukofoti oling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/law-student/answers"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              Mening javoblarim
            </Link>
            <Link
              href="/law-student/wallet"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              Hamyon
            </Link>
          </div>
        </div>

        {/* Notice Banner about Locking */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Bir savol — bitta talaba qoidasi:</p>
            <p className="text-amber-800 dark:text-amber-300">
              Siz savolni tanlaganingizda, u <strong>20 daqiqaga</strong> siz uchun band qilinadi. Boshqa talabalar unga javob bera olmaydi. 20 daqiqa ichida javob berilmasa, savol yana ommaviy holatga qaytadi. Javob yuborilgach esa savol to‘liq yopiladi va boshqa talabalar javob yoza olmaydi.
            </p>
          </div>
        </div>

        {lockError && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {lockError}
          </div>
        )}

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
              Hozircha javob berilmagan savollar yo‘q
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => {
              const isLocked = q.locked_until && new Date(q.locked_until).getTime() > Date.now()
              const isLockedByMe = isLocked && q.locked_by_student_id === user?.id
              const isLockedByOther = isLocked && !isLockedByMe
              const isAlreadyAnswered = (q.answers_count || 0) > 0 || q.status === 'answered' || q.status === 'resolved'

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-gray-900 p-6 rounded-2xl border shadow-sm space-y-3 transition-all ${
                    isLockedByOther
                      ? 'border-amber-200/60 dark:border-amber-900/40 bg-amber-50/10'
                      : isAlreadyAnswered
                        ? 'border-gray-200 dark:border-gray-800 opacity-75'
                        : 'border-gray-100 dark:border-gray-800'
                  }`}
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

                    <div className="flex items-center gap-2">
                      {isAlreadyAnswered ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Javob berilgan (Yopiq)
                        </span>
                      ) : isLockedByOther ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 border border-amber-200">
                          <Lock className="w-3 h-3" /> Boshqa talaba tomonidan band qilingan
                        </span>
                      ) : isLockedByMe ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1 border border-indigo-200">
                          <Clock className="w-3 h-3" /> Siz tomoningizdan band qilingan
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Ochiq (Bo‘sh)
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {q.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {q.description}
                  </p>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Murojaatchi fuqaro: {q.citizen_name || 'Fuqaro'}
                    </span>

                    {isAlreadyAnswered ? (
                      <span className="text-xs text-gray-400 italic">
                        Ushbu savolga talaba tomonidan javob berilgan
                      </span>
                    ) : isLockedByOther ? (
                      <button
                        disabled
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" /> 20 daqiqaga band
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartAnswering(q)}
                        disabled={isLocking}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {isLockedByMe ? 'Javob berishni davom etish' : 'Band qilish va javob yozish'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Answer Submission & AI Feedback Modal */}
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleCancelAnswering}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Lock Timer Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Savol faqat siz uchun band qilingan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-700 dark:text-indigo-300">Qolgan vaqt:</span>
                  <span
                    className={`font-mono text-sm font-extrabold px-3 py-1 rounded-lg ${
                      lockRemainingSeconds <= 300
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {formatTimer(lockRemainingSeconds)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  {selectedQuestion.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedQuestion.title}
                </h3>
              </div>

              {/* Question Description */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-36 overflow-y-auto">
                {selectedQuestion.description}
              </div>

              {/* AI Evaluation Result Card */}
              {evaluationResult ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md">
                          {evaluationResult.evaluation?.overallScore || 80}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            AI Baholash Natijasi: {evaluationResult.evaluation?.overallScore >= 70 ? 'A’lo sifat' : 'Qoniqarli'}
                          </h4>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300">
                            7 mezon bo‘yicha tahlil yakunlandi va javob fuqaroga yetkazildi.
                          </p>
                        </div>
                      </div>

                      {evaluationResult.rewardAmount > 0 && (
                        <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-md flex items-center gap-1.5 self-start sm:self-auto">
                          <Award className="w-4 h-4 text-amber-300" />
                          +{Number(evaluationResult.rewardAmount).toLocaleString()} UZS mukofot!
                        </div>
                      )}
                    </div>

                    {/* 7-Criteria Breakdown */}
                    {evaluationResult.evaluation?.criteriaScores && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                        {Object.entries(evaluationResult.evaluation.criteriaScores).map(([k, v]: any) => (
                          <div key={k} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/70 dark:bg-gray-800/60">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {k === 'legalBasis' ? 'Qonuniy asoslanganlik' :
                               k === 'citationAccuracy' ? 'Moddalar aniqligi' :
                               k === 'logicalConsistency' ? 'Mantiqiy izchillik' :
                               k === 'clarityForCitizen' ? 'Fuqaroga tushunarliligi' :
                               k === 'practicalSolution' ? 'Amaliy yechim' :
                               k === 'noFactualErrors' ? 'Xatolarning yo‘qligi' :
                               k === 'structureQuality' ? 'Professional struktura' : k}
                            </span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                              {v} / 100
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Feedback and Strengths */}
                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300 pt-2">
                      {evaluationResult.evaluation?.feedback && (
                        <div>
                          <strong className="text-gray-900 dark:text-white">AI Xulosasi:</strong> {evaluationResult.evaluation.feedback}
                        </div>
                      )}
                      {evaluationResult.evaluation?.strengths?.length > 0 && (
                        <div>
                          <strong className="text-emerald-700 dark:text-emerald-400">Ijobiy jihatlar:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {evaluationResult.evaluation.strengths.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {evaluationResult.evaluation?.weaknesses?.length > 0 && (
                        <div>
                          <strong className="text-amber-700 dark:text-amber-400">Rivojlantirish kerak bo‘lgan jihatlar:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {evaluationResult.evaluation.weaknesses.map((w: string, idx: number) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Link
                      href="/law-student/wallet"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" />
                      Hamyonni tekshirish
                    </Link>
                    <button
                      onClick={handleCancelAnswering}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Boshqa savollarga o‘tish
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  {answerError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                      {answerError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Professional Yuridik Javob Matni
                    </label>
                    <textarea
                      rows={8}
                      value={answerContent}
                      onChange={e => setAnswerContent(e.target.value)}
                      placeholder="Savol bo‘yicha huquqiy tahlil, qo‘llanadigan normalar va fuqaro uchun qadamma-qadam yechimni yozing..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Asoslangan qonun moddalari (masalan: MK 161-modda, FK 1135-modda)
                    </label>
                    <input
                      type="text"
                      value={legalBasis}
                      onChange={e => setLegalBasis(e.target.value)}
                      placeholder="Aniq qonun va modda raqamlarini vergul bilan ajratib kiriting"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      AI 7 ta mezon bo‘yicha avtomatik taqriz qiladi:
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Huquqiy asoslanganlik, qonun moddalari aniqligi, mantiqiy izchillik, fuqaroga tushunarliligi, amaliy yechim, xatolarning yo‘qligi va professional tuzilish. 70 balldan yuqori natijaga mukofot to‘lanadi.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelAnswering}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium"
                    >
                      Bekor qilish va bandni yechish
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || lockRemainingSeconds <= 0}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? 'AI tekshirmoqda...' : 'Javobni topshirish'}
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
