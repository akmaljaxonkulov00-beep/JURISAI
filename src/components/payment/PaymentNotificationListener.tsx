'use client'

import { useEffect, useRef } from 'react'
import { useSettingsSync } from '@/hooks/useSettingsSync'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase-client'

/**
 * PaymentNotificationListener — A renderless component that monitors payment
 * status changes via Realtime & polling cycles, and shows toast notifications
 * when a payment is approved or new payment notification arrives.
 */
export function usePaymentNotifications() {
  const sync = useSettingsSync()
  const { addToast } = useToast()
  const { user, refreshUser } = useAuth()

  // Keep previous status map so we can diff on each poll
  const prevStatusMap = useRef<Record<string, string>>({})
  // Track which IDs we already notified about to avoid duplicate toasts
  const notifiedIds = useRef<Set<string>>(new Set())

  // 1. Direct Supabase Realtime subscription on user_notifications
  useEffect(() => {
    if (!user?.id || !supabase) return

    const channel = supabase
      .channel(`user_notif_toast_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const notif = payload.new as {
            id?: string
            category?: string
            title?: string
            message?: string
            type?: string
          } | null

          if (notif && notif.category === 'payment') {
            if (notif.id && notifiedIds.current.has(notif.id)) return
            if (notif.id) notifiedIds.current.add(notif.id)

            addToast({
              title: notif.title || "To'lov tasdiqlandi ✅",
              description: notif.message || "To'lov muvaffaqiyatli qabul qilindi.",
              variant: notif.type === 'error' ? 'destructive' : 'success',
              duration: 9000,
            })

            refreshUser().catch(() => {})
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('juristiv_subscription_updated'))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, addToast, refreshUser])

  // 2. Poll & sync.paymentRequests transition listener
  useEffect(() => {
    if (!sync.paymentRequests || sync.paymentRequests.length === 0) return

    const currentUserEmail = (user?.email || '').toLowerCase().trim()
    const currentUserId = user?.id || ''

    if (!currentUserEmail && !currentUserId) return

    // Filter to only this user's payments
    const userPayments = (Array.isArray(sync?.paymentRequests) ? sync.paymentRequests : []).filter(
      (p: { userEmail?: string; userId?: string }) => {
        const pEmail = (p.userEmail || '').toLowerCase().trim()
        const pId = p.userId || ''
        return (
          (currentUserEmail && pEmail === currentUserEmail) ||
          (currentUserId && pId === currentUserId)
        )
      }
    )

    for (const payment of userPayments) {
      const id = payment.id
      const newStatus = (payment.status || '').toLowerCase()
      const oldStatus = prevStatusMap.current[id] || ''
      const alreadyNotified = notifiedIds.current.has(id)

      // Detect transition: pending → approved
      if (oldStatus === 'pending' && newStatus === 'approved' && !alreadyNotified) {
        notifiedIds.current.add(id)

        const planKey = (payment.plan || '').toLowerCase()
        const planName =
          planKey === 'pro'
            ? 'Professional (Pro)'
            : planKey === 'standart'
              ? 'Standart'
              : 'Premium'
        const amount = (payment.amount || 0).toLocaleString()

        addToast({
          title: "✅ To'lov tasdiqlandi!",
          description: `"${planName}" tarifi faollashtirildi (${amount} UZS). Barcha imkoniyatlar ochildi!`,
          variant: 'success',
          duration: 9000,
        })

        refreshUser().catch(() => {})
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('juristiv_subscription_updated'))
        }
      }

      // Save current status for next diff
      prevStatusMap.current[id] = newStatus
    }

    if (notifiedIds.current.size > 100) {
      notifiedIds.current.clear()
    }
  }, [sync.paymentRequests, user, addToast, refreshUser])
}

/**
 * Renderless component — mounts the payment notification hook.
 * Place inside ToastProvider once at the root level.
 */
export function PaymentNotificationListener() {
  usePaymentNotifications()
  return null
}
