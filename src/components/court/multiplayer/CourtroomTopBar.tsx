'use client'

import React, { useState } from 'react'
import {
  Gavel,
  Copy,
  Check,
  Share2,
  LogOut,
  Radio,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Clock,
  Users,
  Shield,
} from 'lucide-react'
import type { MultiplayerRoom, MultiplayerParticipant } from '@/lib/court/multiplayer-types'

interface CourtroomTopBarProps {
  room: MultiplayerRoom
  myParticipant?: MultiplayerParticipant
  connected: boolean
  onlineCount: number
  isMicMuted: boolean
  isVideoOn?: boolean
  isAudioConnected: boolean
  elapsedSeconds?: number
  soundEffectsEnabled?: boolean
  onToggleMute: () => void
  onToggleVideo?: () => void
  onToggleSoundEffects?: () => void
  onLeave: () => void
}

export default function CourtroomTopBar({
  room,
  myParticipant,
  connected,
  onlineCount,
  isMicMuted,
  isVideoOn = false,
  isAudioConnected,
  elapsedSeconds = 0,
  soundEffectsEnabled = true,
  onToggleMute,
  onToggleVideo,
  onToggleSoundEffects,
  onLeave,
}: CourtroomTopBarProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(room.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyInviteLink = () => {
    const url = `${window.location.origin}/virtual-court/multiplayer?join=${room.code}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const categoryLabel: Record<string, string> = {
    criminal: 'Jinoyat ishi',
    civil: 'Fuqarolik ishi',
    labor: 'Mehnat nizosi',
    economic: 'Iqtisodiy ish',
    administrative: 'Ma’muriy ish',
  }

  return (
    <header className="bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-3 relative z-20">
      {/* Left: Room Title, Code & Badges */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
          <Gavel className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-md">
              {room.title}
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {categoryLabel[room.caseCategory] || room.courtType}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
            <div className="flex items-center gap-1.5 font-mono">
              <span>Xona:</span>
              <button
                onClick={copyCode}
                className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 rounded transition-colors"
                title="Kodni nusxalash"
              >
                <span>{room.code}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            <button
              onClick={copyInviteLink}
              className="hidden sm:flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
              title="Havolani nusxalash"
            >
              <Share2 className="w-3 h-3" />
              <span>{copiedLink ? 'Nusxalandi!' : 'Taklif havolasi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Audio/Video Controls, Presence, Timer & Leave */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Session Timer */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-mono text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="hidden sm:inline">{connected ? 'Onlayn' : 'Ulanmoqda...'}</span>
          <span className="text-zinc-500 font-mono">({onlineCount})</span>
        </div>

        {/* Video Camera Toggle */}
        {onToggleVideo && (
          <button
            onClick={onToggleVideo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isVideoOn
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
            }`}
            title={isVideoOn ? 'Kamerani o‘chirish' : 'Kamerani yoqish'}
          >
            {isVideoOn ? (
              <>
                <Video className="w-4 h-4 text-white animate-pulse" />
                <span className="hidden md:inline font-bold">Kamera Yoqilgan</span>
              </>
            ) : (
              <>
                <VideoOff className="w-4 h-4" />
                <span className="hidden md:inline">Kamera</span>
              </>
            )}
          </button>
        )}

        {/* Voice Microphone Toggle */}
        <button
          onClick={onToggleMute}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            !isMicMuted
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
          }`}
          title={!isMicMuted ? 'Mikrofonni o‘chirish' : 'Mikrofonni yoqish'}
        >
          {!isMicMuted ? (
            <>
              <Mic className="w-4 h-4 text-white animate-pulse" />
              <span className="hidden md:inline font-bold">Ovoz Ochiq</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span className="hidden md:inline">Ovoz O‘chiq</span>
            </>
          )}
        </button>

        {/* Sound Effects Toggle */}
        {onToggleSoundEffects && (
          <button
            onClick={onToggleSoundEffects}
            className={`p-2 rounded-xl text-xs border transition-colors ${
              soundEffectsEnabled
                ? 'bg-zinc-800 text-amber-400 border-zinc-700'
                : 'bg-zinc-900 text-zinc-600 border-zinc-800'
            }`}
            title={soundEffectsEnabled ? 'Sud tovushlarini o‘chirish' : 'Sud tovushlarini yoqish'}
          >
            {soundEffectsEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Leave Room Button */}
        <button
          onClick={() => setShowConfirmLeave(true)}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 transition-colors"
          title="Zalni tark etish"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Leave Confirmation Dialog Modal */}
      {showConfirmLeave && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Sud zalidan chiqasizmi?</h3>
              <p className="text-xs text-zinc-400">
                Majlis davom etmoqda. Agar siz Sud Raisi bo‘lsangiz, raislik boshqa ishtirokchiga
                o‘tishi mumkin.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmLeave(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={onLeave}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-500/20"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
