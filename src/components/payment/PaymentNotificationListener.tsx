'use client'

import { useEffect, useRef } from 'react'
import { useSettingsSync } from '@/hooks/useSettingsSync'
import { useToast } from '@/components/ui/Toast'

/**
 * PaymentNotificationListener — A renderless component that monitors payment
 * status changes via the 15-second polling cycle and shows toast notifications
 * when a payment transitions from `pending` → `approved`.
 *
 * Mount this once near the root of the app (inside ToastProvider).
 */
export function usePaymentNotifications() {
  const sync = useSettingsSync()
  const { addToast } = useToast()

  // Keep previous status map so we can diff on each poll
  const prevStatusMap = useRef<Record<string, string>>({})
  // Track which IDs we already notified about to avoid duplicate toasts
  const notifiedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!sync.paymentRequests || sync.paymentRequests.length === 0) return

    // Get current user email from stored session
    let currentUserEmail = ''
    try {
      const stored = sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        currentUserEmail = user?.email || ''
      }
    } catch {
      /* silent */
    }

    if (!currentUserEmail) return

    // Filter to only this user's payments
    const userPayments = sync.paymentRequests.filter(
      (p: { userEmail?: string; userId?: string }) =>
        p.userEmail === currentUserEmail || p.userId === currentUserEmail
    )

    for (const payment of userPayments) {
      const id = payment.id
      const newStatus = (payment.status || '').toLowerCase()
      const oldStatus = prevStatusMap.current[id] || ''
      const alreadyNotified = notifiedIds.current.has(id)

      // Detect transition: pending → approved, and not yet notified
      if (oldStatus === 'pending' && newStatus === 'approved' && !alreadyNotified) {
        notifiedIds.current.add(id)

        const planName = payment.plan === 'pro' ? 'Pro' : 'Standart'
        const amount = (payment.amount || 0).toLocaleString()

        addToast({
          title: "✅ To'lov tasdiqlandi!",
          description: `${planName} tarifi — ${amount} UZS. Barcha imkoniyatlar ochildi.`,
          variant: 'success',
          duration: 8000,
        })
      }

      // Save current status for next diff
      prevStatusMap.current[id] = newStatus
    }

    // Prevent unbounded growth in long sessions
    if (notifiedIds.current.size > 100) {
      notifiedIds.current.clear()
    }
  }, [sync.paymentRequests, addToast])
}

/**
 * Renderless component — mounts the payment notification hook.
 * Place inside ToastProvider once at the root level.
 */
export function PaymentNotificationListener() {
  usePaymentNotifications()
  return null
}
