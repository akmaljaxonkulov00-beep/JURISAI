'use client';

// ═══════════════════════════════════════════════════════════════════════════
// useSettingsSync.ts — Real-time settings sync hook
// Admin panelidagi o'zgarishlarni foydalanuvchi sahifalariga yetkazadi
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@/lib/settings-sync';

const POLL_INTERVAL_MS = 15_000; // Har 15 sekundda yangilanadi

interface SettingsState {
  settings: SiteSettings | null;
  pricingPlans: PricingPlan[];
  paymentRequests: PaymentRequest[];
  announcements: { message: string; type: 'info' | 'warning' | 'success'; active: boolean }[];
  loading: boolean;
  lastSynced: Date | null;
  refresh: () => Promise<void>;
}

// Sync user session with latest payment/subscription data from Supabase
function syncUserSessionWithPayments(payments: PaymentRequest[]) {
  try {
    const sessionData = sessionStorage.getItem('jurisai_user') || sessionStorage.getItem('auth_user');
    if (!sessionData) return;
    const user = JSON.parse(sessionData);
    if (!user?.email) return;

    // Find approved payments for this user
    const userPayments = payments.filter(p =>
      p.status === 'approved' &&
      (p.userEmail === user.email || p.userId === user.id || p.userId === user.email)
    );

    if (userPayments.length === 0) return;

    // Get the most recently approved payment
    const latestApproved = userPayments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    // Calculate total approved balance
    const totalApprovedBalance = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const previousBalance = Number(user.balance || 0);

    // Only update if the session balance is lower than what Supabase shows
    // (this means admin approved after the user's last session update)
    if (totalApprovedBalance > previousBalance || !user.subscription_plan || user.subscription_plan === 'free') {
      const plan = latestApproved.plan === 'pro' ? 'pro' : 'standart';
      const updatedUser = {
        ...user,
        subscription_plan: plan,
        subscription_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        balance: totalApprovedBalance,
      };
      sessionStorage.setItem('jurisai_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));
      localStorage.setItem('jurisai_user', JSON.stringify(updatedUser));
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  } catch {}
}

export function useSettingsSync(): SettingsState {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadAll = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const [s, p, pr, a] = await Promise.allSettled([
        getPublicSettings(),
        getPricingPlans(),
        getPaymentRequests(),
        getAnnouncements(),
      ]);

      if (!mountedRef.current) return;

      if (s.status === 'fulfilled' && s.value) setSettings(s.value);
      if (p.status === 'fulfilled') setPricingPlans(p.value);
      if (pr.status === 'fulfilled') {
        setPaymentRequests(pr.value);
        // CRITICAL: Sync user session with latest payment data
        syncUserSessionWithPayments(pr.value);
      }
      if (a.status === 'fulfilled') setAnnouncements(a.value);

      setLastSynced(new Date());
    } catch (err) {
      console.warn('[useSettingsSync] Load error:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await refreshAllSettings();
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial load
    loadAll();

    // Fast poll for first 30 seconds (capture any admin changes)
    const fastTimer = setTimeout(() => {
      // After 30s, switch to normal polling
      if (!mountedRef.current) return;
    }, 30_000);

    // Normal polling
    pollTimerRef.current = setInterval(() => {
      if (mountedRef.current) {
        loadAll();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(fastTimer);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [loadAll]);

  return {
    settings,
    pricingPlans,
    paymentRequests,
    announcements,
    loading,
    lastSynced,
    refresh,
  };
}
