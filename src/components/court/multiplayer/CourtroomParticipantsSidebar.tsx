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

const ALL_ROLES: MultiplayerRole[] = [
  'SUDYA',
  'PROKUROR',
  'ADVOKAT',
  'GUVOH',
  'AYBLANUVCHI',
  'KOTIB',
  'KUZATUVCHI',
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

  return (
    <aside className="w-full lg:w-72 bg-zinc-900/70 border-r border-zinc-800/80 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Ishtirokchilar</h2>
        </div>
        <span className="text-xs font-mono font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
          {room.participants.length} / {room.maxParticipants}
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {room.participants.map(p => {
          const isOnline = onlineUserIds.has(p.userId) || p.connectionStatus === 'online'
          const isSpeaking =
            speakingParticipants.has(p.userId) || room.currentSpeakerId === p.userId
          const roleDef = ROLE_LABELS[p.role]
          const isMe = myParticipant?.userId === p.userId

          return (
            <div
              key={p.userId}
              className={`p-3 rounded-2xl border transition-all ${
                isSpeaking
                  ? 'bg-blue-950/40 border-blue-500/50 shadow-sm shadow-blue-500/20'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* User Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                      {roleDef?.icon || '👤'}
                    </div>
                    {/* Online status indicator */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                        isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                      }`}
                      title={isOnline ? 'Onlayn' : 'Oflayn'}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[110px]">
                        {p.userName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                          Siz
                        </span>
                      )}
                      {p.isHost && (
                        <span title="Xona boshqaruvchisi">
                          <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          roleDef?.color || 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {p.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status / Role Editor Toggle */}
                <div className="flex items-center gap-1">
                  {isSpeaking && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                      <Mic className="w-3 h-3" />
                      <span className="hidden sm:inline">Nutq</span>
                    </span>
                  )}

                  {canManageRoles && !isMe && (
                    <button
                      onClick={() =>
                        setSelectedUserId(selectedUserId === p.userId ? null : p.userId)
                      }
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Rolni o‘zgartirish / Boshqarish"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Role Reassignment Drawer */}
              {selectedUserId === p.userId && canManageRoles && (
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2 animate-fade-in">
                  <p className="text-[11px] font-medium text-zinc-400">Yangi rol biriktirish:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_ROLES.map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          onAssignRole(p.userId, role)
                          setSelectedUserId(null)
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left transition-all ${
                          p.role === role
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {isHost && (
                    <button
                      onClick={() => {
                        onKick(p.userId)
                        setSelectedUserId(null)
                      }}
                      className="w-full mt-1.5 py-1 text-center text-[11px] font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                    >
                      Zalldan chiqarib yuborish
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Role Guide Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40 text-[11px] text-zinc-400 space-y-1">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Protsessual vakolatlar:</span>
        </div>
        <p className="leading-tight text-zinc-500">
          • Sudya majlisni boshqaradi va hukm chiqaradi.
          <br />
          • Advokat va Prokuror dalil va e’tiroz kiritadi.
          <br />• Kuzatuvchilar eshitish huquqiga ega.
        </p>
      </div>
    </aside>
  )
}
