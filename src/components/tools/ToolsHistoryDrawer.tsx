'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  History,
  Trash2,
  Calendar,
  Layers,
  Scale,
  FileText,
  ShieldAlert,
  TrendingUp,
  Search,
  ExternalLink,
} from 'lucide-react'
import { ToolHistoryRecord } from '@/types/professional-tools'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface ToolsHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ToolsHistoryDrawer({ isOpen, onClose }: ToolsHistoryDrawerProps) {
  const [history, setHistory] = useState<ToolHistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isOpen) return
    async function loadHistory() {
      setLoading(true)
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/tools/history', { headers })
        const data = await res.json()
        if (data.success && Array.isArray(data.history)) {
          setHistory(data.history)
        }
      } catch (err) {
        console.error('Failed to load tool history:', err)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [isOpen])

  if (!isOpen) return null

  const handleDelete = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      await fetch(`/api/tools/history?id=${id}`, {
        method: 'DELETE',
        headers,
      })
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch (err) {
      console.error('Delete history item error:', err)
    }
  }

  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'all' || item.tool_type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                Asboblar Tarixi
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Hisob-kitoblar va tahlillar arxivi ({history.length})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tarix bo‘yicha qidirish..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'calculator', label: 'Kalkulyator' },
              { id: 'document_generation', label: 'Hujjatlar' },
              { id: 'risk_assessment', label: 'Risk' },
              { id: 'court_practice', label: 'Sud' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Hozircha saqlangan amallar mavjud emas</p>
            </div>
          ) : (
            filteredHistory.map(item => (
              <div
                key={item.id}
                className="group p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-1.5 text-xs shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 uppercase">
                    {item.tool_type}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('uz-UZ', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 dark:text-zinc-100 leading-snug">
                  {item.title}
                </h4>

                {item.summary && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {item.summary}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Saqlangan</span>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
