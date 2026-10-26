'use client'

import React, { useState } from 'react'
import { Plus, X, Scale, Users, Bot, Mic, Shield, AlertTriangle } from 'lucide-react'
import { SEED_SCENARIOS } from '@/lib/court/scenario-db'
import type { CreateRoomInput, MultiplayerCaseCategory } from '@/lib/court/multiplayer-types'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (data: CreateRoomInput) => Promise<void>
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [title, setTitle] = useState('')
  const [caseCategory, setCaseCategory] = useState<MultiplayerCaseCategory>('criminal')
  const [scenarioId, setScenarioId] = useState<string>(SEED_SCENARIOS[0].id)
  const [maxParticipants, setMaxParticipants] = useState<number>(8)
  const [isPublic, setIsPublic] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  // Filter scenarios by category
  const filteredScenarios = SEED_SCENARIOS.filter(s => s.category === caseCategory)

  const handleCategoryChange = (cat: MultiplayerCaseCategory) => {
    setCaseCategory(cat)
    const matching = SEED_SCENARIOS.find(s => s.category === cat)
    if (matching) {
      setScenarioId(matching.id)
      if (!title || SEED_SCENARIOS.some(s => s.title === title)) {
        setTitle(matching.title)
      }
    }
  }

  const handleScenarioChange = (scenId: string) => {
    setScenarioId(scenId)
    const scen = SEED_SCENARIOS.find(s => s.id === scenId)
    if (scen) setTitle(scen.title)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTitle = title.trim() || 'Virtual Sud Majlisi'

    try {
      setLoading(true)
      setError(null)
      await onCreateRoom({
        title: finalTitle,
        caseCategory,
        scenarioId,
        maxParticipants,
        isPublic,
        aiEnabled,
        voiceEnabled,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Xona yaratishda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Sud Zali Yaratish</h2>
              <p className="text-xs text-zinc-400">Yangi ko‘p foydalanuvchili sud simulyatsiyasi</p>
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
          {/* Case Category Tabs */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5">Ish toifasi *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'criminal', label: 'Jinoyat ishi' },
                { key: 'civil', label: 'Fuqarolik ishi' },
                { key: 'labor', label: 'Mehnat nizosi' },
              ].map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryChange(cat.key as any)}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                    caseCategory === cat.key
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Selection */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5">
              Ish senariysi (O‘zbekiston qonunchiligi asosida) *
            </label>
            <select
              value={scenarioId}
              onChange={e => handleScenarioChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {filteredScenarios.map(sc => (
                <option key={sc.id} value={sc.id}>
                  {sc.title} ({sc.difficulty.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Room Title */}
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5">Sud zali nomi *</label>
            <input
              type="text"
              required
              placeholder="Masalan: Toshkent shahar sudi: O‘g‘rilik ishi"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Participants Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-300 font-bold">Maksimal ishtirokchilar</label>
              <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                {maxParticipants} kishi
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={maxParticipants}
              onChange={e => setMaxParticipants(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Settings Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/60 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-bold text-white block">Ommaviy sud zali</span>
                  <span className="text-[11px] text-zinc-400">
                    Barcha foydalanuvchilar lobbiyda xonani ko‘rishi mumkin
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/60 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-bold text-white block">AI qahramonlar yordami</span>
                  <span className="text-[11px] text-zinc-400">
                    Bo‘sh rollarni avtomatik tarzda AI qahramonlar egallaydi
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={e => setAiEnabled(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/60 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block">Ovozli aloqa (WebRTC)</span>
                  <span className="text-[11px] text-zinc-400">
                    Real vaqtda mikrofon orqali gaplashish imkoniyati
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={e => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>
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
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all"
          >
            {loading ? 'Yaratilmoqda...' : 'Sud Zalini Yaratish'}
          </button>
        </div>
      </form>
    </div>
  )
}
