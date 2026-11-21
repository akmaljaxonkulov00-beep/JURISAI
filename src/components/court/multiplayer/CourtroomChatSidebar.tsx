'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  FileCheck,
  ListOrdered,
  Sparkles,
  BookOpen,
  Send,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Gavel,
  Volume2,
  Clock,
  Download,
  Copy,
  Check,
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
  const [activeTab, setActiveTab] = useState<'chat' | 'protocol' | 'queue' | 'ai'>('chat')
  const [copiedProtocol, setCopiedProtocol] = useState(false)
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

  const handleCopyProtocol = () => {
    const text = protocolMessages
      .map(
        (m, idx) =>
          `[${new Date(m.createdAt).toLocaleTimeString()}] #${idx + 1} ${m.role} (${m.userName}): ${m.content}`
      )
      .join('\n\n')
    navigator.clipboard.writeText(`SUD PROTOKOLI (${room.code}) - ${room.title}\n\n${text}`)
    setCopiedProtocol(true)
    setTimeout(() => setCopiedProtocol(false), 2000)
  }

  return (
    <aside className="w-full lg:w-80 bg-slate-950/90 border-l border-slate-800/80 flex flex-col h-full flex-shrink-0">
      {/* Tab Switcher */}
      <div className="p-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Nutqlar"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-[11px]">Nutq ({room.messages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('protocol')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'protocol'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Bayonnoma"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span className="text-[11px]">Protokol</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors relative ${
            activeTab === 'queue'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="So‘z navbati"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span className="text-[11px]">Navbat</span>
          {room.speakingQueue.length > 0 && (
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
              {room.speakingQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
          }`}
          title="AI Huquqiy Yordamchi"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px]">AI</span>
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
                  className="text-center my-2 text-[10px] text-slate-400 font-medium px-3 py-1 rounded-full bg-slate-900 border border-slate-800 max-w-[95%] mx-auto"
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
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                    : isRuling
                      ? 'bg-blue-950/40 border-blue-500/50 text-blue-100 shadow-sm'
                      : isVerdict
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100 font-semibold'
                        : 'bg-slate-900/90 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold px-1.5 py-0.2 rounded text-[10px] border ${
                        roleDef?.color || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {msg.role}
                    </span>
                    <span className="font-bold text-white truncate max-w-[120px]">
                      {msg.userName}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
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
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-bold text-blue-400 block mb-0.5">Sud Bayonnomasi:</span>
              <span>Kodi: {room.code}</span>
            </div>
            <button
              onClick={handleCopyProtocol}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] transition-colors"
              title="Nusxa olish"
            >
              {copiedProtocol ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedProtocol ? 'Nusxalandi' : 'Nusxa'}</span>
            </button>
          </div>

          {protocolMessages.map((m, idx) => (
            <div
              key={m.id}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1"
            >
              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                <span className="font-bold text-blue-300">
                  #{idx + 1} • {m.role} ({m.userName})
                </span>
                <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-slate-200 font-sans">{m.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Tab 3: Speaking Queue */}
      {activeTab === 'queue' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div>
            <h3 className="text-xs font-bold text-white mb-1">So‘z so‘raganlar navbati</h3>
            <p className="text-[11px] text-slate-400 leading-tight">
              Ishtirokchilar navbatga yozilishi mumkin. Sudya kimga so‘z berishni hal qiladi.
            </p>
          </div>

          {/* Current Speaker Banner */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/50 text-xs">
            <span className="text-[10px] text-blue-400 font-bold uppercase block mb-0.5">
              Hozirgi so‘zlovchi:
            </span>
            <span className="font-bold text-white">
              {room.currentSpeakerRole ? `${room.currentSpeakerRole}` : 'Minbar bo‘sh (Hech kim so‘zlamayapti)'}
            </span>

            {isJudge && room.currentSpeakerId && (
              <button
                onClick={() => onGrantSpeaking(null)}
                className="mt-2 w-full py-1 text-center text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-colors"
              >
                So‘zni to‘xtatish
              </button>
            )}
          </div>

          {/* Queue Items */}
          <div className="space-y-2">
            {room.speakingQueue.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">Navbatda hech kim yo‘q.</div>
            ) : (
              room.speakingQueue.map((item, idx) => (
                <div
                  key={item.userId}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{item.userName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.role}</span>
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
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onRequestSpeaking(isUserInQueue ? 'cancel' : 'request')}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isUserInQueue
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                }`}
              >
                {isUserInQueue ? 'Navbatdan chiqish' : 'So‘z so‘rash (Navbatga yozilish)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Legal Advisor */}
      {activeTab === 'ai' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin text-xs">
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>AI Protsessual Yordamchi</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O‘zbekiston Jinoyat-protsessual (JPK) va Fuqarolik protsessual (FPK) kodekslari asosida ish holatini tahlil qiladi.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Joriy bosqich bo‘yicha tavsiya:
            </span>
            <p className="text-[11px] text-slate-200 leading-normal">
              Hozirgi bosqich: <strong className="text-blue-400">{room.currentStageId}</strong>.
              {isJudge
                ? ' Sudya sifatida taraflarning dalillarini tekshirib, protsessual tartib buzilmasligini nazorat qiling.'
                : myParticipant?.role === 'ADVOKAT'
                  ? ' Himoya tarafi sifatida kiritilgan dalillarning maqbulligini (JPK 95-modda) sinchiklab tekshiring.'
                  : myParticipant?.role === 'PROKUROR'
                    ? ' Ayblov tarafi sifatida moddiy zararni va dalillar zanjirini to‘liq asoslang.'
                    : ' Savollarga aniq va faktlar asosida javob bering.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Asosiy normativ manbalar:
            </span>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>JPK 405-410 (Majlis ochilishi)</li>
              <li>JPK 443-448 (Dalillar tekshiruvi)</li>
              <li>JPK 449-453 (Muzokaralar tartibi)</li>
              <li>JPK 454-455 (Sudlanuvchi oxirgi so‘zi)</li>
            </ul>
          </div>
        </div>
      )}
    </aside>
  )
}
