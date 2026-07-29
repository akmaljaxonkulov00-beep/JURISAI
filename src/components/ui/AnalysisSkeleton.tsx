'use client'

import React from 'react'

type SkeletonVariant = 'card' | 'list' | 'text' | 'chart' | 'table' | 'inline'

interface AnalysisSkeletonProps {
  variant?: SkeletonVariant
  count?: number
  className?: string
  label?: string
}

/**
 * Loading skeleton for AI analysis features.
 * Variants:
 *   - card: 1 large card with title + 3 content lines (for analysis results)
 *   - list: N rows with icon + 2 text lines (for search results, recommendations)
 *   - text: 4-5 lines of pulsing text (for chat responses, AI answers)
 *   - chart: Bar chart shape (for statistics, progress bars)
 *   - table: Row with 3 columns (for data tables)
 *   - inline: Single line (for buttons, small placeholders)
 */
export function AnalysisSkeleton({
  variant = 'card',
  count = 1,
  className = '',
  label,
}: AnalysisSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  const renderItem = (key: number) => {
    switch (variant) {
      case 'card':
        return (
          <div
            key={key}
            className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 ${className}`}
          >
            {/* Icon placeholder */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-1/3 mt-1.5 animate-pulse" />
              </div>
            </div>
            {/* Content lines */}
            <div className="space-y-2.5">
              <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
              <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-4/6 animate-pulse" />
            </div>
            {/* Progress bar placeholder */}
            <div className="mt-4 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
        )

      case 'list':
        return (
          <div key={key} className={`flex items-center gap-3 p-3 ${className}`}>
            <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 animate-pulse" />
              <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded w-1/2 mt-1.5 animate-pulse" />
            </div>
            <div className="w-16 h-5 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse flex-shrink-0" />
          </div>
        )

      case 'text':
        return (
          <div key={key} className={`space-y-2 ${className}`}>
            <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded w-full animate-pulse" />
            <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded w-11/12 animate-pulse" />
            <div className="h-3.5 bg-gray-100 dark:bg-zinc-800 rounded w-4/5 animate-pulse" />
            <div className="h-3.5 bg-gray-100 dark:bg-zinc-800 rounded w-3/5 animate-pulse" />
            {count === 1 && (
              <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-2/5 mt-1 animate-pulse" />
            )}
          </div>
        )

      case 'chart':
        return (
          <div key={key} className={`flex items-end gap-1.5 h-24 ${className}`}>
            {[40, 65, 45, 80, 55, 90, 60, 75, 50, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-t animate-pulse"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )

      case 'table':
        return (
          <div
            key={key}
            className={`flex items-center gap-3 p-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 ${className}`}
          >
            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-16 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded flex-1 animate-pulse" />
            <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-20 animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        )

      case 'inline':
        return (
          <div key={key} className={`flex items-center gap-2 ${className}`}>
            <div className="w-4 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-24 animate-pulse" />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div role="status" aria-label={label || 'Yuklanmoqda'}>
      {items.map(renderItem)}
      <span className="sr-only">{label || 'Yuklanmoqda...'}</span>
    </div>
  )
}
