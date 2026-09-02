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

// API javoblaridagi xom qatorlar (any o'rniga)
interface AdminUserRow {
  id?: string
  user_id?: string
  uid?: string
  name?: string
  user_name?: string
  display_name?: string
  email?: string
  user_email?: string
  role?: string
  user_role?: string
  subscription_plan?: string
  plan?: string
  subscription_expires_at?: string
  expires_at?: string
  last_login?: string
  created_at?: string
  blocked?: boolean
  balance?: number
  provider?: string
  app_metadata?: { provider?: string }
  [key: string]: unknown
}

interface LoginRow {
  user_id?: string
  email?: string
  created_at?: string
  method?: string
  [key: string]: unknown
}

interface TokenRow {
  user_id?: string
  email?: string
  name?: string
  tokens?: number
  created_at?: string
  action?: string
  [key: string]: unknown
}

interface ConsultationRow {
  id: string
  expert_id?: string
  expert_name?: string
  user_id?: string
  user_name?: string
  user_email?: string
  type?: string
  message?: string
  status?: string
  created_at?: string
  [key: string]: unknown
}

interface PaymentRow {
  id?: string
  user_id?: string
  user_email?: string
  user_name?: string
  plan?: string
  amount?: number
  receipt_image?: string
  status?: string
  created_at?: string
  [key: string]: unknown
}

interface AdminRealtimeState {
  paymentRequests: PaymentRequest[]
  allUsers: AdminUserRow[]
  loginActivities: LoginActivity[]
  tokenUsages: TokenUsage[]
  consultations: ConsultationRow[] // Maslahat/mentorlik so'rovlari
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
  const [allUsers, setAllUsers] = useState<AdminUserRow[]>([])
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([])
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([])
  const [newPaymentsCount, setNewPaymentsCount] = useState(0)
  const [newUsersCount, setNewUsersCount] = useState(0)
  const [newConsultationsCount, setNewConsultationsCount] = useState(0)
  const [consultations, setConsultations] = useState<ConsultationRow[]>([])
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
        const mapped = d.paymentRequests.map((p: PaymentRow) => ({
          id: p.id || '',
          userId: p.user_id || '',
          userEmail: p.user_email || '',
          userName: p.user_name || '',
          plan: p.plan || '',
          amount: p.amount || 0,
          receiptImage: p.receipt_image || '',
          status: p.status || 'pending',
          createdAt: p.created_at || '',
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
      }

      // ── Users ──
      if (d.users && Array.isArray(d.users) && d.users.length > 0) {
        const mappedUsers = d.users.map((u: AdminUserRow) => ({
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
      } else {
        // No users from API — set empty (DB is source of truth)
        setAllUsers([])
      }

      // ── Login activities ──
      if (d.loginActivities && Array.isArray(d.loginActivities)) {
        setLoginActivities(
          d.loginActivities.map((l: LoginRow) => ({
            userId: l.user_id || l.email || '',
            userEmail: l.email || '',
            date: l.created_at || '',
            method: (l.method as LoginActivity['method']) || 'email',
          }))
        )
      }

      // ── Token usages ──
      if (d.tokenUsages && Array.isArray(d.tokenUsages)) {
        setTokenUsages(
          d.tokenUsages.map((t: TokenRow) => ({
            userId: t.user_id || t.email || '',
            userEmail: t.email || '',
            userName: t.name || '',
            tokens: t.tokens || 0,
            date: t.created_at || '',
            action: t.action || 'unknown',
          }))
        )
      }

      // ── Maslahat/mentorlik so'rovlari ──
      try {
        const consRes = await fetch('/api/community/consultations', { cache: 'no-cache' })
        const consJson = await consRes.json()
        if (consJson.success && Array.isArray(consJson.data)) {
          const mapped: ConsultationRow[] = consJson.data.map((c: ConsultationRow) => ({
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
    } catch {
      // API failed — keep existing state (DB is source of truth, no localStorage fallback)
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
        const mapped = d.paymentRequests.map((p: PaymentRow) => ({
          id: p.id || '',
          userId: p.user_id || '',
          userEmail: p.user_email || '',
          userName: p.user_name || '',
          plan: p.plan || '',
          amount: p.amount || 0,
          receiptImage: p.receipt_image || '',
          status: p.status || 'pending',
          createdAt: p.created_at || '',
        }))
        setPaymentRequests(prev => {
          // Merge: keep existing data + new data, dedup by id
          const merged = new Map(prev.map(p => [p.id || '', p]))
          for (const p of mapped) merged.set(p.id || '', p)
          return Array.from(merged.values())
        })
      }
      if (source === 'usage_logs' && d.tokenUsages) {
        setTokenUsages(
          d.tokenUsages.map((t: TokenRow) => ({
            userId: t.user_id || t.email || '',
            userEmail: t.email || '',
            userName: t.name || '',
            tokens: t.tokens || 0,
            date: t.created_at || '',
            action: t.action || 'unknown',
          }))
        )
      }
      if (source === 'login_activity' && d.loginActivities) {
        setLoginActivities(
          d.loginActivities.map((l: LoginRow) => ({
            userId: l.user_id || l.email || '',
            userEmail: l.email || '',
            date: l.created_at || '',
            method: (l.method as LoginActivity['method']) || 'email',
          }))
        )
      }

      // Count new pending payments
      if (source === 'payments' && d.paymentRequests) {
        const pending = d.paymentRequests.filter((p: PaymentRow) => p.status === 'pending')
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
