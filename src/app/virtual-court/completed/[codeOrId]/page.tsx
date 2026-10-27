'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Gavel,
  Scale,
  Award,
  Download,
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  MultiplayerRoom,
  MultiplayerParticipant,
  ParticipantScore,
  MultiplayerMessage,
  MultiplayerEvidenceItem,
  ROLE_LABELS,
} from '@/lib/court/multiplayer-types'

interface CompletedDetailResponse {
  room: MultiplayerRoom
  myParticipant: MultiplayerParticipant
  myScore: ParticipantScore | null
  userActions: MultiplayerMessage[]
  userEvidence: MultiplayerEvidenceItem[]
  otherEvidence: MultiplayerEvidenceItem[]
  isJudge: boolean
  durationFormatted: string
}

export default function CompletedTrialDossierPage({
  params,
}: {
  params: Promise<{ codeOrId: string }>
}) {
  const router = useRouter()
  const { codeOrId } = use(params)
  const { user } = useAuth()

  const [data, setData] = useState<CompletedDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'verdict' | 'scores' | 'evidence' | 'transcript'>('verdict')
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const authHeaders = await getAuthHeaders()

      const guestId = typeof window !== 'undefined' ? sessionStorage.getItem('juristiv_mp_guest_id') : null
      const guestName = typeof window !== 'undefined' ? sessionStorage.getItem('juristiv_mp_guest_name') : null

      const res = await fetch(`/api/court/multiplayer/history/${codeOrId}`, {
        headers: {
          ...authHeaders,
          ...(guestId ? { 'x-guest-id': guestId } : {}),
          ...(guestName ? { 'x-guest-name': encodeURIComponent(guestName) } : {}),
        },
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Dosyeni yuklab bo‘lmadi')
      }

      setData(json.data)
    } catch (err: any) {
      console.error('fetchDetail error:', err)
      setError(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [codeOrId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Download official protocol as UTF-8 text document
  const downloadProtocol = () => {
    if (!data) return
    const { room, durationFormatted } = data
    const verdict = room.verdictData

    let doc = `=================================================================\n`
    doc += `      O‘ZBEKISTON RESPUBLIKASI VIRTUAL SUD MAJLISI BAYONNOMASI\n`
    doc += `=================================================================\n\n`
    const startTime = room.startedAt ? new Date(room.startedAt).toLocaleString() : new Date(room.createdAt).toLocaleString()
    const endTime = room.completedAt ? new Date(room.completedAt).toLocaleString() : new Date(room.updatedAt).toLocaleString()

    doc += `Sud zali: ${room.title}\n`
    doc += `Xona kodi: ${room.code}\n`
    doc += `Toifa: ${room.courtType}\n`
    doc += `Boshlangan vaqt: ${startTime}\n`
    doc += `Yakunlangan vaqt: ${endTime}\n`
    doc += `Jarayon davomiyligi: ${durationFormatted}\n`
    doc += `Raislik qiluvchi: ${verdict?.judgedByName || room.hostName}\n\n`

    doc += `-----------------------------------------------------------------\n`
    doc += `1. ISHTIROKCHILAR VA ROLLAR\n`
    doc += `-----------------------------------------------------------------\n`
    room.participants.forEach((p, idx) => {
      doc += `${idx + 1}. [${p.role}] ${p.userName}\n`
    })

    doc += `\n-----------------------------------------------------------------\n`
    doc += `2. SUD MUHOKAMASI JARAYONI (STENOGRAMMA)\n`
    doc += `-----------------------------------------------------------------\n`
    room.messages.forEach(m => {
      const time = new Date(m.createdAt).toLocaleTimeString()
      doc += `[${time}] ${m.role} (${m.userName}): ${m.content}\n`
    })

    doc += `\n-----------------------------------------------------------------\n`
    doc += `3. RASMIY SUD HUKMI / HAL QILUV QARORI\n`
    doc += `-----------------------------------------------------------------\n`
    if (verdict) {
      doc += `Hujjat: ${verdict.title}\n`
      doc += `Qaror xulosasi: ${verdict.verdictDecision?.toUpperCase() || ''}\n`
      doc += `Qisqacha mazmuni: ${verdict.summary}\n`
      if (verdict.legalReasoning) doc += `Huquqiy asos: ${verdict.legalReasoning}\n`
      if (verdict.penaltyOrRemedy) doc += `Jazo/Chora: ${verdict.penaltyOrRemedy}\n`
      doc += `Sud Raisi: ${verdict.judgedByName} (${new Date(verdict.judgedAt).toLocaleString()})\n\n`

      doc += `-----------------------------------------------------------------\n`
      doc += `4. ISHTIROKCHILARNING PROTSESSUAL TAHLILI VA TAVSIYALAR\n`
      doc += `-----------------------------------------------------------------\n`
      Object.values(verdict.scores || {}).forEach(sc => {
        doc += `\n=================================================================\n`
        doc += `ISHTIROKCHI: ${sc.userName} (${sc.role})\n`
        doc += `Umumiy Baho: ${sc.totalScore}/100 [Daraja: ${sc.proceduralGrade || 'A'}] | XP: +${sc.xpEarned}\n`
        doc += `Mezonlar: Qonuniylik=${sc.legalReasoning}%, Tartib=${sc.proceduralCorrectness}%, Dalillar=${sc.evidenceUsage}%, Argument=${sc.argumentQuality}%\n`
        doc += `Xulosa: ${sc.feedback}\n\n`

        if (sc.mistakes && sc.mistakes.length > 0) {
          doc += `[!] QAYERDA XATO QILDI (Kamchiliklar):\n`
          sc.mistakes.forEach((m, idx) => {
            doc += `   ${idx + 1}. ${m}\n`
          })
          doc += `\n`
        }

        if (sc.recommendations && sc.recommendations.length > 0) {
          doc += `[✓] NIMA QILISHI KERAK EDI (Tavsiyalar):\n`
          sc.recommendations.forEach((r, idx) => {
            doc += `   ${idx + 1}. ${r}\n`
          })
          doc += `\n`
        }

        if (sc.correctArticles && sc.correctArticles.length > 0) {
          doc += `[§] QO‘LLANILISHI LOZIM BO‘LGAN QONUN MODDALARI:\n`
          doc += `   ${sc.correctArticles.join(', ')}\n`
        }
      })
    } else {
      doc += `Ushbu sud majlisi yakunlangan, biroq rasmiy hukm kiritilmagan.\n`
    }

    doc += `\n=================================================================\n`
    doc += `JURISTIV — O‘zbekiston Qonunchiligi Bo‘yicha Virtual Sud Platformasi\n`
    doc += `=================================================================\n`

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SUD-BAYONNOMA-${room.code}-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-zinc-400">Sud dosyesi yuklanmoqda...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Xatolik yuz berdi</h2>
          <p className="text-xs sm:text-sm text-zinc-400">{error || 'Sud dosyesi topilmadi yoki sizda unga kirish huquqi yo‘q.'}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/virtual-court/completed"
              className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
            >
              Yakunlangan ishlar ro‘yxatiga qaytish
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { room, myParticipant, myScore, userActions, userEvidence, otherEvidence, durationFormatted } = data
  const verdict = room.verdictData

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/virtual-court/completed"
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Yakunlangan ishlarga qaytish</span>
        </Link>

        <button
          onClick={downloadProtocol}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Bayonnomani yuklab olish</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Case Dossier Hero Card */}
        <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Rasmiy Sud Dosyesi
              </span>
              <span className="font-mono text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                #{room.code}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>Davomiyligi: <strong className="text-zinc-200">{durationFormatted}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-500" />
                <span>Ishtirokchilar: <strong className="text-zinc-200">{room.participants.length} nafar</strong></span>
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{room.title}</h1>
            <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-zinc-500" />
              <span>{room.courtType}</span>
            </p>
          </div>

          {/* User's Participation Header Pill */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Sizning ishtirokingiz:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-zinc-800 text-white border border-zinc-700">
                <span>{ROLE_LABELS[myParticipant.role]?.icon || '⚖️'}</span>
                <span>{ROLE_LABELS[myParticipant.role]?.title || myParticipant.role}</span>
              </span>
            </div>

            {myScore && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daraja: {myScore.proceduralGrade} ({myScore.totalScore}/100)</span>
                </span>
                <span className="text-xs font-extrabold text-emerald-400">
                  +{myScore.xpEarned} XP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('verdict')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'verdict'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            ⚖️ Sud Hukmi va Baholar
          </button>

          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'scores'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            📊 Barcha Ishtirokchilar ({room.participants.length})
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            📁 Dalillar Dosyesi ({room.evidence.length})
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'transcript'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            📜 Stenogramma ({room.messages.length})
          </button>
        </div>

        {/* Tab 1: Verdict and User's Score */}
        {activeTab === 'verdict' && (
          <div className="space-y-6">
            {/* Official Verdict Card */}
            {verdict ? (
              <div className="rounded-3xl bg-zinc-900/90 border border-blue-500/30 p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Rasmiy Sud Qarori
                    </span>
                    <h2 className="text-lg font-bold text-white">{verdict.title}</h2>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <span className="text-xs font-semibold text-zinc-500">Hukm xulosasi:</span>
                  <p className="text-sm font-semibold text-emerald-300 leading-relaxed">
                    {verdict.summary}
                  </p>
                </div>

                {verdict.legalReasoning && (
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                    <span className="text-xs font-semibold text-zinc-500">Huquqiy asoslantirish:</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">{verdict.legalReasoning}</p>
                  </div>
                )}

                {verdict.penaltyOrRemedy && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                    <span className="text-xs font-semibold text-amber-400">Tayinlangan jazo / Majburiyat:</span>
                    <p className="text-xs text-amber-200 leading-relaxed">{verdict.penaltyOrRemedy}</p>
                  </div>
                )}

                <div className="text-xs text-zinc-500 flex items-center justify-between pt-2">
                  <span>Sud Raisi: <strong className="text-zinc-300">{verdict.judgedByName}</strong></span>
                  <span>{new Date(verdict.judgedAt).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Sud majlisi yakunlangan</h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                  Ushbu sud majlisi yakunlangan, biroq sudya tomonidan rasmiy hukm yoki hal qiluv qarori
                  kiritilmagan.
                </p>
              </div>
            )}

            {/* User's Detailed Performance Breakdown */}
            {myScore && (
              <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>Sizning Protsessual Baholashingiz</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Multiplayer sud jarayonida ko‘rsatgan nutqingiz, qonun moddalarini qo‘llashingiz va faolligingiz asosida.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-black text-amber-400">{myScore.totalScore}</span>
                    <span className="text-xs text-zinc-500"> / 100</span>
                    <div className="text-xs font-bold text-zinc-300">Daraja: {myScore.proceduralGrade}</div>
                  </div>
                </div>

                {/* 4 Performance Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">Yuridik Asoslantirish</span>
                      <span className="text-blue-400">{myScore.legalReasoning}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${myScore.legalReasoning}%` }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">Protsessual Tartib</span>
                      <span className="text-emerald-400">{myScore.proceduralCorrectness}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${myScore.proceduralCorrectness}%` }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">Dalillar Bilan Ishlash</span>
                      <span className="text-indigo-400">{myScore.evidenceUsage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${myScore.evidenceUsage}%` }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">Nutq va Argumentatsiya</span>
                      <span className="text-purple-400">{myScore.argumentQuality}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${myScore.argumentQuality}%` }} />
                    </div>
                  </div>
                </div>

                {/* Educational Analysis: Xatolar & Tavsiyalar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Mistakes */}
                  <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Qayerda xato qilindi (Kamchiliklar)</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {myScore.mistakes && myScore.mistakes.length > 0 ? (
                        myScore.mistakes.map((m, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{m}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-zinc-500">Jiddiy xatolar aniqlanmadi.</li>
                      )}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nima qilish kerak edi (Tavsiyalar)</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {myScore.recommendations && myScore.recommendations.length > 0 ? (
                        myScore.recommendations.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{r}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-zinc-500">Mavjud tartib bo‘yicha to‘g‘ri harakat qilindi.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Legal Articles */}
                {myScore.correctArticles && myScore.correctArticles.length > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>Qo‘llanilishi lozim bo‘lgan qonun moddalari:</span>
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {myScore.correctArticles.map((art, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30"
                        >
                          § {art}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Participants */}
        {activeTab === 'scores' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Sud majlisi ishtirokchilari</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {room.participants.map(p => {
                const pScore = verdict?.scores?.[p.userId]
                const isExpanded = expandedParticipant === p.userId

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
                          {p.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{p.userName}</h4>
                          <span className="text-xs text-zinc-400">
                            {ROLE_LABELS[p.role]?.title || p.role}
                          </span>
                        </div>
                      </div>

                      {pScore && (
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-amber-400">
                            {pScore.totalScore}/100
                          </span>
                          <span className="text-xs text-zinc-500 block">Daraja {pScore.proceduralGrade}</span>
                        </div>
                      )}
                    </div>

                    {pScore && (
                      <div className="pt-2 border-t border-zinc-800/80">
                        <button
                          onClick={() => setExpandedParticipant(isExpanded ? null : p.userId)}
                          className="w-full flex items-center justify-between text-xs text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          <span>{isExpanded ? 'Tahlilni yashirish' : 'Tahlil va tavsiyalarni ko‘rish'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/60">
                            <p className="text-zinc-400">{pScore.feedback}</p>
                            {pScore.mistakes && pScore.mistakes.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                                <strong>Kamchilik:</strong> {pScore.mistakes[0]}
                              </div>
                            )}
                            {pScore.recommendations && pScore.recommendations.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                <strong>Tavsiya:</strong> {pScore.recommendations[0]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Evidence */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white">Ishga qo‘shilgan ashyoviy va yozma dalillar</h3>

            {room.evidence.length === 0 ? (
              <div className="py-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center space-y-2">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">Sud jarayonida hech qanday dalil taqdim etilmagan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User's Evidence */}
                {userEvidence.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Siz tomoningizdan taqdim etilgan dalillar ({userEvidence.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userEvidence.map(ev => (
                        <div key={ev.id} className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{ev.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">
                              {ev.status === 'admitted' ? 'Qabul qilingan' : 'Ko‘rib chiqilmoqda'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Participants' Evidence */}
                {otherEvidence.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Boshqa ishtirokchilar tomonidan taqdim etilgan dalillar ({otherEvidence.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {otherEvidence.map(ev => (
                        <div key={ev.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{ev.title}</span>
                            <span className="text-zinc-500">{ev.submittedByName} ({ev.submittedByRole})</span>
                          </div>
                          <p className="text-xs text-zinc-400">{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Transcript & Timeline */}
        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Sud majlisi to‘liq stenogrammasi</h3>
            <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {room.messages.map(m => {
                const isMine = m.userId === myParticipant.userId
                const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl text-xs transition-all ${
                      isMine
                        ? 'bg-blue-600/15 border border-blue-500/30 ml-4'
                        : m.messageType === 'system'
                        ? 'bg-zinc-950/60 border border-zinc-800/60 text-zinc-400 text-center font-mono text-[11px]'
                        : 'bg-zinc-950/40 border border-zinc-800/80 mr-4'
                    }`}
                  >
                    {m.messageType !== 'system' && (
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-zinc-200">
                          {m.userName} <span className="text-zinc-500 font-normal">[{m.role}]</span>
                        </span>
                        <span className="text-[10px] text-zinc-500">{time}</span>
                      </div>
                    )}
                    <p className={m.messageType === 'system' ? 'italic' : 'text-zinc-300 leading-relaxed'}>
                      {m.content}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
