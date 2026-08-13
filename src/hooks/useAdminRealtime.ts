'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useAdminRealtime.ts — Admin panel uchun real-time WebSocket ulanish
// Supabase Realtime subscriptions orqali to'lov, foydalanuvchi va
// monitoring o'zgarishlarini polling o'rniga instant yangilash
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { type PaymentRequest } from '@/lib/settings-sync'

const FALLBACK_POLL_MS = 30_000 // 30 sekund — faol yangilanish

interface LoginActivity {
  userId: string
  userEmail: string
  date: string
  method: 'email' | 'google'
}

interface TokenUsage {
  userId: string
  userEmail: string
  userName: string
  tokens: number
  date: string
  action: string
}

interface AdminRealtimeState {
  paymentRequests: PaymentRequest[]
  allUsers: any[]
  loginActivities: LoginActivity[]
  tokenUsages: TokenUsage[]
  consultations: any[] // Maslahat/mentorlik so'rovlari
  newPaymentsCount: number // Yangi kelgan to'lovlar soni
  newUsersCount: number // Yangi foydalanuvchilar soni
  newConsultationsCount: number // Yangi maslahat so'rovlari soni
  loading: boolean
  lastSynced: Date | null
  refreshAll: () => Promise<void>
  refreshPayments: () => Promise<void>
  refreshUsers: () => Promise<void>
  refreshConsultations: () => Promise<void>
}

// ── Admin real-time hook ──
export function useAdminRealtime(): AdminRealtimeState {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([])
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([])
  const [newPaymentsCount, setNewPaymentsCount] = useState(0)
  const [newUsersCount, setNewUsersCount] = useState(0)
  const [newConsultationsCount, setNewConsultationsCount] = useState(0)
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const mountedRef = useRef(true)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPaymentIdsRef = useRef(new Set<string>())
  const prevConsultationIdsRef = useRef(new Set<string>())

  // ── Load ALL data from Supabase ──
  const fetchAllData = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return
    if (showLoading) setLoading(true)
    try {
      const res = await fetch('/api/admin/analytics?days=90&type=all', {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const result = await res.json()
      if (!mountedRef.current) return

      const d = result.data || {}
      const prevIds = prevPaymentIdsRef.current

      // ── Payment requests ──
      if (d.paymentRequests && Array.isArray(d.paymentRequests)) {
        const mapped = d.paymentRequests.map((p: any) => ({
          id: p.id,
          userId: p.user_id || p.userId || '',
          userEmail: p.user_email || p.userEmail || '',
          userName: p.user_name || p.userName || '',
          plan: p.plan || '',
          amount: p.amount || 0,
          receiptImage: p.receipt_image || p.receiptImage || '',
          status: p.status || 'pending',
          createdAt: p.created_at || p.createdAt || '',
        })) as PaymentRequest[]

        // Count new payments since last fetch
        const currentIds = new Set(mapped.map(p => p.id))
        const newIds = [...currentIds].filter(id => !prevIds.has(id))
        const trulyNewPayments = mapped.filter(p => newIds.includes(p.id) && p.status === 'pending')
        if (trulyNewPayments.length > 0) {
          setNewPaymentsCount(trulyNewPayments.length)
        }
        prevPaymentIdsRef.current = currentIds

        setPaymentRequests(mapped)
        // Cache to localStorage for offline backup
        try {
          localStorage.setItem('admin_payment_requests', JSON.stringify(mapped))
        } catch {}
      }

      // ── Users ──
      if (d.users && Array.isArray(d.users) && d.users.length > 0) {
        const mappedUsers = d.users.map((u: any) => ({
          ...u,
          id: u.id || u.user_id || u.uid,
          uid: u.uid || u.id || u.user_id,
          name: u.name || u.user_name || u.display_name || '',
          email: u.email || u.user_email || '',
          role: u.role || u.user_role || 'USER',
          subscription_plan: u.subscription_plan || u.plan || 'free',
          subscription_expires_at: u.subscription_expires_at || u.expires_at || '',
          last_login: u.last_login || u.created_at || '',
          blocked: u.blocked || false,
          balance: u.balance || 0,
          created_at: u.created_at || '',
          provider: u.provider || u.app_metadata?.provider || 'email',
        }))
        setAllUsers(mappedUsers)
        try {
          localStorage.setItem('admin_users', JSON.stringify(mappedUsers))
        } catch {}
      } else {
        // Fallback: load registered users from localStorage (set during Firebase login)
        try {
          const stored = localStorage.getItem('registered_users')
          if (stored && stored !== 'undefined') {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAllUsers(parsed)
            }
          } else {
            // Try admin_users cache
            const cached = localStorage.getItem('admin_users')
            if (cached && cached !== 'undefined') {
              const parsed = JSON.parse(cached)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAllUsers(parsed)
              }
            }
          }
        } catch {}
      }

      // ── Login activities ──
      if (d.loginActivities && Array.isArray(d.loginActivities)) {
        setLoginActivities(
          d.loginActivities.map((l: any) => ({
            userId: l.user_id || l.email,
            userEmail: l.email,
            date: l.created_at,
            method: l.method || 'email',
          }))
        )
      }

      // ── Token usages ──
      if (d.tokenUsages && Array.isArray(d.tokenUsages)) {
        setTokenUsages(
          d.tokenUsages.map((t: any) => ({
            userId: t.user_id || t.email,
            userEmail: t.email,
            userName: t.name || '',
            tokens: t.tokens || 0,
            date: t.created_at,
            action: t.action || 'unknown',
          }))
        )
      }

      // ── Maslahat/mentorlik so'rovlari ──
      try {
        const consRes = await fetch('/api/community/consultations', { cache: 'no-cache' })
        const consJson = await consRes.json()
        if (consJson.success && Array.isArray(consJson.data)) {
          const mapped: any[] = consJson.data.map((c: any) => ({
            id: c.id,
            expert_id: c.expert_id,
            expert_name: c.expert_name,
            user_id: c.user_id,
            user_name: c.user_name,
            user_email: c.user_email,
            type: c.type,
            message: c.message,
            status: c.status || 'pending',
            created_at: c.created_at,
          }))
          // Yangi (pending) so'rovlar soni
          const prevIds = prevConsultationIdsRef.current
          const currentIds = new Set(mapped.map(c => c.id))
          const newIds = [...currentIds].filter(id => !prevIds.has(id))
          const trulyNew = mapped.filter(c => newIds.includes(c.id) && c.status === 'pending')
          if (trulyNew.length > 0) {
            setNewConsultationsCount(prev => prev + trulyNew.length)
          }
          prevConsultationIdsRef.current = currentIds
          setConsultations(mapped)
        }
      } catch {}

      setLastSynced(new Date())
    } catch (err) {
      // Fallback: load from localStorage cache
      try {
        const cachedPayments = localStorage.getItem('admin_payment_requests')
        if (cachedPayments) setPaymentRequests(JSON.parse(cachedPayments))
        const cachedUsers = localStorage.getItem('admin_users')
        if (cachedUsers) setAllUsers(JSON.parse(cachedUsers))
      } catch {}
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  // ── Refresh single source (by table name) ──
  const refreshSource = useCallback(async (source: string) => {
    if (!mountedRef.current) return
    try {
      const keyMap: Record<string, string> = {
        payments: 'paymentRequests',
        usage_logs: 'tokenUsages',
        login_activity: 'loginActivities',
        site_settings: 'settings',
        pricing_plans: 'pricing',
      }
      const type = keyMap[source] || source
      const res = await fetch(`/api/admin/analytics?days=90&type=${type}`, {
        cache: 'no-cache',
      })
      const result = await res.json()
      if (!mountedRef.current || !result.success) return
      const d = result.data || {}

      if (source === 'payments' && d.paymentRequests) {
        const mapped = d.paymentRequests.map((p: any) => ({
          id: p.id,
          userId: p.user_id || p.userId || '',
          userEmail: p.user_email || p.userEmail || '',
          userName: p.user_name || p.userName || '',
          plan: p.plan || '',
          amount: p.amount || 0,
          receiptImage: p.receipt_image || p.receiptImage || '',
          status: p.status || 'pending',
          createdAt: p.created_at || p.createdAt || '',
        }))
        setPaymentRequests(prev => {
          // Merge: keep existing data + new data, dedup by id
          const merged = new Map(prev.map(p => [p.id, p]))
          for (const p of mapped) merged.set(p.id, p)
          return Array.from(merged.values())
        })
      }
      if (source === 'usage_logs' && d.tokenUsages) {
        setTokenUsages(
          d.tokenUsages.map((t: any) => ({
            userId: t.user_id || t.email,
            userEmail: t.email,
            userName: t.name || '',
            tokens: t.tokens || 0,
            date: t.created_at,
            action: t.action || 'unknown',
          }))
        )
      }
      if (source === 'login_activity' && d.loginActivities) {
        setLoginActivities(
          d.loginActivities.map((l: any) => ({
            userId: l.user_id || l.email,
            userEmail: l.email,
            date: l.created_at,
            method: l.method || 'email',
          }))
        )
      }

      // Count new pending payments
      if (source === 'payments' && d.paymentRequests) {
        const pending = d.paymentRequests.filter((p: any) => p.status === 'pending')
        if (pending.length > 0) {
          setNewPaymentsCount(prev => prev + pending.length)
        }
      }

      setLastSynced(new Date())
    } catch {
      /* silent */
    }
  }, [])

  // ── Public refresh methods ──
  const refreshPayments = useCallback(async () => {
    setNewPaymentsCount(0)
    await refreshSource('payments')
  }, [refreshSource])

  const refreshUsers = useCallback(async () => {
    await fetchAllData(false)
    setNewUsersCount(0)
  }, [fetchAllData])

  const refreshConsultations = useCallback(async () => {
    setNewConsultationsCount(0)
    await fetchAllData(false)
  }, [fetchAllData])

  const refreshAll = useCallback(async () => {
    await fetchAllData(true)
    setNewPaymentsCount(0)
    setNewUsersCount(0)
    setNewConsultationsCount(0)
  }, [fetchAllData])

  // ── Initial load + periodic polling ──
  // NOTE: Realtime WebSocket subscriptions are intentionally NOT used here
  // because the Supabase Realtime client enters an infinite reconnection
  // loop when the Supabase URL is unreachable (ERR_NAME_NOT_RESOLVED).
  // Polling is silence in the console, reliable, and sufficient for admin.
  useEffect(() => {
    mountedRef.current = true

    // 1. Initial fetch — all data
    fetchAllData(true)

    // 2. Periodic polling (30s) — primary data source
    pollTimerRef.current = setTimeout(function poll() {
      if (!mountedRef.current) return
      fetchAllData(false)
      pollTimerRef.current = setTimeout(poll, FALLBACK_POLL_MS)
    }, FALLBACK_POLL_MS)

    // ── Cleanup ──
    return () => {
      mountedRef.current = false
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [fetchAllData, refreshSource])

  return {
    paymentRequests,
    allUsers,
    loginActivities,
    tokenUsages,
    consultations,
    newPaymentsCount,
    newUsersCount,
    newConsultationsCount,
    loading,
    lastSynced,
    refreshAll,
    refreshPayments,
    refreshUsers,
    refreshConsultations,
  }
}
