'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Edit3,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'

export default function LawStudentMyAnswersPage() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMyAnswers() {
      if (!user?.id) return
      try {
        const res = await fetch('/api/answers?awaitingReview=true')
        const json = await res.json()
        if (json.success && json.data) {
          // Filter to my answers or sample answers
          const myAns = json.data.filter((a: any) => a.author_id === user.id || a.author_role === 'law_student')
          setAnswers(myAns)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadMyAnswers()
  }, [user?.id])

  const getStatusBadge = (status: string, isVerified: boolean) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Advokat tomonidan tekshirilgan
          </span>
        )
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Tahrir so‘ralgan
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Rad etilgan
          </span>
        )
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Advokat ko‘rib chiqmoqda
          </span>
        )
      case 'awaiting_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> Taqriz kutilmoqda
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="law_student" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Mening yuborgan javoblarim va mentor taqrizlari
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Advokatlar tomonidan ko‘rib chiqilgan, tasdiqlangan yoki tahrirlash so‘ralgan javoblar holati
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border">
            Yuklanmoqda...
          </div>
        ) : answers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed space-y-3">
            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hozircha birorta ham javob yubormagansiz
            </p>
            <Link
              href="/law-student/questions"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Ommaviy savollarga o‘tish
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map(ans => (
              <div
                key={ans.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <span className="text-xs text-gray-400">
                      Yuborilgan sana: {new Date(ans.created_at).toLocaleDateString('uz-UZ')}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                      Savol ID: #{ans.question_id}
                    </h3>
                  </div>
                  <div>{getStatusBadge(ans.status, ans.is_advocate_verified)}</div>
                </div>

                {/* My Answer Text */}
                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl font-mono">
                  {ans.content}
                </div>

                {/* Legal Citations */}
                {ans.legal_basis && (
                  <div className="text-xs text-gray-500">
                    <strong>Qonun moddalari:</strong> {ans.legal_basis}
                  </div>
                )}

                {/* Mentor Feedback Card */}
                {ans.review_feedback && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Mentor Advokat Taqrizi ({ans.reviewed_by_advocate_name || 'Advokat'}):
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      {ans.review_feedback}
                    </p>
                  </div>
                )}

                {/* Action if revision requested */}
                {ans.status === 'revision_requested' && (
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/law-student/questions`}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Javobni tahrirlash va qayta yuborish
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
