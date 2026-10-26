'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Gavel,
  Shield,
  FileText,
  AlertTriangle,
  Play,
  Volume2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
  BookOpen,
  Video,
  Mic,
  MicOff,
  LayoutGrid,
  Columns,
} from 'lucide-react'
import {
  MultiplayerRoom,
  MultiplayerParticipant,
  ROLE_LABELS,
  MultiplayerRole,
} from '@/lib/court/multiplayer-types'
import { TRIAL_STAGES } from '@/lib/court/stage-machine'

interface CourtroomCenterStageProps {
  room: MultiplayerRoom
  myParticipant?: MultiplayerParticipant
  isHost: boolean
  isJudge: boolean
  localStream?: MediaStream | null
  remoteStreams?: Record<string, MediaStream>
  videoEnabledUserIds?: Set<string>
  speakingParticipants?: Set<string>
  liveSubtitles?: Record<string, { text: string; role?: string; updatedAt: number }>
  onStartTrial: () => void
  onRuleObjection: (ruling: 'sustained' | 'overruled', reasoning: string) => void
  onAdvanceStage: () => void
}

/**
 * Individual Participant Media Tile
 * Renders live WebRTC video feed if available, or animated stylized courtroom podium.
 */
function ParticipantMediaTile({
  participant,
  isCurrentSpeaker,
  isAudioSpeaking,
  isVideoActive,
  mediaStream,
  isLocal,
  customHeight = 'h-36 sm:h-44',
}: {
  participant?: MultiplayerParticipant
  isCurrentSpeaker: boolean
  isAudioSpeaking: boolean
  isVideoActive: boolean
  mediaStream?: MediaStream | null
  isLocal: boolean
  customHeight?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const roleDef = participant ? ROLE_LABELS[participant.role] : undefined

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  if (!participant) {
    return (
      <div
        className={`w-full ${customHeight} rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center p-3 text-zinc-500 text-xs`}
      >
        <span className="text-xl mb-1 opacity-50">👤</span>
        <span className="font-medium">Vakant (bo‘sh)</span>
      </div>
    )
  }

  const isSpeaking = isCurrentSpeaker || isAudioSpeaking

  return (
    <div
      className={`relative w-full ${customHeight} rounded-2xl border overflow-hidden flex flex-col justify-between p-3 transition-all ${
        isSpeaking
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/50 scale-[1.01]'
          : 'border-zinc-800 bg-zinc-900/90'
      }`}
    >
      {/* Live Video Layer */}
      {isVideoActive && mediaStream ? (
        <div className="absolute inset-0 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        </div>
      ) : (
        /* Stylized Podium Graphic */
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-850 to-zinc-950 flex flex-col items-center justify-center pointer-events-none">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md transition-all ${
              isSpeaking
                ? 'bg-blue-600/30 border-2 border-blue-400 text-blue-200 scale-110 animate-pulse'
                : 'bg-zinc-800/80 border border-zinc-700 text-zinc-300'
            }`}
          >
            {roleDef?.icon || '👤'}
          </div>

          {/* Sound wave bars when speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className="w-1 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1 h-5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 h-4 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
              <span
                className="w-1 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '75ms' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Top Overlay: Role Badge & Video Status */}
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md ${
            roleDef?.color || 'bg-zinc-800 text-zinc-300 border-zinc-700'
          }`}
        >
          {roleDef?.title || participant.role}
        </span>

        <div className="flex items-center gap-1">
          {isVideoActive && (
            <span
              className="p-1 rounded-md bg-blue-600/80 text-white text-[10px]"
              title="Kamera faol"
            >
              <Video className="w-3 h-3" />
            </span>
          )}
          {isSpeaking ? (
            <span
              className="p-1 rounded-md bg-emerald-600 text-white text-[10px] animate-pulse"
              title="Gapirmoqda"
            >
              <Mic className="w-3 h-3" />
            </span>
          ) : (
            <span className="p-1 rounded-md bg-zinc-800/80 text-zinc-400 text-[10px]">
              <MicOff className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Bottom Overlay: Participant Name & Speaker indicator */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white drop-shadow truncate max-w-[140px]">
            {participant.userName} {isLocal && '(Siz)'}
          </span>
          {isCurrentSpeaker && (
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 drop-shadow animate-pulse">
              <Volume2 className="w-3 h-3" />
              <span>Minbarda</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CourtroomCenterStage({
  room,
  myParticipant,
  isHost,
  isJudge,
  localStream,
  remoteStreams = {},
  videoEnabledUserIds = new Set(),
  speakingParticipants = new Set(),
  liveSubtitles = {},
  onStartTrial,
  onRuleObjection,
  onAdvanceStage,
}: CourtroomCenterStageProps) {
  const [showFacts, setShowFacts] = useState(false)
  const [viewMode, setViewMode] = useState<'spatial' | 'gallery'>('spatial')

  const currentStage = TRIAL_STAGES.find(s => s.id === room.currentStageId) || TRIAL_STAGES[0]
  const currentSpeaker = room.participants.find(p => p.userId === room.currentSpeakerId)

  // Find participants by key role
  const judge = room.participants.find(p => p.role === 'SUDYA')
  const prosecutor = room.participants.find(p => p.role === 'PROKUROR')
  const lawyer = room.participants.find(p => p.role === 'ADVOKAT')
  const defendant = room.participants.find(p => p.role === 'AYBLANUVCHI')
  const witness = room.participants.find(p => p.role === 'GUVOH')
  const clerk = room.participants.find(p => p.role === 'KOTIB')

  // Find active live subtitle
  const activeSubtitleEntry = Object.entries(liveSubtitles).sort(
    (a, b) => b[1].updatedAt - a[1].updatedAt
  )[0]

  const showLiveSubtitle =
    activeSubtitleEntry && Date.now() - activeSubtitleEntry[1].updatedAt < 6000

  // Last speech message
  const lastSpeech = [...room.messages]
    .reverse()
    .find(m => m.messageType === 'speech' || m.messageType === 'procedural')

  const getMediaForUser = (userId?: string) => {
    if (!userId) return null
    if (userId === myParticipant?.userId) return localStream
    return remoteStreams[userId] || null
  }

  // ── 1. WAITING LOBBY MODE ──
  if (room.status === 'waiting') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between scrollbar-thin">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-blue-950/40 via-zinc-900/80 to-zinc-900 border border-blue-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Virtual Sud Majlisi — Kutish Zali</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mb-3">
              {room.title}
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              {room.scenarioData?.description ||
                'Sud majlisiga barcha taraflar taklif etildi. Ishtirokchilar yig‘ilmoqda va rollar taqsimlanmoqda. Kamera va mikrofoningizni sinab ko‘ring.'}
            </p>

            {/* Quick Case Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800">
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">Sud turi</span>
                <span className="text-xs font-semibold text-white">{room.courtType}</span>
              </div>
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">Xona kodi</span>
                <span className="text-xs font-mono font-bold text-blue-400">{room.code}</span>
              </div>
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">Ishtirokchilar</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {room.participants.length} ta a’zo hozir
                </span>
              </div>
            </div>
          </div>

          {/* Role Readiness Matrix */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Rollar taqsimoti</span>
              <span className="text-xs font-normal text-zinc-400">
                Majlisni boshlash uchun Sud Raisi tayinlanishi zarur
              </span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { role: 'SUDYA', user: judge, label: 'Sud Raisi' },
                { role: 'PROKUROR', user: prosecutor, label: 'Prokuror' },
                { role: 'ADVOKAT', user: lawyer, label: 'Himoyachi' },
                { role: 'AYBLANUVCHI', user: defendant, label: 'Sudlanuvchi' },
              ].map(slot => (
                <div
                  key={slot.role}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    slot.user
                      ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                      : 'bg-zinc-900/50 border-zinc-800 border-dashed text-zinc-500'
                  }`}
                >
                  <span className="font-bold block text-[11px] uppercase text-zinc-400">
                    {slot.label}
                  </span>
                  <span className="text-sm font-bold text-white truncate block mt-0.5">
                    {slot.user ? slot.user.userName : 'Vakant (bo‘sh)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Video & Audio Grid in Waiting Room */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <span>
                  Jonli zal — Kamera va mikrofon sinovi ({room.participants.length} ishtirokchi)
                </span>
              </h2>
              <span className="text-xs text-zinc-400">Gapiring va kamerangizni tekshiring</span>
            </div>

            {/* Real-time Subtitles if anyone is speaking in waiting room */}
            {showLiveSubtitle && activeSubtitleEntry && (
              <div className="bg-blue-950/50 border border-blue-500/50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-blue-200 animate-pulse">
                <span className="font-bold text-white uppercase">
                  {activeSubtitleEntry[1].role || 'Ishtirokchi'}:
                </span>
                <span className="italic">&ldquo;{activeSubtitleEntry[1].text}&rdquo;</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {room.participants.map(p => {
                const stream = getMediaForUser(p.userId)
                const isLocal = p.userId === myParticipant?.userId
                const isVideoOn = isLocal
                  ? !!localStream && localStream.getVideoTracks().some(t => t.enabled)
                  : videoEnabledUserIds.has(p.userId)
                const isAudioOn = speakingParticipants.has(p.userId)

                return (
                  <ParticipantMediaTile
                    key={p.userId}
                    participant={p}
                    isCurrentSpeaker={false}
                    isAudioSpeaking={isAudioOn}
                    isVideoActive={isVideoOn}
                    mediaStream={stream}
                    isLocal={isLocal}
                    customHeight="h-32 sm:h-36"
                  />
                )
              })}
            </div>
          </div>

          {/* Host Start Trial Action Banner */}
          {isHost || isJudge ? (
            <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Majlisni boshlashga tayyormisiz?</h3>
                <p className="text-xs text-zinc-400">
                  Barcha kerakli qatnashuvchilar zalga to‘plangach, rasmiy protsessni boshlang.
                </p>
              </div>

              <button
                onClick={onStartTrial}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Sud majlisini boshlash</span>
              </button>
            </div>
          ) : (
            <div className="text-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-xs text-zinc-400">
              ⏳ Sud Raisi majlisni rasman ochishini kuting...
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 2. ACTIVE TRIAL SIMULATION STAGE ──
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between scrollbar-thin space-y-4">
      {/* Pending Objection Notification Banner */}
      {room.pendingObjection && (
        <div className="bg-gradient-to-r from-amber-950/80 via-red-950/80 to-zinc-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-xl animate-bounce-once">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    E’TIROZ BILDIRILDI!
                  </span>
                  <span className="text-xs text-zinc-300">
                    ({room.pendingObjection.raisedByRole} {room.pendingObjection.raisedByName})
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  &ldquo;{room.pendingObjection.reason}&rdquo;
                </p>
              </div>
            </div>

            {/* If current user is Judge: RULING BUTTONS */}
            {isJudge && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                <button
                  onClick={() => onRuleObjection('sustained', 'E’tiroz asosli deb topildi.')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Qanoatlantirish</span>
                </button>
                <button
                  onClick={() =>
                    onRuleObjection('overruled', 'E’tiroz asossiz, majlis davom etsin.')
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1 transition-colors shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rad etish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Courtroom Stand Layout */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-6 relative shadow-inner">
        {/* Stage Header Info & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80 mb-6">
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              {currentStage.legalName}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {currentStage.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Spatial Zal vs Video Grid */}
            <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-zinc-700">
              <button
                onClick={() => setViewMode('spatial')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'spatial'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Sud Zali minbarlari ko‘rinishi"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Zal</span>
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'gallery'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Barcha ishtirokchilar video paneli"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Galereya</span>
              </button>
            </div>

            <button
              onClick={() => setShowFacts(!showFacts)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Ish tafsilotlari</span>
              {showFacts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Case Facts & Articles */}
        {showFacts && (
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 mb-6 space-y-3 animate-fade-in text-xs">
            <div>
              <span className="font-bold text-zinc-300 block mb-1">Ish holati (Faktlar):</span>
              <p className="text-zinc-400 leading-relaxed">
                {room.scenarioData?.facts || room.title}
              </p>
            </div>

            {room.scenarioData?.legal_basis?.length > 0 && (
              <div className="pt-2 border-t border-zinc-900">
                <span className="font-bold text-zinc-300 block mb-1.5">Huquqiy asoslar:</span>
                <div className="flex flex-wrap gap-2">
                  {room.scenarioData.legal_basis.map((lb: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]"
                      title={lb.relevance}
                    >
                      {lb.code} {lb.article} — {lb.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SPATIAL COURTROOM VIEW ── */}
        {viewMode === 'spatial' ? (
          <div className="space-y-4">
            {/* Top: Sudya (Judge Bench) */}
            <div className="flex justify-center">
              <div className="max-w-md w-full">
                <ParticipantMediaTile
                  participant={judge}
                  isCurrentSpeaker={currentSpeaker?.role === 'SUDYA'}
                  isAudioSpeaking={judge ? speakingParticipants.has(judge.userId) : false}
                  isVideoActive={judge ? videoEnabledUserIds.has(judge.userId) : false}
                  mediaStream={getMediaForUser(judge?.userId)}
                  isLocal={judge?.userId === myParticipant?.userId}
                  customHeight="h-44 sm:h-52"
                />
              </div>
            </div>

            {/* Middle: Prosecution (Left) & Defense (Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prosecutor */}
              <div>
                <ParticipantMediaTile
                  participant={prosecutor}
                  isCurrentSpeaker={currentSpeaker?.role === 'PROKUROR'}
                  isAudioSpeaking={prosecutor ? speakingParticipants.has(prosecutor.userId) : false}
                  isVideoActive={prosecutor ? videoEnabledUserIds.has(prosecutor.userId) : false}
                  mediaStream={getMediaForUser(prosecutor?.userId)}
                  isLocal={prosecutor?.userId === myParticipant?.userId}
                  customHeight="h-40 sm:h-44"
                />
              </div>

              {/* Defense Lawyer */}
              <div>
                <ParticipantMediaTile
                  participant={lawyer}
                  isCurrentSpeaker={currentSpeaker?.role === 'ADVOKAT'}
                  isAudioSpeaking={lawyer ? speakingParticipants.has(lawyer.userId) : false}
                  isVideoActive={lawyer ? videoEnabledUserIds.has(lawyer.userId) : false}
                  mediaStream={getMediaForUser(lawyer?.userId)}
                  isLocal={lawyer?.userId === myParticipant?.userId}
                  customHeight="h-40 sm:h-44"
                />
              </div>
            </div>

            {/* Bottom: Witness Stand & Accused Bench */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Witness */}
              <div>
                <ParticipantMediaTile
                  participant={witness}
                  isCurrentSpeaker={currentSpeaker?.role === 'GUVOH'}
                  isAudioSpeaking={witness ? speakingParticipants.has(witness.userId) : false}
                  isVideoActive={witness ? videoEnabledUserIds.has(witness.userId) : false}
                  mediaStream={getMediaForUser(witness?.userId)}
                  isLocal={witness?.userId === myParticipant?.userId}
                  customHeight="h-36 sm:h-40"
                />
              </div>

              {/* Defendant */}
              <div>
                <ParticipantMediaTile
                  participant={defendant}
                  isCurrentSpeaker={currentSpeaker?.role === 'AYBLANUVCHI'}
                  isAudioSpeaking={defendant ? speakingParticipants.has(defendant.userId) : false}
                  isVideoActive={defendant ? videoEnabledUserIds.has(defendant.userId) : false}
                  mediaStream={getMediaForUser(defendant?.userId)}
                  isLocal={defendant?.userId === myParticipant?.userId}
                  customHeight="h-36 sm:h-40"
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── GALLERY / VIDEO GRID VIEW ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {room.participants.map(p => (
              <ParticipantMediaTile
                key={p.userId}
                participant={p}
                isCurrentSpeaker={currentSpeaker?.userId === p.userId}
                isAudioSpeaking={speakingParticipants.has(p.userId)}
                isVideoActive={videoEnabledUserIds.has(p.userId)}
                mediaStream={getMediaForUser(p.userId)}
                isLocal={p.userId === myParticipant?.userId}
                customHeight="h-40 sm:h-48"
              />
            ))}
          </div>
        )}

        {/* Real-Time Live Speech Subtitle Bubble */}
        {showLiveSubtitle && (
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-950/80 border border-blue-500/50 shadow-xl backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                Jonli Stenogramma (STT):
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
              &ldquo;{activeSubtitleEntry[1].text}&rdquo;
            </p>
          </div>
        )}

        {/* Live Speech Broadcast Bar (Last committed speech) */}
        {!showLiveSubtitle && lastSpeech && (
          <div className="mt-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                {lastSpeech.role}
              </span>
              <span className="text-xs font-bold text-white">{lastSpeech.userName}:</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">
              &ldquo;{lastSpeech.content}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
