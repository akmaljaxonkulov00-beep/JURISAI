'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  AlertTriangle,
  Mic,
  MicOff,
  ChevronRight,
  Gavel,
  Shield,
  Clock,
  Sparkles,
  X,
  FileCheck,
  Radio,
} from 'lucide-react'
import { MultiplayerRoom, MultiplayerParticipant, ROLE_LABELS } from '@/lib/court/multiplayer-types'
import { TRIAL_STAGES } from '@/lib/court/stage-machine'

interface CourtroomBottomControlsProps {
  room: MultiplayerRoom
  myParticipant?: MultiplayerParticipant
  isJudge: boolean
  canSpeak: boolean
  isListeningSTT?: boolean
  liveTranscript?: string
  onToggleSTT?: () => void
  onSpeak: (content: string) => Promise<void>
  onRaiseObjection: (reason: string, targetRole?: string) => Promise<void>
  onRequestSpeaking: (action: 'request' | 'cancel') => Promise<void>
  onAdvanceStage: () => Promise<void>
  onOpenVerdictModal: () => void
}

const COMMON_OBJECTIONS = [
  { label: 'Asossiz vaj', desc: 'Isbotlanmagan yoki taxminlarga asoslangan vaj' },
  {
    label: 'Protsessual tartib buzilishi',
    desc: 'Sud tartibi va qonun talablariga zid harakat (JPK 405-410)',
  },
  {
    label: 'Mavzuga aloqador emas',
    desc: 'Ko‘rilayotgan ish mohiyatiga aloqasi bo‘lmagan so‘zlar',
  },
  { label: 'Guvohni chalg‘itish', desc: 'Guvohga yo‘naltiruvchi yoki bosim o‘tkazuvchi savol' },
  { label: 'Noqonuniy olingan dalil', desc: 'JPK talablari buzilgan holda olingan nojoiz dalil' },
]

const QUICK_PHRASES: Record<string, string[]> = {
  SUDYA: [
    'Sud majlisi davom etadi.',
    'Taraflar o‘zaro hurmatni saqlasin.',
    'Sud navbatdagi masalani muhokama qilishga o‘tadi.',
    'Iltimosnoma qabul qilindi.',
    'Guvoh qasamyod qilishga taklif etiladi.',
  ],
  PROKUROR: [
    'Hurmatli sud, davlat ayblovi to‘liq o‘z isbotini topdi.',
    'Sudlanuvchiga qonuniy va adolatli jazo tayinlashingizni so‘rayman.',
    'Ishdagi ashyoviy dalillar jinoyat sodir etilganini to‘liq tasdiqlaydi.',
    'Himoya tarafining vajlari asossiz deb hisoblansin.',
  ],
  ADVOKAT: [
    'Hurmatli sud, himoyam ostidagi shaxsning harakatlarida jinoyat tarkibi yo‘q.',
    'Moddiy zarar to‘liq qoplanganini va pushaymonlikni inobatga olishingizni so‘rayman.',
    'JK 55-moddasini qo‘llab, ozodlikdan mahrum etish bilan bog‘liq bo‘lmagan jazo so‘raymiz.',
    'Yangi dalilni ish materiallariga qo‘shish bo‘yicha iltimosnoma kiritaman.',
  ],
  AYBLANUVCHI: [
    'Hurmatli sudya, qilmishimdan chin dildan pushaymonman.',
    'Zararni qoplash uchun barcha choralarni ko‘rdim.',
    'Oilaviy og‘ir ahvolim va qaramog‘imda farzandlarim borligini inobatga olishingizni so‘rayman.',
  ],
  GUVOH: [
    'Faqat o‘z ko‘zim bilan ko‘rgan haqiqatni aytishga qasamyod qilaman.',
    'Voqea joyida bo‘lganimda barchasi aynan shunday ro‘y bergan edi.',
  ],
  KOTIB: [
    'Sud majlisi bayonnomasi yuritilmoqda.',
    'Barcha chaqirilgan ishtirokchilar zalda hozir.',
  ],
}

export default function CourtroomBottomControls({
  room,
  myParticipant,
  isJudge,
  canSpeak,
  isListeningSTT = false,
  liveTranscript = '',
  onToggleSTT,
  onSpeak,
  onRaiseObjection,
  onRequestSpeaking,
  onAdvanceStage,
  onOpenVerdictModal,
}: CourtroomBottomControlsProps) {
  const [speechText, setSpeechText] = useState('')
  const [sending, setSending] = useState(false)
  const [showObjectionModal, setShowObjectionModal] = useState(false)
  const [selectedObjection, setSelectedObjection] = useState(COMMON_OBJECTIONS[0].label)
  const [customObjectionReason, setCustomObjectionReason] = useState('')
  const [confirmStageModal, setConfirmStageModal] = useState(false)

  // Sync incoming real-time Speech-to-Text transcript into the input
  useEffect(() => {
    if (isListeningSTT && liveTranscript) {
      setSpeechText(liveTranscript)
    }
  }, [isListeningSTT, liveTranscript])

  const isUserInQueue = room.speakingQueue.some(q => q.userId === myParticipant?.userId)
  const currentStage = TRIAL_STAGES.find(s => s.id === room.currentStageId) || TRIAL_STAGES[0]
  const isFinalStage = currentStage.order >= 6

  const rolePhrases = myParticipant ? QUICK_PHRASES[myParticipant.role] || [] : []

  const handleSendSpeech = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!speechText.trim() || sending) return

    try {
      setSending(true)
      await onSpeak(speechText.trim())
      setSpeechText('')
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi')
    } finally {
      setSending(false)
    }
  }

  const handleSendObjection = async () => {
    const finalReason = customObjectionReason.trim()
      ? `${selectedObjection}: ${customObjectionReason.trim()}`
      : selectedObjection

    try {
      await onRaiseObjection(finalReason)
      setShowObjectionModal(false)
      setCustomObjectionReason('')
    } catch (err: any) {
      alert(err.message || 'E’tiroz yuborishda xatolik')
    }
  }

  const isWaiting = room.status === 'waiting'
  const isCompleted = room.status === 'completed'
  const isTrialActive = room.status === 'in_progress'

  if (isCompleted) {
    return null
  }

  return (
    <footer className="bg-zinc-900/90 border-t border-zinc-800/90 backdrop-blur-md p-3 sm:p-4 space-y-3 relative z-10">
      {/* Top action row: Objections, Queue, Judge Controls OR Waiting Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {isWaiting ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>⏳ Kutish Zali — Jonli Muloqot & Ovoz/Kamera Sinovi</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Objection button (for all active participants except observers) */}
            {myParticipant && myParticipant.role !== 'KUZATUVCHI' && (
              <button
                onClick={() => setShowObjectionModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>E’tiroz bildirish!</span>
              </button>
            )}

            {/* Request to speak toggle for non-judge */}
            {!isJudge && myParticipant && myParticipant.role !== 'KUZATUVCHI' && (
              <button
                onClick={() => onRequestSpeaking(isUserInQueue ? 'cancel' : 'request')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  isUserInQueue
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    : 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isUserInQueue ? 'Navbatdan chiqish' : 'So‘z so‘rash'}</span>
              </button>
            )}
          </div>
        )}

        {/* Judge Controls: Advance Stage & Issue Verdict */}
        {isJudge && isTrialActive && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmStageModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition-all"
            >
              <span>Keyingi bosqich</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {isFinalStage && (
              <button
                onClick={onOpenVerdictModal}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-500/30 transition-all animate-pulse"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Hukm chiqarish</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Speech Input Box (Allowed when in waiting room, or granted speaking turn in trial) */}
      {isWaiting || canSpeak ? (
        <form onSubmit={handleSendSpeech} className="space-y-2">
          {/* Quick Phrase Suggestions */}
          {rolePhrases.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
              <span className="text-zinc-500 text-[10px] uppercase font-bold flex-shrink-0">
                Takliflar:
              </span>
              {rolePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSpeechText(prev => (prev ? `${prev} ${phrase}` : phrase))}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 whitespace-nowrap transition-colors flex-shrink-0"
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Live Speech-to-Text (STT) Voice Dictation Button */}
            {onToggleSTT && (
              <button
                type="button"
                onClick={onToggleSTT}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center flex-shrink-0 ${
                  isListeningSTT
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                }`}
                title={
                  isListeningSTT
                    ? 'Ovoz yozishni to‘xtatish'
                    : 'Ovoz bilan gapirish (Speech-to-Text)'
                }
              >
                {isListeningSTT ? (
                  <Radio className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Mic className="w-5 h-5 text-blue-400" />
                )}
              </button>
            )}

            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  isListeningSTT
                    ? '🎤 Tinglanmoqda... Marhamat, gapiring (nutqingiz matnga aylanadi)...'
                    : isWaiting
                      ? 'Kutish zali: O‘zaro salomlashish, mikrofoni tekshirish yoki xabar yozish...'
                      : isJudge
                        ? 'Sud raisi sifatida ko‘rsatma bering yoki nutq so‘zlang...'
                        : 'Hurmatli sud, ushbu masala yuzasidan o‘z fikrimni bildirmoqchiman...'
                }
                value={speechText}
                onChange={e => setSpeechText(e.target.value)}
                className={`w-full bg-zinc-800/90 border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                  isListeningSTT
                    ? 'border-red-500/80 focus:ring-red-500 text-red-200'
                    : 'border-zinc-700 focus:ring-blue-500'
                }`}
              />
              {isListeningSTT && (
                <span className="absolute right-3 top-2.5 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">
                  STT Faol
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!speechText.trim() || sending}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center gap-1.5 disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isWaiting ? 'Xabar yuborish' : 'Nutq so‘zlash'}
              </span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
          🔒 Hozirda sizning nutq navbatingiz emas. So‘z olish uchun{' '}
          <strong className="text-blue-400">&ldquo;So‘z so‘rash&rdquo;</strong> tugmasini bosing.
        </div>
      )}

      {/* Objection Modal */}
      {showObjectionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Protsessual E’tiroz Bildirish</span>
              </h3>
              <button
                onClick={() => setShowObjectionModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              E’tiroz bildirilganda sud majlisi vaqtincha to‘xtatiladi va Sudya ajrim chiqaradi.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 block">E’tiroz asosi:</span>
              <div className="space-y-1.5">
                {COMMON_OBJECTIONS.map((obj, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedObjection(obj.label)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors ${
                      selectedObjection === obj.label
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-semibold">{obj.label}</div>
                    <div className="text-[11px] text-zinc-400">{obj.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-300 block mb-1">
                Qo‘shimcha izoh (ixtiyoriy):
              </span>
              <textarea
                value={customObjectionReason}
                onChange={e => setCustomObjectionReason(e.target.value)}
                rows={2}
                placeholder="Masalan: Guvohga qonunga zid tarzda yo‘naltiruvchi savol berildi..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowObjectionModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSendObjection}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20"
              >
                E’tirozni e’lon qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Advance Stage Modal */}
      {confirmStageModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 text-blue-400">
              <Gavel className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Navbatdagi bosqichga o‘tilsinmi?</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Joriy bosqich: <strong className="text-white">{currentStage.title}</strong>
              <br />
              Taraflarning barcha vajlari tinglanganiga ishonch hosil qiling.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmStageModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Yo‘q, davom etsin
              </button>
              <button
                onClick={async () => {
                  setConfirmStageModal(false)
                  await onAdvanceStage()
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                Ha, o‘tilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
