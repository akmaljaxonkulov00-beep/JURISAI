'use client'

import React, { useState, useEffect } from 'react'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  MessageSquare,
  BookOpen,
  Send,
  X,
} from 'lucide-react'

export default function AdvocateMentorshipPage() {
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Review Modal State
  const [selectedAns, setSelectedAns] = useState<any | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'revision_requested' | 'rejected'>('approved')
  const [feedback, setFeedback] = useState('')
  const [revisionNotes, setRevisionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadAnswers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/answers?awaitingReview=true')
      const json = await res.json()
      if (json.success && json.data) {
        setAnswers(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnswers()
  }, [])

  const openReviewModal = (ans: any) => {
    setSelectedAns(ans)
    setReviewStatus('approved')
    setFeedback('')
    setRevisionNotes('')
    setSuccessMsg(null)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAns || !feedback.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/answers/${selectedAns.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          feedback,
          revisionNotes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message)
        setTimeout(() => {
          setSelectedAns(null)
          setSuccessMsg(null)
          loadAnswers()
        }, 1500)
      } else {
        alert(json.error || 'Taqrizni saqlashda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="advocate" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Huquqshunos talabalarga mentorlik va javoblarni taqrizlash
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Talabalar yozgan javoblarni tahlil qiling, tuzatishlar kiriting va qonuniy asoslangan javoblarga
            &ldquo;Advokat tomonidan tekshirilgan&rdquo; tasdiq belgisini bering.
          </p>
        </div>

        {/* Notice Card */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Talaba javobi faqat sizning rasmiy ijobiy taqrizingizdan so‘nggina fuqarolar uchun &ldquo;Advokat tomonidan tekshirilgan&rdquo; belgisi bilan ko‘rsatiladi.
          </span>
        </div>

        {/* Answers List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border">
            Taqriz kutilayotgan javoblar yuklanmoqda...
          </div>
        ) : answers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Hozirda taqriz kutilayotgan yangi javoblar yo‘q
            </p>
            <p className="text-xs text-gray-400">Barcha talaba javoblari ko‘rib chiqilgan.</p>
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
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Savol ID: #{ans.question_id}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                      Talaba: {ans.author_name}
                    </h3>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Taqriz kutilmoqda
                  </span>
                </div>

                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl font-mono">
                  {ans.content}
                </div>

                {ans.legal_basis && (
                  <div className="text-xs text-gray-500">
                    <strong>Ko‘rsatilgan qonun moddalari:</strong> {ans.legal_basis}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => openReviewModal(ans)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" /> Taqriz berish va qaror qabul qilish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Action Modal */}
        {selectedAns && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Talaba javobiga mentorlik taqrizi
                </h3>
                <button
                  onClick={() => setSelectedAns(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {successMsg ? (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs font-semibold">
                  {successMsg}
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Qaror / Natija
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewStatus('approved')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          reviewStatus === 'approved'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Tasdiqlash
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewStatus('revision_requested')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          reviewStatus === 'revision_requested'
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Tahrirlash
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewStatus('rejected')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          reviewStatus === 'rejected'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Rad etish
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Yuridik taqriz va talabaga ta’limiy maslahat <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Javobning qaysi moddasi to‘g‘ri yoki noto‘g‘ri ekanligi, nimalarni to‘ldirish kerakligi haqida asoslantirilgan sharh yozing..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>

                  {reviewStatus === 'revision_requested' && (
                    <div>
                      <label className="block text-xs font-semibold text-orange-600 mb-1">
                        Talaba uchun aniq tahrirlash topshirig‘i
                      </label>
                      <input
                        type="text"
                        value={revisionNotes}
                        onChange={e => setRevisionNotes(e.target.value)}
                        placeholder="Masalan: Mehnat kodeksi 216-moddasi bilan birga 219-moddani ham qo‘shing"
                        className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/40 text-xs"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAns(null)}
                      className="px-4 py-2 rounded-xl border text-xs"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !feedback.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      {isSubmitting ? 'Saqlanmoqda...' : 'Taqrizni tasdiqlash'}
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
