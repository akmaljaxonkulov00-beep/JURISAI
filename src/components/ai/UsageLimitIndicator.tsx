'use client'

import { useEffect, useRef } from 'react'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import { Zap, AlertTriangle } from 'lucide-react'

interface UsageLimitIndicatorProps {
  /** Show only specific features (e.g. ['ai_chat', 'irac']) */
  features?: string[]
  /** Compact mode — single line per feature */
  compact?: boolean
  /** Show in card wrapper */
  showCard?: boolean
  /** Callback when limit is reached */
  onLimitReached?: (feature: string) => void
}

export default function UsageLimitIndicator({
  features,
  compact = false,
  showCard = true,
  onLimitReached,
}: UsageLimitIndicatorProps) {
  const {
    status,
    loading,
    error,
    getFeatureUsage,
    getRemainingText,
    getFeatureLabel,
    getPeriodText,
    getPeriodEndText,
    isLimitReached,
  } = useUsageLimits()
  const prevLimitRef = useRef<Set<string>>(new Set())

  // Notify parent of limit changes via useEffect (not inside render)
  useEffect(() => {
    if (!onLimitReached || !status?.features) return
    const allFeatures = features
      ? status.features.filter(f => features.includes(f.feature))
      : status.features
    for (const f of allFeatures) {
      if (f.limit !== -1 && f.remaining <= 0 && !prevLimitRef.current.has(f.feature)) {
        prevLimitRef.current.add(f.feature)
        onLimitReached(f.feature)
      }
    }
  }, [status, features, onLimitReached])

  if (loading) {
    return showCard ? (
      <div className="card-default rounded-2xl p-4">
        <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          Limitlar yuklanmoqda...
        </div>
      </div>
    ) : null
  }

  if (error || !status) {
    return null // Fail silently — don't break UI
  }

  // Filter features if specified
  const allFeatures = features
    ? status.features.filter(f => features.includes(f.feature))
    : status.features

  // Don't show if all features are unlimited
  const hasLimits = Array.isArray(allFeatures) && allFeatures.some(f => f.limit !== -1)
  if (!hasLimits) return null

  const content = (
    <div className={compact ? 'space-y-1' : 'space-y-3'}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
          <Zap size={12} className="inline mr-1" />
          Oylik limitlar
        </h4>
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 capitalize">
          {status.plan === 'free' ? 'Bepul' : status.plan === 'standart' ? 'Standart' : 'Pro'} tarif
        </span>
      </div>

      {allFeatures.map(f => {
        if (f.limit === -1) return null // Skip unlimited features in compact view

        const percent = f.limit > 0 ? Math.max(0, Math.min(100, (f.used / f.limit) * 100)) : 0
        const isNearLimit = percent >= 80
        const isAtLimit = f.remaining <= 0

        if (compact) {
          return (
            <div key={f.feature} className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-600 dark:text-zinc-400 truncate">{f.label}</span>
              <span
                className={`font-medium ml-2 ${
                  isAtLimit
                    ? 'text-red-500'
                    : isNearLimit
                      ? 'text-amber-500'
                      : 'text-gray-500 dark:text-zinc-400'
                }`}
              >
                {getRemainingText(f.feature)}
              </span>
            </div>
          )
        }

        return (
          <div key={f.feature} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                {f.label}
              </span>
              <div className="flex items-center gap-1">
                {isAtLimit && <AlertTriangle size={10} className="text-red-500" />}
                <span
                  className={`text-[11px] font-semibold ${
                    isAtLimit
                      ? 'text-red-500'
                      : isNearLimit
                        ? 'text-amber-500'
                        : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  {getRemainingText(f.feature)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500">
              <span>{getPeriodText(f.feature)}</span>
              {isAtLimit && <span>{getPeriodEndText(f.feature)}</span>}
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-blue-500'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )

  if (!showCard) return content

  return <div className="card-default rounded-2xl p-4">{content}</div>
}
