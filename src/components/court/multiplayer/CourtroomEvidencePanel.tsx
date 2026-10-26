'use client'

import React, { useState } from 'react'
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  FileCheck,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react'
import {
  MultiplayerRoom,
  MultiplayerParticipant,
  MultiplayerEvidenceItem,
} from '@/lib/court/multiplayer-types'

interface CourtroomEvidencePanelProps {
  room: MultiplayerRoom
  myParticipant?: MultiplayerParticipant
  isJudge: boolean
  onSubmitEvidence: (data: {
    title: string
    type: any
    description: string
    content: string
    referenceNumber?: string
    fileUrl?: string
    visibility?: any
  }) => Promise<void>
  onRuleEvidence: (
    evidenceId: string,
    status: 'admitted' | 'rejected',
    reason: string
  ) => Promise<void>
}

export default function CourtroomEvidencePanel({
  room,
  myParticipant,
  isJudge,
  onSubmitEvidence,
  onRuleEvidence,
}: CourtroomEvidencePanelProps) {
  const [filter, setFilter] = useState<'all' | 'admitted' | 'pending' | 'rejected'>('all')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedEvidenceForRuling, setSelectedEvidenceForRuling] =
    useState<MultiplayerEvidenceItem | null>(null)
  const [selectedEvidenceForView, setSelectedEvidenceForView] =
    useState<MultiplayerEvidenceItem | null>(null)

  // Submit form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('document')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [refNum, setRefNum] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Ruling form state
  const [rulingReason, setRulingReason] = useState('')
  const [rulingSubmitting, setRulingSubmitting] = useState(false)

  const canSubmit = myParticipant && myParticipant.role !== 'KUZATUVCHI'

  const filteredEvidence = room.evidence.filter(ev => {
    // Visibility check: defense_only, prosecution_only, court_only, public
    if (ev.visibility === 'defense_only') {
      if (
        myParticipant?.role !== 'ADVOKAT' &&
        myParticipant?.role !== 'AYBLANUVCHI' &&
        myParticipant?.role !== 'SUDYA'
      ) {
        return false
      }
    }
    if (ev.visibility === 'prosecution_only') {
      if (myParticipant?.role !== 'PROKUROR' && myParticipant?.role !== 'SUDYA') {
        return false
      }
    }
    if (filter === 'all') return true
    return ev.status === filter
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setFormError('Dalil nomi va asosiy matni to‘ldirilishi shart.')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)
      await onSubmitEvidence({
        title,
        type,
        description,
        content,
        referenceNumber: refNum || `DALIL-${room.evidence.length + 1}`,
        visibility: 'public',
      })
      setShowSubmitModal(false)
      setTitle('')
      setDescription('')
      setContent('')
      setRefNum('')
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRule = async (status: 'admitted' | 'rejected') => {
    if (!selectedEvidenceForRuling) return
    if (!rulingReason.trim()) {
      alert('Iltimos, dalilni qabul qilish yoki rad etish asosini yozing.')
      return
    }

    try {
      setRulingSubmitting(true)
      await onRuleEvidence(selectedEvidenceForRuling.id, status, rulingReason.trim())
      setSelectedEvidenceForRuling(null)
      setRulingReason('')
    } catch (err: any) {
      alert(err.message || 'Ajrim chiqarishda xatolik yuz berdi')
    } finally {
      setRulingSubmitting(false)
    }
  }

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Ishdagi Dalillar</h3>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            {room.evidence.length}
          </span>
        </div>

        {canSubmit && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dalil taqdim etish</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-zinc-950/40 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs">
        {[
          { key: 'all', label: 'Barchasi' },
          { key: 'admitted', label: 'Qabul qilingan' },
          { key: 'pending', label: 'Kutilmoqda' },
          { key: 'rejected', label: 'Rad etilgan' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Evidence Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {filteredEvidence.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Hozircha ushbu toifada dalil mavjud emas.
          </div>
        ) : (
          filteredEvidence.map(ev => {
            const statusConfig = {
              admitted: {
                label: 'Qabul qilingan',
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                icon: CheckCircle,
              },
              pending: {
                label: 'Sud ko‘rib chiqmoqda',
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                icon: Clock,
              },
              rejected: {
                label: 'Rad etilgan',
                color: 'text-red-400 bg-red-500/10 border-red-500/20',
                icon: XCircle,
              },
            }[ev.status] || {
              label: ev.status,
              color: 'text-zinc-400 bg-zinc-800 border-zinc-700',
              icon: Clock,
            }

            const StatusIcon = statusConfig.icon

            return (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {ev.referenceNumber || 'DALIL'}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-sm">{ev.title}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                      {ev.description || ev.content}
                    </p>
                  </div>

                  <span
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                {/* Audit trail */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                  <span>
                    Taqdim etdi: <strong className="text-zinc-400">{ev.submittedByName}</strong> (
                    {ev.submittedByRole})
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEvidenceForView(ev)}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ko‘rish</span>
                    </button>

                    {isJudge && ev.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedEvidenceForRuling(ev)
                          setRulingReason('')
                        }}
                        className="text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Ajrim chiqarish
                      </button>
                    )}
                  </div>
                </div>

                {ev.judgeDecisionReason && (
                  <div className="text-[11px] text-zinc-300 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                    <strong className="text-amber-400">Sudya xulosasi: </strong>
                    {ev.judgeDecisionReason}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* View Evidence Details Modal */}
      {selectedEvidenceForView && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-blue-400 uppercase">
                  {selectedEvidenceForView.referenceNumber} • {selectedEvidenceForView.type}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedEvidenceForView.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidenceForView(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 font-semibold block mb-1">Mazmuni / Matni:</span>
                <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {selectedEvidenceForView.content}
                </p>
              </div>

              {selectedEvidenceForView.description && (
                <div>
                  <span className="text-zinc-500 font-semibold block mb-0.5">Izoh:</span>
                  <p className="text-zinc-400">{selectedEvidenceForView.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvidenceForView(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Evidence Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Yangi dalil taqdim etish</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Dalil nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Ekspertiza xulosasi № 42"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Turi</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="document">Hujjat (Document)</option>
                    <option value="photo">Foto / Video yozuv</option>
                    <option value="testimony">Ko‘rsatma (Testimony)</option>
                    <option value="expert_opinion">Ekspertiza xulosasi</option>
                    <option value="contract">Shartnoma</option>
                    <option value="receipt">Kvitansiya / Chek</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Raqam / Belgisi</label>
                  <input
                    type="text"
                    placeholder="DALIL-02"
                    value={refNum}
                    onChange={e => setRefNum(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">
                  Dalil mazmuni / Matni *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ushbu dalil nimani isbotlaydi va uning mazmuni nimalardan iborat..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {submitting ? 'Yuborilmoqda...' : 'Sudga taqdim etish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Judge Ruling on Evidence Modal */}
      {selectedEvidenceForRuling && isJudge && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase">Sudya ajrimi</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Dalilni ko‘rib chiqish: &ldquo;{selectedEvidenceForRuling.title}&rdquo;
              </h3>
            </div>

            <div className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Mazmuni:</span>
              <p>{selectedEvidenceForRuling.content}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Qabul qilish yoki rad etish asosi (majburiy) *
              </label>
              <textarea
                rows={3}
                placeholder="Masalan: JPK 88-moddasi talablariga mos kelgani sababli ish materiallariga qo‘shildi..."
                value={rulingReason}
                onChange={e => setRulingReason(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvidenceForRuling(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={rulingSubmitting}
                onClick={() => handleRule('rejected')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
              >
                Rad etish
              </button>
              <button
                type="button"
                disabled={rulingSubmitting}
                onClick={() => handleRule('admitted')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                Qabul qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
