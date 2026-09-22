'use client'

import React, { useState } from 'react'
import {
  Clock,
  X,
  Search,
  Filter,
  Sparkles,
  Scale,
  Database,
  Building2,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface ActivityItem {
  id: string
  action: string
  title: string
  icon?: string
  xp: number
  timestamp: string
}

interface ActivityHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  activities: ActivityItem[]
}

export default function ActivityHistoryModal({
  isOpen,
  onClose,
  activities,
}: ActivityHistoryModalProps) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  if (!isOpen) return null

  const filtered = activities.filter(item => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.action.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (selectedFilter === 'all') return true
    if (selectedFilter === 'irac') return item.action.includes('irac')
    if (selectedFilter === 'case') return item.action.includes('case')
    if (selectedFilter === 'court') return item.action.includes('court')
    if (selectedFilter === 'doc') return item.action.includes('doc')
    if (selectedFilter === 'ai') return item.action.includes('ai')
    return true
  })

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0 bg-gray-50/70 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                {t('dashboardRecentActivity', 'Faoliyat tarixi')}
              </h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                Jami {activities.length} ta amaliyot qayd etilgan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-2.5 bg-white dark:bg-zinc-900 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder', 'Qidirish...')}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: t('filterAll', 'Barchasi') },
              { id: 'irac', label: 'IRAC' },
              { id: 'case', label: 'Kazuslar' },
              { id: 'court', label: 'Virtual Sud' },
              { id: 'doc', label: 'Hujjatlar' },
              { id: 'ai', label: 'AI' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-4 flex-1 divide-y divide-gray-100 dark:divide-zinc-800">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {t('noData', 'Faoliyat topilmadi')}
              </p>
            </div>
          ) : (
            filtered.map(act => (
              <div
                key={act.id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {act.icon || '📝'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      {new Date(act.timestamp).toLocaleString('uz-UZ', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex-shrink-0">
                  +{act.xp} XP
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
