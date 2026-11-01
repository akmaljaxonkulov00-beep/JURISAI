'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  FileText,
  Clock,
  CheckCircle,
  Award,
  Brain,
  Shield,
  ArrowLeft,
  Users,
  MessageSquare,
  AlertCircle,
  Eye,
  EyeOff,
  Share2,
} from 'lucide-react'

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params?.id as string

  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuestion() {
      try {
        const res = await fetch(`/api/questions/${questionId}`)
        const json = await res.json()
        if (json.success && json.data) {
          setQuestion(json.data)
        } else {
          setError(json.error || 'Savolni yuklab bo‘lmadi')
        }
      } catch {
        setError('Tarmoq xatosi yuz berdi')
      } finally {
        setLoading(false)
      }
    }
    if (questionId) loadQuestion()
  }, [questionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-sm text-gray-500">Yuklanmoqda...</p>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PlatformRoleNav currentRole="citizen" />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Savol mavjud emas yoki kirish cheklangan</h2>
          <p className="text-sm text-gray-500">{error || 'Maxfiy savolga faqat uning egasi yoki advokat kirishi mumkin.'}</p>
          <button
            onClick={() => router.push('/citizen/questions')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
          >
            Mening savollarimga qaytish
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/citizen/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Barcha savollarga qaytish
        </Link>

        {/* Question Header Card */}
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {question.category}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                question.status === 'answered'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {question.status === 'answered' ? 'Javob berilgan' : 'Ochiq savol'}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(question.created_at).toLocaleString('uz-UZ')}
            </span>
            {question.visibility === 'private' ? (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Maxfiy savol
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Ommaviy savol
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {question.title}
          </h1>

          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
            {question.description}
          </p>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Muallif: {question.citizen_name}</span>
            <span className="capitalize">
              Shoshilinchlik darajasi: <strong className="text-gray-800 dark:text-gray-200">{question.urgency}</strong>
            </span>
          </div>
        </div>

        {/* Answers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Kelib tushgan javoblar ({question.answers?.length || 0})
            </h2>
            <Link
              href="/citizen/advocates"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Advokat bilan bog‘lanish
            </Link>
          </div>

          {/* AI Initial Suggestion Notice */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-900/40 p-4 rounded-xl flex items-start gap-3">
            <Brain className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wide">
                Huquqiy eslatma (AI va taqrizlar)
              </h4>
              <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
                Platformadagi javoblar dastlabki yuridik tushuntirish xususiyatiga ega. &ldquo;Advokat
                tomonidan tekshirilgan&rdquo; belgisi faqat litsenziyaga ega advokat rasmiy taqriz berganidan
                so‘ng ko‘rsatiladi. Murakkab sud ishlari bo‘yicha rasmiy advokat bilan shaxsiy
                konsultatsiya o‘tkazish tavsiya etiladi.
              </p>
            </div>
          </div>

          {question.answers?.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-2">
              <Clock className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Hozircha javoblar yo‘q
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Savolingiz ommaviy tasmada faol. Huquqshunos talabalar va advokatlar ko‘rib chiqmoqda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {question.answers.map((ans: any) => {
                const isAdvocateRole = ans.author_role === 'advocate'
                const isVerifiedStudentAns = ans.is_advocate_verified

                return (
                  <div
                    key={ans.id}
                    className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
                  >
                    {/* Answer Author Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-sm text-blue-700 dark:text-blue-300">
                          {ans.author_name?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {ans.author_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(ans.created_at).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {isAdvocateRole && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            <Award className="w-3.5 h-3.5" /> Professional Advokat Javobi
                          </span>
                        )}

                        {isVerifiedStudentAns && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Shield className="w-3.5 h-3.5" /> Advokat tomonidan tekshirilgan
                          </span>
                        )}

                        {!isAdvocateRole && !isVerifiedStudentAns && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            Talaba javobi (Tekshiruvda)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answer Content */}
                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {ans.content}
                    </div>

                    {/* Legal Basis Citations */}
                    {ans.legal_basis && (
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">
                          Asoslangan qonun moddalari:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 font-mono">
                          {ans.legal_basis}
                        </p>
                      </div>
                    )}

                    {/* Mentor Advocate Feedback Box (if reviewed) */}
                    {ans.review_feedback && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 text-xs font-bold">
                          <Shield className="w-4 h-4 text-blue-600" />
                          Advokat taqrizi va tavsiyasi ({ans.reviewed_by_advocate_name || 'Advokat'}):
                        </div>
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                          {ans.review_feedback}
                        </p>
                      </div>
                    )}

                    {/* Action: Book Advocate */}
                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/citizen/advocates?specialty=${encodeURIComponent(question.category)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Ushbu soha advokati bilan konsultatsiya olish
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
