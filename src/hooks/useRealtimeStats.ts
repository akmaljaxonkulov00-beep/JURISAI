'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface PlatformStats {
  total_users: number;
  total_documents: number;
  total_ai_requests: number;
  total_codes: number;
  active_users_today: number;
  documents_generated_today: number;
}

const DEFAULT_STATS: PlatformStats = {
  total_users: 0,
  total_documents: 0,
  total_ai_requests: 0,
  total_codes: 10,
  active_users_today: 0,
  documents_generated_today: 0,
};

const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * Fetches aggregate platform statistics from Supabase in real-time.
 * Falls back to localStorage counts if Supabase is unavailable.
 */
async function fetchStats(): Promise<PlatformStats> {
  try {
    const [
      { count: usersCount },
      { count: docsCount },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('generated_documents').select('*', { count: 'exact', head: true }),
    ]);

    // Count unique document types as "codes" — fallback 10 if table empty
    let codesCount = 10;
    try {
      const { data: docTypes } = await supabase
        .from('legal_documents')
        .select('document_type');
      if (docTypes && docTypes.length > 0) {
        const uniqueTypes = new Set(docTypes.map((d: any) => d.document_type));
        codesCount = Math.max(uniqueTypes.size, 10);
      }
    } catch {
      // Try categories table fallback
      try {
        const { count: catCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });
        codesCount = catCount ?? 10;
      } catch {
        codesCount = 10;
      }
    }

    // Count AI requests from usage_tracking
    let aiRequests = 0;
    try {
      const { count: aiCount } = await supabase
        .from('usage_tracking')
        .select('*', { count: 'exact', head: true });
      aiRequests = aiCount ?? 0;
    } catch {
      // Fallback: estimate from generated_documents * 3
      aiRequests = (docsCount ?? 0) * 3;
    }

    // Today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    let activeToday = 0;
    let docsToday = 0;
    try {
      const { count: activeCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', todayStr);
      activeToday = activeCount ?? 0;
    } catch { /* no last_login column */ }

    try {
      const { count: docsTodayCount } = await supabase
        .from('generated_documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStr);
      docsToday = docsTodayCount ?? 0;
    } catch { /* fallback */ }

    return {
      total_users: usersCount ?? 0,
      total_documents: docsCount ?? 0,
      total_ai_requests: aiRequests,
      total_codes: codesCount,
      active_users_today: activeToday,
      documents_generated_today: docsToday,
    };
  } catch (err) {
    console.warn('[Stats] Supabase fetch failed, using localStorage fallback:', err);
    return getLocalFallbackStats();
  }
}

/**
 * Accumulated stats from localStorage (set by usage-tracking.ts and firebase-auth.ts)
 */
function getLocalFallbackStats(): PlatformStats {
  try {
    const users = localStorage.getItem('registered_users');
    const totalUsers = users ? JSON.parse(users).length : 0;

    const chats = localStorage.getItem('ai_chats');
    const totalRequests = chats ? JSON.parse(chats).length * 3 : 0;

    return {
      total_users: totalUsers,
      total_documents: 0,
      total_ai_requests: totalRequests,
      total_codes: 10,
      active_users_today: totalUsers,
      documents_generated_today: 0,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

/**
 * Hook that fetches platform stats on mount and polls every 30 seconds.
 * Returns stats with loading state for smooth UI transitions.
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
