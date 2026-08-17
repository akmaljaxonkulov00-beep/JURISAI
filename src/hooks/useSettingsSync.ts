'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useSettingsSync.ts — Supabase Realtime + poll fallback
// Admin panelidagi o'zgarishlar milisoniyalarda foydalanuvchiga yetadi
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import {
  getPublicSettings,
  getPricingPlans,
  getPaymentRequests,
  getAnnouncements,
  refreshAllSettings,
  updateUserSubscription,
  type SiteSettings,
  type PricingPlan,
  type PaymentRequest,
} from '@/lib/settings-sync'

const FALLBACK_POLL_MS = 60_000 // Fallback poll har 60 sekund (agar Realtime uzulsa)

interface SettingsState {
  settings: SiteSettings | null
  pricingPlans: PricingPlan[]
  paymentRequests: PaymentRequest[]
  announcements: { message: string; type: 'info' | 'warning' | 'success'; active: boolean }[]
  loading: boolean
  lastSynced: Date | null
  refresh: () => Promise<void>
}

// ── Sync user session with latest payment/subscription data ──
function syncUserSessionWithPayments(payments: PaymentRequest[]) {
  try {
    const sessionData =
      sessionStorage.getItem('jurisai_user') || sessionStorage.getItem('auth_user')
    if (!sessionData) return
    const user = JSON.parse(sessionData)
    if (!user?.email) return

    const userPayments = payments.filter(
      p =>
        p.status === 'approved' &&
        (p.userEmail === user.email || p.userId === user.id || p.userId === user.email)
    )
    if (userPayments.length === 0) return

    const latestApproved = userPayments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]

    const totalApprovedBalance = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const previousBalance = Number(user.balance || 0)

    if (
      totalApprovedBalance > previousBalance ||
      !user.subscription_plan ||
      user.subscription_plan === 'free'
    ) {
      const plan = latestApproved.plan === 'pro' ? 'pro' : 'standart'
      const updatedUser = {
        ...user,
        subscription_plan: plan,
        subscription_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        balance: totalApprovedBalance,
      }
      sessionStorage.setItem('jurisai_user', JSON.stringify(updatedUser))
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser))
      localStorage.setItem('jurisai_user', JSON.stringify(updatedUser))
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
    }
  } catch {
    /* silent */
  }
}

type Announcement = { message: string; type: 'info' | 'warning' | 'success'; active: boolean }

// ── Re-fetch a single data source ──
async function fetchOne(source: string): Promise<unknown> {
  switch (source) {
    case 'settings':
      return getPublicSettings()
    case 'pricing':
      return getPricingPlans()
    case 'payments':
      return getPaymentRequests()
    case 'announcements':
      return getAnnouncements()
    default:
      return null
  }
}

export function useSettingsSync(): SettingsState {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const mountedRef = useRef(true)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelsRef = useRef<{ unsubscribe: () => void }[]>([])

  // ── Initial load (all sources) ──
  const loadAll = useCallback(async () => {
    if (!mountedRef.current) return
    try {
      const [s, p, pr, a] = await Promise.allSettled([
        getPublicSettings(),
        getPricingPlans(),
        getPaymentRequests(),
        getAnnouncements(),
      ])
      if (!mountedRef.current) return
      if (s.status === 'fulfilled' && s.value) setSettings(s.value)
      if (p.status === 'fulfilled') setPricingPlans(p.value)
      if (pr.status === 'fulfilled') {
        setPaymentRequests(pr.value)
        syncUserSessionWithPayments(pr.value)
      }
      if (a.status === 'fulfilled') setAnnouncements(a.value)
      setLastSynced(new Date())
    } catch (err) {
      console.warn('[useSettingsSync] Load error:', err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await refreshAllSettings()
    await loadAll()
  }, [loadAll])

  // ── Partial update (single source, called by Realtime) ──
  const handleRealtimeUpdate = useCallback(async (source: string) => {
    if (!mountedRef.current) return
    try {
      const data = await fetchOne(source)
      if (!mountedRef.current) return
      switch (source) {
        case 'settings':
          if (data) setSettings(data as SiteSettings)
          break
        case 'pricing':
          setPricingPlans(data as PricingPlan[])
          break
        case 'payments': {
          const payments = data as PaymentRequest[]
          setPaymentRequests(payments)
          syncUserSessionWithPayments(payments)
          break
        }
        case 'announcements':
          setAnnouncements((data || []) as Announcement[])
          break
      }
      setLastSynced(new Date())
    } catch {
      /* silent */
    }
  }, [])

  // ── Subscribe to Supabase Realtime channels ──
  useEffect(() => {
    mountedRef.current = true

    // 1. Initial fetch
    loadAll()

    // 2. Supabase Realtime subscriptions (instant!)
    const tables = [
      { name: 'payments', key: 'payments' },
      { name: 'site_settings', key: 'settings' },
      { name: 'pricing_plans', key: 'pricing' },
      { name: 'announcements', key: 'announcements' },
    ]

    const newChannels: { unsubscribe: () => void }[] = []
    const ts = Date.now()

    for (const table of tables) {
      const channelName = `jurisai-${table.name}-${ts}-${Math.random().toString(36).slice(2, 6)}`
      try {
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', { event: '*', schema: 'public', table: table.name }, () => {
            handleRealtimeUpdate(table.key)
          })
          .subscribe((status: string) => {
            if (status === 'CHANNEL_ERROR') {
              // Realtime failed — fallback to polling handles this
            }
          })

        newChannels.push({ unsubscribe: () => supabase.removeChannel(channel) })
      } catch {
        // Channel creation failed — polling fallback will handle
      }
    }

    channelsRef.current = newChannels

    // 3. Fallback polling (60s) — catches anything Realtime missed
    pollTimerRef.current = setTimeout(function poll() {
      if (!mountedRef.current) return
      loadAll()
      pollTimerRef.current = setTimeout(poll, FALLBACK_POLL_MS)
    }, FALLBACK_POLL_MS)

    // ── Cleanup ──
    return () => {
      mountedRef.current = false
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      for (const ch of channelsRef.current) {
        ch.unsubscribe()
      }
      channelsRef.current = []
    }
  }, [loadAll, handleRealtimeUpdate])

  return {
    settings,
    pricingPlans,
    paymentRequests,
    announcements,
    loading,
    lastSynced,
    refresh,
  }
}
