'use client'

import React, { useState } from 'react'
import {
  Gavel,
  Award,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Star,
  Users,
  Clock,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { MultiplayerRoom, ROLE_LABELS, ParticipantScore } from '@/lib/court/multiplayer-types'

interface CourtroomPostTrialResultsProps {
  room: MultiplayerRoom
  onReturnToLobby: () => void
}

export default function CourtroomPostTrialResults({
  room,
  onReturnToLobby,
}: CourtroomPostTrialResultsProps) {
  const verdict = room.verdictData
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const downloadProtocol = () => {
    let doc = `=================================================================\n`
    doc += `      O‘ZBEKISTON RESPUBLIKASI VIRTUAL SUD MAJLISI BAYONNOMASI\n`
    doc += `=================================================================\n\n`
    const startTime = room.startedAt ? new Date(room.startedAt).toLocaleString() : new Date(room.createdAt).toLocaleString()
    const endTime = room.completedAt ? new Date(room.completedAt).toLocaleString() : new Date(room.updatedAt).toLocaleString()
    const durationSec = room.durationSeconds || (room.startedAt && room.completedAt ? Math.max(0, Math.floor((new Date(room.completedAt).getTime() - new Date(room.startedAt).getTime()) / 1000)) : 0)
    const mins = Math.floor(durationSec / 60)
    const secs = durationSec % 60
    const durationText = mins > 0 ? `${mins} daqiqa ${secs} soniya` : `${secs} soniya`

    doc += `Sud zali: ${room.title}\n`
    doc += `Xona kodi: ${room.code}\n`
    doc += `Toifa: ${room.courtType}\n`
    doc += `Boshlangan vaqt: ${startTime}\n`
    doc += `Yakunlangan vaqt: ${endTime}\n`
    doc += `Jarayon davomiyligi: ${durationText}\n`
    doc += `Raislik qiluvchi: ${verdict?.judgedByName || room.hostName}\n\n`

    doc += `-----------------------------------------------------------------\n`
    doc += `1. ISHTIROKCHILAR VA ROLLAR\n`
    doc += `-----------------------------------------------------------------\n`
    room.participants.forEach((p, idx) => {
      doc += `${idx + 1}. [${p.role}] ${p.userName}\n`
    })

    doc += `\n-----------------------------------------------------------------\n`
    doc += `2. SUD MUHOKAMASI JARAYONI (PROTOKOL VA STENOGRAMMA)\n`
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
      doc += `Qaror turi: ${verdict.verdictDecision.toUpperCase()}\n`
      doc += `Xulosa: ${verdict.summary}\n`
      if (verdict.legalReasoning) doc += `Huquqiy asos: ${verdict.legalReasoning}\n`
      if (verdict.penaltyOrRemedy) doc += `Jazo/Chora: ${verdict.penaltyOrRemedy}\n`
      doc += `Sud Raisi: ${verdict.judgedByName} (${new Date(verdict.judgedAt).toLocaleString()})\n\n`

      doc += `-----------------------------------------------------------------\n`
      doc += `4. ISHTIROKCHILAR TAQRIZI, XATOLAR TAHLILI VA TAVSIYALAR\n`
      doc += `-----------------------------------------------------------------\n`
      Object.values(verdict.scores || {}).forEach(sc => {
        doc += `\n=================================================================\n`
        doc += `ISHTIROKCHI: ${sc.userName} (${sc.role})\n`
        doc += `Umumiy Baho: ${sc.totalScore}/100 [Daraja: ${sc.proceduralGrade || 'A'}] | XP: +${sc.xpEarned}\n`
        doc += `Mezonlar: Qonuniylik=${sc.legalReasoning}%, Tartib=${sc.proceduralCorrectness}%, Dalillar=${sc.evidenceUsage}%, Argument=${sc.argumentQuality}%\n`
        doc += `Umumiy Xulosa: ${sc.feedback}\n\n`

        if (sc.mistakes && sc.mistakes.length > 0) {
          doc += `[!] QAYERDA XATO QILDI (Kamchiliklar):\n`
          sc.mistakes.forEach((m, idx) => {
            doc += `   ${idx + 1}. ${m}\n`
          })
          doc += `\n`
        }

        if (sc.recommendations && sc.recommendations.length > 0) {
          doc += `[✓] NIMA QILISHI KERAK EDI (To‘g‘ri harakatlar va tavsiyalar):\n`
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
    }

    doc += `\n=================================================================\n`
    doc += `JURISTIV — O‘zbekiston Qonunchiligi Bo‘yicha Virtual Sud Platformasi\n`
    doc += `=================================================================\n`

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Sud_Bayonnomasi_${room.code}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-950 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-blue-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl text-amber-400">
                ⚖️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Sud Majlisi Yakunlandi
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    Hukm chiqarildi
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1">{room.title}</h1>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Xona kodi: {room.code} • {room.courtType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={downloadProtocol}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Bayonnomani yuklab olish</span>
              </button>

              <button
                onClick={onReturnToLobby}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Lobbiyga qaytish</span>
              </button>
            </div>
          </div>
        </div>

        {/* Authoritative Verdict Presentation */}
        {verdict ? (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative">
            <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                  O‘zbekiston Respublikasi Nomi Bilan
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">{verdict.title}</h2>
              </div>

              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase">
                {verdict.verdictDecision}
              </div>
            </div>

            {/* Verdict Summary Box */}
            <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/80 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Sud Raisining Rasmiy Hukmi / Ajrimi:
              </h3>
              <p className="text-sm text-zinc-100 leading-relaxed font-serif whitespace-pre-wrap">
                {verdict.summary}
              </p>

              {verdict.penaltyOrRemedy && (
                <div className="pt-3 border-t border-zinc-900 flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400">Jazo / Qaror chorasi:</span>
                  <span className="text-xs font-semibold text-white">
                    {verdict.penaltyOrRemedy}
                  </span>
                </div>
              )}
            </div>

            {verdict.legalReasoning && (
              <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
                <strong className="text-zinc-300 block mb-1">Huquqiy asos: </strong>
                {verdict.legalReasoning}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 font-mono">
              <span>Sud Raisi: {verdict.judgedByName}</span>
              <span>Sana: {new Date(verdict.judgedAt).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Hukm holati</span>
            </div>
            <h3 className="text-base font-bold text-white">Sud majlisi yakunlangan, lekin rasmiy hukm kiritilmagan</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sud majlisi yakunlangan deb e’lon qilingan, biroq sudya tomonidan rasmiy yakuniy hukm yoki hal qiluv qarori bayonnomaga qayd etilmagan.
            </p>
          </div>
        )}

        {/* Participants Performance, Critique & Educational Feedback */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Ishtirokchilarning To‘liq Taqrizi va Xatolar Tahlili
              </h3>
            </div>
            <span className="text-xs text-zinc-400">
              O‘zbekiston protsessual qonunchiligi (JPK, FPK, BSK) asosida baholandi
            </span>
          </div>

          <div className="space-y-4">
            {Object.values(verdict?.scores || {}).map(sc => {
              const roleDef = ROLE_LABELS[sc.role]
              const isExpanded =
                expandedUser === sc.userId || Object.keys(verdict?.scores || {}).length <= 2

              return (
                <div
                  key={sc.userId}
                  className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 space-y-4 transition-all shadow-md"
                >
                  {/* Participant Header Info */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold border border-zinc-700">
                        {roleDef?.icon || '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{sc.userName}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              roleDef?.color || 'text-zinc-400'
                            }`}
                          >
                            {sc.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          Protsessual daraja:{' '}
                          <strong className="text-amber-400 font-mono">
                            {sc.proceduralGrade || 'A'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-blue-400 font-mono">
                          {sc.totalScore}
                          <span className="text-xs text-zinc-500">/100</span>
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 justify-end">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+{sc.xpEarned} XP</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : sc.userId)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Feedback Quote */}
                  <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-200 leading-relaxed italic">
                    &ldquo;{sc.feedback}&rdquo;
                  </div>

                  {/* Criteria Progress Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] text-zinc-400 border-t border-zinc-900">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Qonuniylik:</span>
                        <span className="text-white font-mono">{sc.legalReasoning}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${sc.legalReasoning}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Tartibga rioya:</span>
                        <span className="text-white font-mono">{sc.proceduralCorrectness}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${sc.proceduralCorrectness}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Dalillar:</span>
                        <span className="text-white font-mono">{sc.evidenceUsage}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${sc.evidenceUsage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Nutq va argument:</span>
                        <span className="text-white font-mono">{sc.argumentQuality}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${sc.argumentQuality}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Mistakes & Educational Action Recommendations */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-zinc-800/80 animate-fade-in">
                      {/* 1. QAYERDA XATO QILDI */}
                      {sc.mistakes && sc.mistakes.length > 0 && (
                        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span>QAYERDA XATO QILDI (Kamchiliklar va noaniqliklar):</span>
                          </div>
                          <ul className="space-y-1.5 pl-6 list-disc text-xs text-red-200/90 leading-relaxed">
                            {sc.mistakes.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 2. NIMA QILISHI KERAK EDI */}
                      {sc.recommendations && sc.recommendations.length > 0 && (
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>
                              NIMA QILISHI KERAK EDI (To‘g‘ri huquqiy harakatlar va tavsiyalar):
                            </span>
                          </div>
                          <ul className="space-y-1.5 pl-6 list-disc text-xs text-emerald-200/90 leading-relaxed">
                            {sc.recommendations.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 3. TEGISHLI QONUN MODDALARI */}
                      {sc.correctArticles && sc.correctArticles.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-[11px] font-bold text-zinc-400">
                            Qo‘llanilishi lozim bo‘lgan moddalar:
                          </span>
                          {sc.correctArticles.map((art, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px] font-semibold"
                            >
                              § {art}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
