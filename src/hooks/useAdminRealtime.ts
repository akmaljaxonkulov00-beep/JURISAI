'use client';

// ═══════════════════════════════════════════════════════════════════════════
// useAdminRealtime.ts — Admin panel uchun real-time WebSocket ulanish
// Supabase Realtime subscriptions orqali to'lov, foydalanuvchi va
// monitoring o'zgarishlarini polling o'rniga instant yangilash
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type PaymentRequest,
} from '@/lib/settings-sync';



const FALLBACK_POLL_MS = 30_000; // 30 sekund — faol yangilanish

interface LoginActivity {
  userId: string;
  userEmail: string;
  date: string;
  method: 'email' | 'google';
}

interface TokenUsage {
  userId: string;
  userEmail: string;
  userName: string;
  tokens: number;
  date: string;
  action: string;
}

interface AdminRealtimeState {
  paymentRequests: PaymentRequest[];
  allUsers: any[];
  loginActivities: LoginActivity[];
  tokenUsages: TokenUsage[];
  newPaymentsCount: number;     // Yangi kelgan to'lovlar soni
  newUsersCount: number;        // Yangi foydalanuvchilar soni
  loading: boolean;
  lastSynced: Date | null;
  refreshAll: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

// ── Admin real-time hook ──
export function useAdminRealtime(): AdminRealtimeState {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([]);
  const [newPaymentsCount, setNewPaymentsCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPaymentIdsRef = useRef(new Set<string>());

  // ── Load ALL data from Supabase ──
  const fetchAllData = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics?days=90&type=all', {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const result = await res.json();
      if (!mountedRef.current) return;

      const d = result.data || {};
      const prevIds = prevPaymentIdsRef.current;

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
        })) as PaymentRequest[];

        // Count new payments since last fetch
        const currentIds = new Set(mapped.map(p => p.id));
        const newIds = [...currentIds].filter(id => !prevIds.has(id));
        const trulyNewPayments = mapped.filter(p => newIds.includes(p.id) && p.status === 'pending');
        if (trulyNewPayments.length > 0) {
          setNewPaymentsCount(trulyNewPayments.length);
        }
        prevPaymentIdsRef.current = currentIds;

        setPaymentRequests(mapped);
        // Cache to localStorage for offline backup
        try { localStorage.setItem('admin_payment_requests', JSON.stringify(mapped)); } catch {}
      }

      // ── Users ──
      if (d.users && Array.isArray(d.users)) {
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
        }));
        setAllUsers(mappedUsers);
        try { localStorage.setItem('admin_users', JSON.stringify(mappedUsers)); } catch {}
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
        );
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
        );
      }

      setLastSynced(new Date());
    } catch (err) {
      // Fallback: load from localStorage cache
      try {
        const cachedPayments = localStorage.getItem('admin_payment_requests');
        if (cachedPayments) setPaymentRequests(JSON.parse(cachedPayments));
        const cachedUsers = localStorage.getItem('admin_users');
        if (cachedUsers) setAllUsers(JSON.parse(cachedUsers));
      } catch {}
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ── Refresh single source (by table name) ──
  const refreshSource = useCallback(async (source: string) => {
    if (!mountedRef.current) return;
    try {
      const keyMap: Record<string, string> = {
        payments: 'paymentRequests',
        usage_logs: 'tokenUsages',
        login_activity: 'loginActivities',
        site_settings: 'settings',
        pricing_plans: 'pricing',
      };
      const type = keyMap[source] || source;
      const res = await fetch(`/api/admin/analytics?days=90&type=${type}`, {
        cache: 'no-cache',
      });
      const result = await res.json();
      if (!mountedRef.current || !result.success) return;
      const d = result.data || {};

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
        }));
        setPaymentRequests(prev => {
          // Merge: keep existing data + new data, dedup by id
          const merged = new Map(prev.map(p => [p.id, p]));
          for (const p of mapped) merged.set(p.id, p);
          return Array.from(merged.values());
        });
      }
      if (source === 'usage_logs' && d.tokenUsages) {
        setTokenUsages(d.tokenUsages.map((t: any) => ({
          userId: t.user_id || t.email,
          userEmail: t.email,
          userName: t.name || '',
          tokens: t.tokens || 0,
          date: t.created_at,
          action: t.action || 'unknown',
        })));
      }
      if (source === 'login_activity' && d.loginActivities) {
        setLoginActivities(d.loginActivities.map((l: any) => ({
          userId: l.user_id || l.email,
          userEmail: l.email,
          date: l.created_at,
          method: l.method || 'email',
        })));
      }

      // Count new pending payments
      if (source === 'payments' && d.paymentRequests) {
        const pending = d.paymentRequests.filter((p: any) => p.status === 'pending');
        if (pending.length > 0) {
          setNewPaymentsCount(prev => prev + pending.length);
        }
      }

      setLastSynced(new Date());
    } catch { /* silent */ }
  }, []);

  // ── Public refresh methods ──
  const refreshPayments = useCallback(async () => {
    setNewPaymentsCount(0);
    await refreshSource('payments');
  }, [refreshSource]);

  const refreshUsers = useCallback(async () => {
    await fetchAllData(false);
    setNewUsersCount(0);
  }, [fetchAllData]);

  const refreshAll = useCallback(async () => {
    await fetchAllData(true);
    setNewPaymentsCount(0);
    setNewUsersCount(0);
  }, [fetchAllData]);

  // ── Initial load + periodic polling ──
  // NOTE: Realtime WebSocket subscriptions are intentionally NOT used here
  // because the Supabase Realtime client enters an infinite reconnection
  // loop when the Supabase URL is unreachable (ERR_NAME_NOT_RESOLVED).
  // Polling is silence in the console, reliable, and sufficient for admin.
  useEffect(() => {
    mountedRef.current = true;

    // 1. Initial fetch — all data
    fetchAllData(true);

    // 2. Periodic polling (30s) — primary data source
    pollTimerRef.current = setTimeout(function poll() {
      if (!mountedRef.current) return;
      fetchAllData(false);
      pollTimerRef.current = setTimeout(poll, FALLBACK_POLL_MS);
    }, FALLBACK_POLL_MS);

    // ── Cleanup ──
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchAllData, refreshSource]);

  return {
    paymentRequests,
    allUsers,
    loginActivities,
    tokenUsages,
    newPaymentsCount,
    newUsersCount,
    loading,
    lastSynced,
    refreshAll,
    refreshPayments,
    refreshUsers,
  };
}
