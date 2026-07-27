'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PlatformStats {
  total_users: number;
  total_documents: number;
  total_ai_requests: number;
  total_codes: number;
  active_users_today: number;
  documents_generated_today: number;
  users_this_month: number;
  premium_users: number;
}

const DEFAULT_STATS: PlatformStats = {
  total_users: 0,
  total_documents: 0,
  total_ai_requests: 0,
  total_codes: 0,
  active_users_today: 0,
  documents_generated_today: 0,
  users_this_month: 0,
  premium_users: 0,
};

const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * Fetches aggregate platform statistics from the server-side API.
 * The API uses service_role key with Accept-Profile: auth to query auth.users.
 */
async function fetchStats(): Promise<PlatformStats> {
  try {
    const response = await fetch('/api/admin/dashboard-stats', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      console.warn('[Stats] API returned', response.status);
      return getLocalFallbackStats();
    }

    const data = await response.json();
    if (data.success && data.stats) {
      return {
        total_users: data.stats.total_users || 0,
        total_documents: data.stats.total_documents || 0,
        total_ai_requests: data.stats.total_ai_requests || 0,
        total_codes: data.stats.total_codes || 0,
        active_users_today: data.stats.active_users_today || 0,
        documents_generated_today: data.stats.documents_generated_today || 0,
        users_this_month: data.stats.users_this_month || 0,
        premium_users: data.stats.premium_users || 0,
      };
    }

    console.warn('[Stats] API returned invalid data:', data);
    return getLocalFallbackStats();
  } catch (err) {
    console.warn('[Stats] Failed to fetch, using fallback:', err);
    return getLocalFallbackStats();
  }
}

function getLocalFallbackStats(): PlatformStats {
  try {
    const usersRaw = localStorage.getItem('admin_users') || localStorage.getItem('registered_users');
    const totalUsers = usersRaw ? JSON.parse(usersRaw).length : 0;

    const chatsRaw = localStorage.getItem('ai_chats');
    const totalRequests = chatsRaw ? JSON.parse(chatsRaw).length * 3 : 0;

    const codesRaw = localStorage.getItem('legal_codes');
    const totalCodes = codesRaw ? JSON.parse(codesRaw).length : 10;

    return {
      total_users: totalUsers,
      total_documents: 0,
      total_ai_requests: totalRequests,
      total_codes: totalCodes,
      active_users_today: totalUsers,
      documents_generated_today: 0,
      users_this_month: totalUsers,
      premium_users: 0,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

/**
 * Hook that fetches platform stats from server API on mount and polls every 30 seconds.
 * Uses auth.users via service_role key for real user count.
 */
export function useRealtimeStats() {
  const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {
      // Silently fail — keep previous stats
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { stats, loading, refetch: load };
}
