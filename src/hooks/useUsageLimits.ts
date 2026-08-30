'use client'

import { useState, useEffect, useCallback } from 'react'

export interface FeatureUsage {
  feature: string
  label: string
  used: number
  limit: number // -1 = unlimited
  remaining: number // -1 = unlimited
}

export interface UsageStatus {
  plan: string
  features: FeatureUsage[]
}

const FEATURE_LABELS: Record<string, string> = {
  ai_chat: "AI chat so'rovi",
  irac: 'IRAC tahlil',
  document_generate: 'Hujjat generator',
  document_analysis: 'Hujjat tahlili',
  virtual_court: 'Virtual sud',
  decision_tree: 'Qarorlar daraxti',
  speech_stt: 'Ovozli yozuv (STT)',
  scenario: 'Senariy generator',
}

/**
 * Hook: current user's usage limits status.
 * Returns remaining counts per feature + plan info.
 * Auto-refreshes on mount and can be manually refreshed.
 */
export function useUsageLimits() {
  const [status, setStatus] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/usage-status', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const result = await res.json()
      if (result.success && result.data) {
        setStatus(result.data)
      } else {
        setError(result.error || 'Failed to load usage status')
      }
    } catch (e) {
      console.warn('[useUsageLimits] fetch error:', e)
      setError('Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const getFeatureUsage = useCallback(
    (feature: string): FeatureUsage | undefined => {
      return status?.features?.find(f => f.feature === feature)
    },
    [status]
  )

  const isLimitReached = useCallback(
    (feature: string): boolean => {
      const f = getFeatureUsage(feature)
      if (!f) return false
      if (f.limit === -1) return false // unlimited
      return f.remaining <= 0
    },
    [getFeatureUsage]
  )

  const getRemainingText = useCallback(
    (feature: string): string => {
      const f = getFeatureUsage(feature)
      if (!f) return ''
      if (f.limit === -1) return 'Cheksiz'
      if (f.remaining <= 0) return 'Limit tugadi'
      return `${f.remaining} / ${f.limit}`
    },
    [getFeatureUsage]
  )

  const getFeatureLabel = useCallback((feature: string): string => {
    return FEATURE_LABELS[feature] || feature
  }, [])

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
    getFeatureUsage,
    isLimitReached,
    getRemainingText,
    getFeatureLabel,
  }
}
