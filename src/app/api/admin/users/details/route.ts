import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import { getErrorMessage } from '@/lib/errors'

// GET /api/admin/users/details?userId=xxx
// Returns detailed user info: payment history, AI usage, login activity
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query param is required' }, { status: 400 })
    }

    // ── Fetch user profile from multiple sources ──
    let profile: Record<string, unknown> | null = null

    // Try registered_users
    const { data: regUser } = await supabase
      .from('registered_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (regUser) profile = regUser

    // Fallback to users table
    if (!profile) {
      const { data: legacyUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (legacyUser) profile = legacyUser
    }

    // ── Payment history ──
    const { data: payments } = await supabase
      .from('payment_requests')
      .select('id, amount, status, created_at, receipt_url, payment_method, notes')
      .or(`user_id.eq.${userId},email.eq.${profile?.email || ''}`)
      .order('created_at', { ascending: false })
      .limit(50)

    // ── AI Usage logs ──
    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('id, action, tokens, created_at, email, metadata')
      .or(`user_id.eq.${userId},email.eq.${profile?.email || ''}`)
      .order('created_at', { ascending: false })
      .limit(100)

    // ── Login activity (from auth.users or activity logs) ──
    let lastLogin = null
    let loginCount = 0

    // Try auth.users REST API for login info
    try {
      const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      const authRes = await fetch(
        `${suUrl}/rest/v1/users?id=eq.${userId}&select=id,email,last_sign_in_at,created_at,factors`,
        {
          headers: {
            apikey: srKey,
            Authorization: `Bearer ${srKey}`,
            'Accept-Profile': 'auth',
          },
        }
      )
      if (authRes.ok) {
        const authData = await authRes.json()
        if (authData?.[0]) {
          lastLogin = authData[0].last_sign_in_at
          loginCount = authData[0].factors?.length || 0
        }
      }
    } catch {
      /* non-critical */
    }

    // ══════════════════════════════════════════════════════
    // Summarize stats
    // ══════════════════════════════════════════════════════
    const paymentStats = {
      total: payments?.length || 0,
      approved: payments?.filter(p => p.status === 'approved').length || 0,
      pending: payments?.filter(p => p.status === 'pending').length || 0,
      rejected: payments?.filter(p => p.status === 'rejected').length || 0,
      totalAmount:
        payments?.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount || 0), 0) ||
        0,
    }

    const usageStats = {
      total: usageLogs?.length || 0,
      chatQueries:
        usageLogs?.filter(
          l => l.action?.toLowerCase().includes('chat') || l.action?.toLowerCase().includes('ai')
        ).length || 0,
      documents: usageLogs?.filter(l => l.action?.toLowerCase().includes('document')).length || 0,
      analysis:
        usageLogs?.filter(
          l =>
            l.action?.toLowerCase().includes('analyz') || l.action?.toLowerCase().includes('analiz')
        ).length || 0,
      totalTokens: usageLogs?.reduce((s, l) => s + (l.tokens || 0), 0) || 0,
    }

    return NextResponse.json({
      profile,
      payments: payments || [],
      usageLogs: usageLogs || [],
      loginActivity: {
        lastLogin,
        loginCount,
        registeredAt: profile?.created_at || '',
      },
      paymentStats,
      usageStats,
    })
  } catch (error) {
    console.error('[User Details] Error:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Xatolik' }, { status: 500 })
  }
}
