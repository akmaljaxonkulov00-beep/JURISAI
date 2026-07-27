import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type') || 'all';

    let supabase: any = null;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      // Supabase not configured — return empty data below
    }

    // If Supabase is not available, return fallback data immediately
    if (!supabase) {
      const fallback = {
        success: true,
        data: {
          users: [],
          paymentRequests: [],
          loginActivities: [],
          tokenUsages: [],
          totalUsers: 0,
          newUsers: 0,
          userGrowth: 0,
          premiumUsers: 0,
          totalRevenue: 0,
          pendingCount: 0,
          approvedCount: 0,
          recentLogins: 0,
          activeUsers: 0,
          tokensUsed: 0,
          source: 'fallback',
          message: 'Supabase ulanishi mavjud emas',
        },
      };
      return NextResponse.json(fallback);
    }

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const prevCutoff = new Date();
    prevCutoff.setDate(prevCutoff.getDate() - days * 2);

    // ── Always return these fields, even if empty ──
    const result: Record<string, any> = {
      users: [],
      paymentRequests: [],
      loginActivities: [],
      tokenUsages: [],
      totalUsers: 0,
      newUsers: 0,
      userGrowth: 0,
      premiumUsers: 0,
      totalRevenue: 0,
      pendingCount: 0,
      approvedCount: 0,
      recentLogins: 0,
      activeUsers: 0,
      tokensUsed: 0,
    };

    // Fetch users — try registered_users first, then auth.users via service_role
    if (type === 'all' || type === 'users') {
      try {
        const { data: users, error: usersError } = await supabase
          .from('registered_users')
          .select('*');
        if (!usersError && users && users.length > 0) {
          result.users = users;
          result.totalUsers = users.length;
          const newUsers = users.filter((u: any) => {
            const created = u.created_at || u.last_login;
            return created && new Date(created) >= cutoff;
          });
          result.newUsers = newUsers.length;

          const prevNewUsers = users.filter((u: any) => {
            const created = u.created_at || u.last_login;
            return created && new Date(created) >= prevCutoff && new Date(created) < cutoff;
          });
          result.userGrowth = prevNewUsers.length > 0
            ? Math.round(((newUsers.length - prevNewUsers.length) / prevNewUsers.length) * 100)
            : 0;

          const premiumUsers = users.filter((u: any) => u.subscription_plan && u.subscription_plan !== 'free');
          result.premiumUsers = premiumUsers.length;
          result.userSource = 'registered_users';
        } else {
          // Fallback: try auth.users via service_role (must specify auth schema)
          try {
            const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
            const authRes = await fetch(
              `${suUrl}/rest/v1/users?select=id,email,raw_user_meta_data,created_at,last_sign_in_at,banned_until`,
              {
                headers: {
                  'apikey': srKey,
                  'Authorization': `Bearer ${srKey}`,
                  'Accept-Profile': 'auth',  // Required to access auth schema
                  'Content-Type': 'application/json',
                },
              }
            );
            if (authRes.ok) {
              const authUsers = await authRes.json();
              if (Array.isArray(authUsers) && authUsers.length > 0) {
                result.users = authUsers.map((u: any) => ({
                  id: u.id,
                  email: u.email || '',
                  name: u.raw_user_meta_data?.name || u.email?.split('@')[0] || '',
                  role: u.raw_user_meta_data?.role || 'USER',
                  subscription_plan: u.raw_user_meta_data?.subscription_plan || 'free',
                  subscription_expires_at: u.raw_user_meta_data?.subscription_expires_at || '',
                  blocked: !!u.banned_until,
                  balance: u.raw_user_meta_data?.balance || 0,
                  created_at: u.created_at || '',
                  last_login: u.last_sign_in_at || u.created_at || '',
                  status: u.banned_until ? 'blocked' : 'active',
                }));
                result.totalUsers = authUsers.length;
                result.userSource = 'auth.users';
              }
            }
          } catch { /* fallback failed */ }
        }
      } catch (e: any) {
        result.usersError = e?.message || 'jadval mavjud emas';
      }
    }

    // Fetch login activity
    if (type === 'all' || type === 'logins') {
      try {
        const { data: logins, error: loginsError } = await supabase
          .from('auth_logs')
          .select('*')
          .gte('created_at', cutoff.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);
        if (!loginsError && logins) {
          result.loginActivities = logins;
          result.recentLogins = logins.length;
          const activeUserIds = new Set(logins.map((l: any) => l.user_id || l.email));
          result.activeUsers = activeUserIds.size;
        } else if (loginsError) {
          result.loginsError = loginsError.message;
        }
      } catch (e: any) {
        result.loginsError = e?.message || 'jadval mavjud emas';
      }
    }

    // Fetch token usage
    if (type === 'all' || type === 'tokens') {
      try {
        const { data: tokens, error: tokensError } = await supabase
          .from('usage_logs')
          .select('*')
          .gte('created_at', cutoff.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);
        if (!tokensError && tokens) {
          result.tokenUsages = tokens;
          result.tokensUsed = tokens.reduce((sum: number, t: any) => sum + (t.tokens || 0), 0);
        } else if (tokensError) {
          result.tokensError = tokensError.message;
        }
      } catch (e: any) {
        result.tokensError = e?.message || 'jadval mavjud emas';
      }
    }

    // Fetch payments
    if (type === 'all' || type === 'payments') {
      try {
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!paymentsError && payments) {
          result.paymentRequests = payments;
          const approvedPayments = payments.filter((p: any) => p.status === 'approved');
          const totalRevenue = approvedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          result.totalRevenue = totalRevenue;
          result.pendingCount = payments.filter((p: any) => p.status === 'pending').length;
          result.approvedCount = approvedPayments.length;
        } else if (paymentsError) {
          result.paymentsError = paymentsError.message;
        }
      } catch (e: any) {
        result.paymentsError = e?.message || 'jadval mavjud emas';
      }
    }

    result.source = 'supabase';
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
