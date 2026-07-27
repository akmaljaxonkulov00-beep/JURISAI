'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface PlatformStats {
  total_users: number;
  total_documents: number;   // total articles
  total_ai_requests: number;
  total_codes: number;        // total categories
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
 * Fetches aggregate platform statistics from Supabase.
 * Queries actual existing tables: categories, articles, registered_users.
 * Falls back to localStorage counts if Supabase is unavailable.
 */
async function fetchStats(): Promise<PlatformStats> {
  try {
    // ── 1. Categories (kodekslar soni) ──
    let codesCount = 10;
    try {
      const { count: catCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      if (catCount && catCount > 0) codesCount = catCount;
    } catch { /* fallback */ }

    // ── 2. Articles (moddalar soni = documents) ──
    let articlesCount = 0;
    try {
      const { count: artCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });
      articlesCount = artCount ?? 0;
    } catch { /* fallback */ }

    // ── 3. Users (foydalanuvchilar soni) ──
    let usersCount = 0;
    try {
      const { count: userCount } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact', head: true });
      usersCount = userCount ?? 0;
    } catch {
      // Try to count from localStorage as fallback
      try {
        const stored = localStorage.getItem('admin_users') || localStorage.getItem('registered_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          usersCount = Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch { /* ignore */ }
    }

    // ── 4. AI requests (taxminiy — articles * 0.3 yoki localStorage) ──
    let aiRequests = Math.round(articlesCount * 0.3);
    try {
      const stored = localStorage.getItem('ai_chats');
      if (stored) {
        const chats = JSON.parse(stored);
        aiRequests = Math.max(aiRequests, Array.isArray(chats) ? chats.length * 3 : 0);
      }
    } catch { /* ignore */ }

    // ── 5. Today's activity ──
    let activeToday = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeCount } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', today.toISOString());
      activeToday = activeCount ?? 0;
    } catch { /* no last_login column or table doesn't exist */ }

    return {
      total_users: usersCount,
      total_documents: articlesCount,
      total_ai_requests: aiRequests,
      total_codes: codesCount,
      active_users_today: activeToday,
      documents_generated_today: 0,
    };
  } catch (err) {
    console.warn('[Stats] Supabase fetch failed, using fallback:', err);
    return getLocalFallbackStats();
  }
}

function getLocalFallbackStats(): PlatformStats {
  try {
    const usersRaw = localStorage.getItem('admin_users') || localStorage.getItem('registered_users');
    const totalUsers = usersRaw ? JSON.parse(usersRaw).length : 0;

    const chatsRaw = localStorage.getItem('ai_chats');
    const totalRequests = chatsRaw ? JSON.parse(chatsRaw).length * 3 : 0;

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
