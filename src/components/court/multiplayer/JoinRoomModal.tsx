'use client'

import React, { useState, useEffect } from 'react'
import { LogIn, X, AlertTriangle, Shield, CheckCircle, Lock, Users } from 'lucide-react'
import { MultiplayerRole, ROLE_LABELS, MultiplayerRoom } from '@/lib/court/multiplayer-types'

interface JoinRoomModalProps {
  isOpen: boolean
  initialCode?: string
  onClose: () => void
  onJoinRoom: (code: string, role?: MultiplayerRole) => Promise<void>
}

const ALL_ROLES: MultiplayerRole[] = [
  'ADVOKAT',
  'PROKUROR',
  'SUDYA',
  'GUVOH',
  'AYBLANUVCHI',
  'KOTIB',
  'KUZATUVCHI',
]

const UNIQUE_ROLES: MultiplayerRole[] = ['SUDYA', 'PROKUROR', 'ADVOKAT', 'AYBLANUVCHI', 'KOTIB']

export default function JoinRoomModal({
  isOpen,
  initialCode = '',
  onClose,
  onJoinRoom,
}: JoinRoomModalProps) {
  const [code, setCode] = useState(initialCode)
  const [role, setRole] = useState<MultiplayerRole>('ADVOKAT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomDetails, setRoomDetails] = useState<MultiplayerRoom | null>(null)
  const [checkingRoom, setCheckingRoom] = useState(false)

  // Fetch room preview whenever code changes
  useEffect(() => {
    const clean = code.toUpperCase().trim()
    if (!clean || clean.length < 6) {
      setRoomDetails(null)
      return
    }

    let isMounted = true
    const checkRoom = async () => {
      try {
        setCheckingRoom(true)
        const res = await fetch(`/api/court/multiplayer/rooms/${clean}`)
        const data = await res.json()
        if (isMounted) {
          if (data.success && data.room) {
            setRoomDetails(data.room)
            setError(null)

            // Calculate occupied roles
            const taken = new Map<string, string>()
            data.room.participants.forEach((p: any) => {
              taken.set(p.role, p.userName)
            })

            // If currently selected role is taken and unique, switch to first available role
            if (UNIQUE_ROLES.includes(role) && taken.has(role)) {
              const available = ALL_ROLES.find(
                r => r === 'KUZATUVCHI' || r === 'GUVOH' || !taken.has(r)
              )
              if (available) setRole(available)
            }
          } else {
            setRoomDetails(null)
          }
        }
      } catch {
        if (isMounted) setRoomDetails(null)
      } finally {
        if (isMounted) setCheckingRoom(false)
      }
    }

    const timer = setTimeout(checkRoom, 300)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [code, role])

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase().trim())
    }
  }, [initialCode])

  if (!isOpen) return null

  // Map of taken unique roles
  const occupiedRoles: Record<string, string> = {}
  if (roomDetails) {
    roomDetails.participants.forEach(p => {
      occupiedRoles[p.role] = p.userName
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.toUpperCase().trim()
    if (!cleanCode) {
      setError('Iltimos, xona kodini kiriting.')
      return
    }

    // Verify role availability client-side
    if (UNIQUE_ROLES.includes(role) && occupiedRoles[role]) {
      setError(
        `Ushbu [${ROLE_LABELS[role]?.title || role}] roli allaqachon ${occupiedRoles[role]} tomonidan band qilingan. Iltimos, boshqa bo‘sh rolni tanlang.`
      )
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onJoinRoom(cleanCode, role)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Xonaga qo‘shilishda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Sudga Qo‘shilish</h2>
              <p className="text-xs text-zinc-400">Xona kodi orqali zalga ulaning</p>
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
          {/* Room Code Input */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5">
              Xona kodi yoki taklif havolasi *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: JUR-4B82"
              value={code}
              onChange={e => {
                const val = e.target.value
                if (val.includes('join=')) {
                  const extracted = val.split('join=')[1]?.split('&')[0]
                  setCode((extracted || val).toUpperCase().trim())
                } else {
                  setCode(val.toUpperCase().trim())
                }
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold tracking-wider"
            />
          </div>

          {/* Room Verified Preview Card */}
          {roomDetails && (
            <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-1 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 uppercase">
                  Sud Zali Topildi:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  {roomDetails.status === 'waiting' ? 'Kutish zali' : 'Jarayonda'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-white truncate">{roomDetails.title}</h3>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>Toifa: {roomDetails.courtType}</span>
                <span>{roomDetails.participants.length} ta ishtirokchi hozir</span>
              </div>
            </div>
          )}

          {/* Role Selection with Occupied Badges */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5">Sud rolini tanlang:</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map(r => {
                const def = ROLE_LABELS[r]
                const isOccupied = UNIQUE_ROLES.includes(r) && !!occupiedRoles[r]
                const occupiedName = occupiedRoles[r]
                const isSelected = role === r

                return (
                  <button
                    key={r}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => setRole(r)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isOccupied
                        ? 'opacity-40 cursor-not-allowed bg-zinc-950 border-zinc-800 text-zinc-600'
                        : isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/50'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span>{def?.icon}</span>
                        <span className="font-bold text-xs">{r}</span>
                      </div>
                      {isOccupied && <Lock className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    </div>

                    <div className="mt-1">
                      {isOccupied ? (
                        <span className="text-[10px] text-red-400/90 font-semibold block truncate">
                          🔒 Band ({occupiedName})
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400/90 font-medium block truncate">
                          ✅ Bo‘sh (Mavjud)
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              * Band qilingan asosiy rollar (Sudya, Prokuror, Advokat, Sudlanuvchi) qulflangan
              bo‘lib, bir vaqtda faqat bir ishtirokchiga tegishli bo‘ladi.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
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
            disabled={loading || (UNIQUE_ROLES.includes(role) && !!occupiedRoles[role])}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{loading ? 'Ulanmoqda...' : 'Sudga kirish'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
