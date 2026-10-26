'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  FileCheck,
  ListOrdered,
  Send,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Gavel,
  Volume2,
  Clock,
} from 'lucide-react'
import {
  MultiplayerRoom,
  MultiplayerParticipant,
  MultiplayerMessage,
  ROLE_LABELS,
} from '@/lib/court/multiplayer-types'

interface CourtroomChatSidebarProps {
  room: MultiplayerRoom
  myParticipant?: MultiplayerParticipant
  isJudge: boolean
  onGrantSpeaking: (targetUserId: string | null) => void
  onRequestSpeaking: (action: 'request' | 'cancel') => void
}

export default function CourtroomChatSidebar({
  room,
  myParticipant,
  isJudge,
  onGrantSpeaking,
  onRequestSpeaking,
}: CourtroomChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'protocol' | 'queue'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isUserInQueue = room.speakingQueue.some(q => q.userId === myParticipant?.userId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room.messages.length])

  // Filter messages for protocol tab
  const protocolMessages = room.messages.filter(
    m =>
      m.messageType === 'procedural' ||
      m.messageType === 'ruling' ||
      m.messageType === 'objection' ||
      m.messageType === 'verdict'
  )

  return (
    <aside className="w-full lg:w-80 bg-zinc-900/70 border-l border-zinc-800/80 flex flex-col h-full flex-shrink-0">
      {/* Tab Switcher */}
      <div className="p-2 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Nutqlar ({room.messages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('protocol')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'protocol'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Bayonnoma</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors relative ${
            activeTab === 'queue'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Navbat</span>
          {room.speakingQueue.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              {room.speakingQueue.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Live Chat / Speeches */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {room.messages.map(msg => {
            const roleDef = ROLE_LABELS[msg.role]
            const isSystem = msg.messageType === 'system'
            const isObjection = msg.messageType === 'objection'
            const isRuling = msg.messageType === 'ruling'
            const isVerdict = msg.messageType === 'verdict'

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="text-center my-2 text-[11px] text-zinc-500 font-medium px-3 py-1 rounded-full bg-zinc-950/40 border border-zinc-800/60 max-w-[90%] mx-auto"
                >
                  {msg.content}
                </div>
              )
            }

            return (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  isObjection
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : isRuling
                      ? 'bg-blue-950/30 border-blue-500/50 text-blue-100 shadow-sm'
                      : isVerdict
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-100 font-semibold'
                        : 'bg-zinc-900/90 border-zinc-800/80 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold px-1.5 py-0.2 rounded text-[10px] border ${
                        roleDef?.color || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {msg.role}
                    </span>
                    <span className="font-bold text-white truncate max-w-[130px]">
                      {msg.userName}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Tab 2: Official Protocol */}
      {activeTab === 'protocol' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono text-xs scrollbar-thin">
          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400">
            <span className="font-bold text-blue-400 block mb-1">Rasmiy bayonnoma (Protocol):</span>
            Ish kodi: {room.code} • Majlis ochilgan: {new Date(room.createdAt).toLocaleTimeString()}
          </div>

          {protocolMessages.map((m, idx) => (
            <div
              key={m.id}
              className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-1"
            >
              <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                <span>
                  #{idx + 1} • {m.role} ({m.userName})
                </span>
                <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-zinc-200 font-sans">{m.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Tab 3: Speaking Queue */}
      {activeTab === 'queue' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div>
            <h3 className="text-xs font-bold text-white mb-1">So‘z so‘raganlar ro‘yxati</h3>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Ishtirokchilar navbatga yozilishi mumkin. Sudya kimga so‘z berishni hal qiladi.
            </p>
          </div>

          {/* Current Speaker Banner */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/40 text-xs">
            <span className="text-[10px] text-blue-400 font-bold uppercase block mb-0.5">
              Hozirgi so‘zlovchi:
            </span>
            <span className="font-bold text-white">
              {room.currentSpeakerRole ? `${room.currentSpeakerRole}` : 'Hech kim so‘zlamayapti'}
            </span>

            {isJudge && room.currentSpeakerId && (
              <button
                onClick={() => onGrantSpeaking(null)}
                className="mt-2 w-full py-1 text-center text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 rounded-lg border border-amber-500/20"
              >
                So‘zni to‘xtatish
              </button>
            )}
          </div>

          {/* Queue Items */}
          <div className="space-y-2">
            {room.speakingQueue.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">Navbatda hech kim yo‘q.</div>
            ) : (
              room.speakingQueue.map((item, idx) => (
                <div
                  key={item.userId}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{item.userName}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{item.role}</span>
                    </div>
                  </div>

                  {isJudge && (
                    <button
                      onClick={() => onGrantSpeaking(item.userId)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      So‘z berish
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* User's own queue toggle button */}
          {myParticipant && myParticipant.role !== 'SUDYA' && (
            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => onRequestSpeaking(isUserInQueue ? 'cancel' : 'request')}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isUserInQueue
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                }`}
              >
                {isUserInQueue ? 'Navbatdan chiqish' : 'So‘z so‘rash (Navbatga yozilish)'}
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
