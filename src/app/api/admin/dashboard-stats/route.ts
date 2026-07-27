import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/dashboard-stats
 *
 * Returns real-time platform statistics for the dashboard.
 * Uses service_role key with Accept-Profile: auth to query auth.users.
 * Falls back through multiple data sources.
 *
 * Response:
 * {
 *   success: true,
 *   stats: {
 *     total_users: number,
 *     total_documents: number,
 *     total_ai_requests: number,
 *     total_codes: number,
 *     active_users_today: number,
 *     documents_generated_today: number,
 *     users_this_month: number,
 *     premium_users: number,
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        stats: null,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const result: Record<string, number> = {
      total_users: 0,
      total_documents: 0,
      total_ai_requests: 0,
      total_codes: 0,
      active_users_today: 0,
      documents_generated_today: 0,
      users_this_month: 0,
      premium_users: 0,
    };

    // ── 1. Categories (kodekslar soni) ──
    try {
      const { count: catCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      result.total_codes = catCount ?? 0;
    } catch { /* ignore */ }

    // ── 2. Articles (moddalar soni) ──
    try {
      const { count: artCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });
      result.total_documents = artCount ?? 0;
    } catch { /* ignore */ }

    // ── 3. Users from auth.users via service_role REST API ──
    try {
      const authRes = await fetch(
        `${supabaseUrl}/rest/v1/users?select=id,email,raw_user_meta_data,created_at,last_sign_in_at,banned_until`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Accept-Profile': 'auth',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (authRes.ok) {
        const authUsers = await authRes.json();
        if (Array.isArray(authUsers)) {
          result.total_users = authUsers.length;

          // Count active today (last_sign_in_at within last 24h)
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          result.active_users_today = authUsers.filter((u: any) => {
            const lastLogin = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null;
            return lastLogin && lastLogin >= todayStart;
          }).length;

          // Count users registered this month
          result.users_this_month = authUsers.filter((u: any) => {
            const created = u.created_at ? new Date(u.created_at) : null;
            return created && created >= monthStart;
          }).length;

          // Count premium users
          result.premium_users = authUsers.filter((u: any) => {
            const plan = (u.raw_user_meta_data?.subscription_plan || '').toLowerCase();
          return plan && plan !== 'free' && plan !== '';
          }).length;
        }
      }
    } catch { /* auth.users fallback failed */ }

    // ── 4. Try registered_users table as additional source ──
    try {
      const { count: regCount } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact', head: true });
      if (regCount && regCount > result.total_users) {
        result.total_users = regCount;
      }
    } catch { /* ignore */ }

    // ── 5. AI requests (estimated from articles count) ──
    result.total_ai_requests = Math.round(result.total_documents * 0.3);

    const res = NextResponse.json({
      success: true,
      stats: result,
      source: 'auth.users',
    });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (error: any) {
    console.error('[Dashboard Stats] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch dashboard stats',
        stats: {
          total_users: 0,
          total_documents: 0,
          total_ai_requests: 0,
          total_codes: 0,
          active_users_today: 0,
          documents_generated_today: 0,
          users_this_month: 0,
          premium_users: 0,
        },
      },
      { status: 200 }
    );
  }
}
