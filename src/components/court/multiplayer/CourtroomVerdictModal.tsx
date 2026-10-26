'use client'

import React, { useState } from 'react'
import { Gavel, Scale, AlertTriangle, X, CheckCircle } from 'lucide-react'
import { MultiplayerRoom } from '@/lib/court/multiplayer-types'

interface CourtroomVerdictModalProps {
  room: MultiplayerRoom
  isOpen: boolean
  onClose: () => void
  onIssueVerdict: (data: {
    verdictDecision: any
    title: string
    summary: string
    legalReasoning: string
    penaltyOrRemedy: string
  }) => Promise<void>
}

export default function CourtroomVerdictModal({
  room,
  isOpen,
  onClose,
  onIssueVerdict,
}: CourtroomVerdictModalProps) {
  const isCriminal = room.caseCategory === 'criminal'

  const [decision, setDecision] = useState(isCriminal ? 'aybdor' : 'qanoatlantirildi')
  const [title, setTitle] = useState(
    isCriminal
      ? 'O‘zbekiston Respublikasi Nomi Bilan Sud HUKMI'
      : 'O‘zbekiston Respublikasi Nomi Bilan HAL QILUV QARORI'
  )
  const [summary, setSummary] = useState('')
  const [legalReasoning, setLegalReasoning] = useState('')
  const [penaltyOrRemedy, setPenaltyOrRemedy] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) {
      setError('Hukm / Hal qiluv qarori xulosaviy qismi to‘ldirilishi shart.')
      return
    }
    if (!confirmed) {
      setError('Iltimos, hukm yakuniy ekanligini tasdiqlovchi katakchani belgilang.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onIssueVerdict({
        verdictDecision: decision,
        title,
        summary: summary.trim(),
        legalReasoning: legalReasoning.trim(),
        penaltyOrRemedy: penaltyOrRemedy.trim(),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Hukm chiqarishda xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Sud Raisi Vakolati
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Hukm / Hal Qiluv Qarori Chiqarish
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Decision Radio Selector */}
          <div>
            <label className="text-zinc-300 font-bold block mb-2">Qaror turi *</label>
            <div className="grid grid-cols-2 gap-2">
              {isCriminal ? (
                <>
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      decision === 'aybdor'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'aybdor'}
                      onChange={() => setDecision('aybdor')}
                    />
                    <span className="font-bold text-white">Aybdor deb topilsin</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      decision === 'aybsiz'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'aybsiz'}
                      onChange={() => setDecision('aybsiz')}
                    />
                    <span className="font-bold text-white">Aybsiz (Oqlov hukmi)</span>
                  </label>
                </>
              ) : (
                <>
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      decision === 'qanoatlantirildi'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'qanoatlantirildi'}
                      onChange={() => setDecision('qanoatlantirildi')}
                    />
                    <span className="font-bold text-white">Da’vo qanoatlantirilsin</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      decision === 'rad_etildi'
                        ? 'bg-red-500/10 border-red-500 text-red-200'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'rad_etildi'}
                      onChange={() => setDecision('rad_etildi')}
                    />
                    <span className="font-bold text-white">Da’vo rad etilsin</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1">Hujjat sarlavhasi</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          {/* Verdict Summary */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1">
              Hukm / Qarorning xulosaviy qismi *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Masalan: Sudlanuvchi Shuxrat Qodirov JK 169-moddasi 2-qismida ko‘rsatilgan jinoyatni sodir etganlikda aybdor deb topilsin..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Legal Reasoning */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1">
              Huquqiy asoslash (Qonun moddalari)
            </label>
            <textarea
              rows={2}
              placeholder="JK 55, 169-moddalari, JPK 454-477 moddalari talablariga asoslanib..."
              value={legalReasoning}
              onChange={e => setLegalReasoning(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Penalty or Remedy */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1">
              Tayinlangan jazo yoki da’vo summasi / choralari
            </label>
            <input
              type="text"
              placeholder="Masalan: BHMning 20 baravari miqdorida jarima yoki 51.8 mln so‘m qarzni undirish"
              value={penaltyOrRemedy}
              onChange={e => setPenaltyOrRemedy(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 text-amber-500 rounded focus:ring-amber-500"
            />
            <span className="leading-tight text-[11px]">
              Men Sudya sifatida ushbu hukm / qaror qonuniy kuchga kirishini va sud majlisini rasman
              yakunlashini tasdiqlayman. Hukm chiqarilgach, barcha ishtirokchilarga reyting va XP
              beriladi.
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={submitting || !confirmed}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-xl shadow-amber-500/30 disabled:opacity-40 transition-all"
          >
            {submitting ? 'Hukm chiqarilmoqda...' : 'Hukmni Rasman E’lon Qilish'}
          </button>
        </div>
      </form>
    </div>
  )
}
