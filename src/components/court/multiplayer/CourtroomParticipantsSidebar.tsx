'use client'

import React, { useState } from 'react'
import {
  Users,
  Crown,
  Mic,
  MicOff,
  UserCheck,
  UserX,
  MoreVertical,
  Shield,
  CheckCircle2,
  Scale,
  Sparkles,
  Bot,
  UserPlus,
} from 'lucide-react'
import {
  MultiplayerRoom,
  MultiplayerParticipant,
  MultiplayerRole,
  ROLE_LABELS,
} from '@/lib/court/multiplayer-types'

interface CourtroomParticipantsSidebarProps {
  room: MultiplayerRoom
  myParticipant?: MultiplayerParticipant
  onlineUserIds: Set<string>
  speakingParticipants: Set<string>
  isHost: boolean
  isJudge: boolean
  onAssignRole: (targetUserId: string, newRole: MultiplayerRole) => void
  onKick: (targetUserId: string) => void
}

// Protsessual guruhlar
const ROLE_GROUPS = [
  {
    key: 'bench',
    title: 'SUD HAY’ATI & TARKIBI',
    roles: ['SUDYA', 'KOTIB'] as MultiplayerRole[],
  },
  {
    key: 'prosecution',
    title: 'AYBLOV TARAFI',
    roles: ['PROKUROR'] as MultiplayerRole[],
  },
  {
    key: 'defense',
    title: 'HIMOYA TARAFI',
    roles: ['ADVOKAT', 'AYBLANUVCHI'] as MultiplayerRole[],
  },
  {
    key: 'witnesses',
    title: 'GUVOH & EKSPERTLAR',
    roles: ['GUVOH', 'EKSPERT'] as MultiplayerRole[],
  },
  {
    key: 'observers',
    title: 'KUZATUVCHILAR',
    roles: ['KUZATUVCHI'] as MultiplayerRole[],
  },
]

export default function CourtroomParticipantsSidebar({
  room,
  myParticipant,
  onlineUserIds,
  speakingParticipants,
  isHost,
  isJudge,
  onAssignRole,
  onKick,
}: CourtroomParticipantsSidebarProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const canManageRoles = isHost || isJudge

  const participantsByRole = (role: MultiplayerRole) =>
    room.participants.filter(p => p.role === role)

  return (
    <aside className="w-full lg:w-72 bg-slate-950/90 border-r border-slate-800/80 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Ishtirokchilar</h2>
        </div>
        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
          {room.participants.length} / {room.maxParticipants}
        </span>
      </div>

      {/* Grouped Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {ROLE_GROUPS.map(group => {
          const groupParticipants = room.participants.filter(p => group.roles.includes(p.role))
          const missingKeyRoles = group.roles.filter(
            r => r !== 'KUZATUVCHI' && !room.participants.some(p => p.role === r)
          )

          return (
            <div key={group.key} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  {group.title}
                </span>
                <span className="text-[10px] text-slate-400">
                  {groupParticipants.length}
                </span>
              </div>

              {/* Render Present Participants */}
              {groupParticipants.map(p => {
                const isOnline = onlineUserIds.has(p.userId) || p.connectionStatus === 'online'
                const isSpeaking =
                  speakingParticipants.has(p.userId) || room.currentSpeakerId === p.userId
                const roleDef = ROLE_LABELS[p.role]
                const isMe = myParticipant?.userId === p.userId

                return (
                  <div
                    key={p.userId}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isSpeaking
                        ? 'bg-blue-950/50 border-blue-500/60 shadow-md shadow-blue-500/20 ring-1 ring-blue-500/40'
                        : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar & Online dot */}
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {roleDef?.icon || '👤'}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            }`}
                            title={isOnline ? 'Onlayn' : 'Oflayn'}
                          />
                        </div>

                        {/* Name & Role tag */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[105px]">
                              {p.userName}
                            </span>
                            {isMe && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600/30 text-blue-300 font-medium border border-blue-500/30">
                                Siz
                              </span>
                            )}
                            {p.isHost && (
                              <span title="Xona boshqaruvchisi">
                                <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                              </span>
                            )}
                            {p.isAi && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <Bot className="w-2.5 h-2.5" /> AI
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                roleDef?.color || 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {p.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Speaking / Menu Icon */}
                      <div className="flex items-center gap-1">
                        {isSpeaking && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                            <Mic className="w-2.5 h-2.5" />
                          </span>
                        )}

                        {canManageRoles && !isMe && (
                          <button
                            onClick={() =>
                              setSelectedUserId(selectedUserId === p.userId ? null : p.userId)
                            }
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Rolni o‘zgartirish / Boshqarish"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Role reassignment dropdown */}
                    {selectedUserId === p.userId && canManageRoles && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
                        <p className="text-[10px] font-medium text-slate-400">Rolni o‘zgartirish:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {(['SUDYA', 'PROKUROR', 'ADVOKAT', 'GUVOH', 'EKSPERT', 'AYBLANUVCHI', 'KOTIB', 'KUZATUVCHI'] as MultiplayerRole[]).map(r => (
                            <button
                              key={r}
                              onClick={() => {
                                onAssignRole(p.userId, r)
                                setSelectedUserId(null)
                              }}
                              className={`px-1.5 py-1 rounded text-[10px] font-medium border text-left truncate transition-colors ${
                                p.role === r
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>

                        {isHost && (
                          <button
                            onClick={() => {
                              onKick(p.userId)
                              setSelectedUserId(null)
                            }}
                            className="w-full mt-1 py-1 text-center text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded border border-red-500/20"
                          >
                            Zaldan chiqarish
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Show Vacant Slots for Missing Essential Roles */}
              {missingKeyRoles.map(vacantRole => {
                const def = ROLE_LABELS[vacantRole]
                const canTakeRole = myParticipant && myParticipant.role === 'KUZATUVCHI'

                return (
                  <div
                    key={`vacant-${vacantRole}`}
                    className="p-2 rounded-xl border border-dashed border-slate-800/90 bg-slate-900/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-60 text-sm">{def.icon}</span>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Bo‘sh rol: <strong className="text-slate-300">{vacantRole}</strong>
                        </span>
                      </div>
                    </div>

                    {canTakeRole && (
                      <button
                        onClick={() => onAssignRole(myParticipant.userId, vacantRole)}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 transition-colors"
                      >
                        Egalla
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Role Guide Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Protsessual intizom:</span>
        </div>
        <p className="leading-tight text-slate-400 text-[10px]">
          Faqat ruxsat berilgan ishtirokchilar nutq so‘zlay oladi. E’tirozlar sudya tomonidan hal etiladi.
        </p>
      </div>
    </aside>
  )
}
