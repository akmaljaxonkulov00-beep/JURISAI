'use client'

import React, { useState } from 'react'
import {
  FileCheck,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  FileQuestion,
  Sparkles,
} from 'lucide-react'

interface EvidencePanelProps {
  evidenceState: Record<string, boolean>
  onToggleEvidence: (name: string) => void
  onAddEvidence: (name: string) => void
  onRemoveEvidence: (name: string) => void
}

const DEFAULT_EVIDENCES = [
  'Yozma shartnoma va qo‘shimcha kelishuvlar',
  'To‘lov topshirig‘i yoki kvitansiya',
  'Yozishmalar (Telegram, Email, SMS)',
  'Bajarilgan ishlar dalolatnomasi (Akt)',
  'Rasmiy talabnoma (Pretenziya) va uning javobi',
  'Guvohlar ko‘rsatmasi',
  'Ekspertiza xulosasi',
]

export default function EvidencePanel({
  evidenceState = {},
  onToggleEvidence,
  onAddEvidence,
  onRemoveEvidence,
}: EvidencePanelProps) {
  const [newEvidenceName, setNewEvidenceName] = useState('')

  const allEvidences = React.useMemo(() => {
    const list = new Set([...DEFAULT_EVIDENCES, ...Object.keys(evidenceState)])
    return Array.from(list)
  }, [evidenceState])

  const checkedCount = allEvidences.filter(e => evidenceState[e]).length
  const totalCount = allEvidences.length
  const readinessPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvidenceName.trim()) return
    onAddEvidence(newEvidenceName.trim())
    setNewEvidenceName('')
  }

  return (
    <div className="p-4 space-y-4">
      {/* Evidence Readiness Score Meter */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-indigo-600" /> Dalillar Tayyorlik Indeksi
          </span>
          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {readinessPercent}%
          </span>
        </div>

        <div className="h-2 w-full bg-indigo-200/50 dark:bg-indigo-900/50 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              readinessPercent >= 70
                ? 'bg-emerald-500'
                : readinessPercent >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
            }`}
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-indigo-700/80 dark:text-indigo-300/80">
          <span>Mavjud: {checkedCount} ta</span>
          <span>Talab etiladi: {totalCount} ta</span>
        </div>
      </div>

      {/* Add Custom Evidence Form */}
      <form onSubmit={handleAdd} className="flex gap-1.5">
        <input
          type="text"
          value={newEvidenceName}
          onChange={e => setNewEvidenceName(e.target.value)}
          placeholder="Yangi dalil yoki hujjat nomi..."
          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!newEvidenceName.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Evidence Checklist */}
      <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
        {allEvidences.map((ev, idx) => {
          const isChecked = Boolean(evidenceState[ev])
          return (
            <div
              key={idx}
              className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isChecked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
                  : 'bg-white dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-800 hover:border-blue-200'
              }`}
            >
              <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleEvidence(ev)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 flex-shrink-0"
                />
                <span
                  className={`text-xs select-none truncate ${
                    isChecked
                      ? 'text-emerald-900 dark:text-emerald-300 font-semibold'
                      : 'text-slate-700 dark:text-zinc-300 font-medium'
                  }`}
                  title={ev}
                >
                  {ev}
                </span>
              </label>

              <button
                onClick={() => onRemoveEvidence(ev)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity ml-1"
                title="Oʻchirish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {readinessPercent < 50 && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            Dalillar kamligi sababli sudda yoki muzokarada talablarni isbotlash xavfi yuqori.
          </span>
        </div>
      )}
    </div>
  )
}
