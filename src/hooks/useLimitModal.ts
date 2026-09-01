'use client'

import { useState, useCallback } from 'react'
import type { UsageResult } from '@/lib/usage-limits'

interface LimitModalState {
  open: boolean
  feature: string
  featureLabel: string
  result?: UsageResult
}

const FEATURE_LABELS: Record<string, string> = {
  ai_chat: "AI chat (huquqiy so'rov)",
  irac: 'IRAC tahlil',
  document_generate: 'Hujjat generator',
  document_analysis: 'Hujjat tahlili',
  virtual_court: 'Virtual sud',
  decision_tree: 'Qarorlar daraxti',
  speech_stt: 'Ovozli yozuv',
  scenario: 'Senariy generator',
}

/**
 * Hook: AI so'rovlarida limit tugaganini aniqlab, LimitExceededModal'ni boshqaradi.
 *
 * Usage:
 * ```tsx
 * const { modalProps, checkLimitError } = useLimitModal()
 *
 * // API javobida:
 * if (res.status === 429) {
 *   const data = await res.json()
 *   checkLimitError(data) // modal ochiladi
 * }
 *
 * return <LimitExceededModal {...modalProps} onUpgrade={() => router.push('/pricing')} />
 * ```
 */
export function useLimitModal() {
  const [modal, setModal] = useState<LimitModalState>({
    open: false,
    feature: '',
    featureLabel: '',
  })

  const checkLimitError = useCallback((data: Record<string, unknown>) => {
    if (data.error === 'limit_reached' && data.usage) {
      const usage = data.usage as UsageResult
      setModal({
        open: true,
        feature: usage.feature,
        featureLabel: FEATURE_LABELS[usage.feature] || usage.feature,
        result: usage,
      })
      return true
    }
    return false
  }, [])

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, open: false }))
  }, [])

  return {
    modalProps: {
      open: modal.open,
      onClose: closeModal,
      feature: modal.feature,
      featureLabel: modal.featureLabel,
      result: modal.result,
    },
    checkLimitError,
  }
}
