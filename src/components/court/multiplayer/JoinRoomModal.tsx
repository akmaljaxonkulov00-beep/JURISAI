'use client'

import React, { useState, useEffect } from 'react'
import { LogIn, X, AlertTriangle, Shield } from 'lucide-react'
import { MultiplayerRole, ROLE_LABELS } from '@/lib/court/multiplayer-types'

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

  useEffect(() => {
    if (initialCode) setCode(initialCode.toUpperCase().trim())
  }, [initialCode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.toUpperCase().trim()
    if (!cleanCode) {
      setError('Iltimos, xona kodini kiriting.')
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

          {/* Role Selection */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5">
              Istalgan sud roli (bo‘sh bo‘lsa biriktiriladi):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map(r => {
                const def = ROLE_LABELS[r]
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      role === r
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{def?.icon}</span>
                      <span className="font-bold text-xs">{r}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                      {def?.title}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              * Agar siz tanlagan noyob rol allaqachon band bo‘lsa, siz avtomatik tarzda bo‘sh rolga
              yoki Kuzatuvchi maqomiga biriktirilasiz.
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
            disabled={loading || !code.trim()}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all"
          >
            {loading ? 'Tekshirilmoqda...' : 'Sudga Qo‘shilish'}
          </button>
        </div>
      </form>
    </div>
  )
}
