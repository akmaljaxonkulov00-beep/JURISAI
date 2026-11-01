'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import SiteLogo from '@/components/SiteLogo'
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
} from 'lucide-react'

export default function PublicQuestionDetailPage() {
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
          setError(json.error || 'Savol topilmadi')
        }
      } catch {
        setError('Tarmoq xatosi')
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Savol topilmadi</h2>
        <Link href="/questions" className="text-xs text-blue-600 font-semibold hover:underline">
          Ommaviy savollar ro‘yxatiga qaytish
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-[#0B1528] text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/citizen/ask"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Savol berish
            </Link>
            <Link
              href="/signin"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              Kirish
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Barcha savollarga qaytish
        </Link>

        {/* Question Header Card */}
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {question.category}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(question.created_at).toLocaleDateString('uz-UZ')}
            </span>
            <span className="text-xs text-gray-400">• {question.citizen_name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {question.title}
          </h1>

          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
            {question.description}
          </p>
        </div>

        {/* Answers List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Mavjud javoblar ({question.answers?.length || 0})
            </h2>
          </div>

          {/* AI Legal Disclaimer */}
          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40 p-4 rounded-xl flex items-start gap-3">
            <Brain className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wide">
                Huquqiy axborot xususiyati
              </h4>
              <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
                Ushbu javoblar ommaviy axborot va amaliyot xususiyatiga ega. &ldquo;Advokat tomonidan
                tekshirilgan&rdquo; belgisi faqat litsenziyaga ega advokat ko‘rib chiqqanidan so‘ng beriladi.
              </p>
            </div>
          </div>

          {question.answers?.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
              Hozircha javoblar berilmagan.
            </div>
          ) : (
            <div className="space-y-4">
              {question.answers.map((ans: any) => (
                <div
                  key={ans.id}
                  className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {ans.author_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(ans.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>

                    <div>
                      {ans.is_advocate_verified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                          <Shield className="w-3.5 h-3.5" /> Advokat tomonidan tekshirilgan
                        </span>
                      ) : ans.author_role === 'advocate' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Award className="w-3.5 h-3.5" /> Professional Advokat Javobi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          Talaba javobi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {ans.content}
                  </div>

                  {ans.legal_basis && (
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                      <strong>Asoslangan qonun moddalari:</strong> {ans.legal_basis}
                    </div>
                  )}

                  {ans.review_feedback && (
                    <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs text-blue-900 dark:text-blue-200">
                      <strong>Advokat taqrizi:</strong> {ans.review_feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
