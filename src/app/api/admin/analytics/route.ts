import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server-auth'

// Supabase'dan keladigan xom qatorlar (any o'rniga)
interface UserRow {
  id?: string
  email?: string
  created_at?: string
  last_login?: string
  subscription_plan?: string
  banned_until?: string | null
  last_sign_in_at?: string
  raw_user_meta_data?: Record<string, unknown>
  raw_app_meta_data?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
  [key: string]: unknown
}

interface LoginRow {
  user_id?: string
  email?: string
  [key: string]: unknown
}

interface TokenRow {
  tokens?: number
  [key: string]: unknown
}

interface PaymentRow {
  status?: string
  amount?: number
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const type = searchParams.get('type') || 'all'

    // Kalitlar faqat server environment variable'laridan — kodda hardcoded yo'q
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    let supabase: ReturnType<typeof createClient> | null = null

    if (supabaseUrl && serviceKey) {
      try {
        supabase = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      } catch {} // fall through to anon client
    }

    if (!supabase && supabaseUrl && anonKey) {
      supabase = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }

    // If Supabase is not available at all, return fallback data
    if (!supabase || !supabaseUrl) {
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
      }
      return NextResponse.json(fallback)
    }

    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const prevCutoff = new Date()
    prevCutoff.setDate(prevCutoff.getDate() - days * 2)

    // ── Always return these fields, even if empty ──
    const result: Record<string, unknown> = {
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
    }

    // Fetch users — try registered_users first, then auth.users via service_role
    if (type === 'all' || type === 'users') {
      try {
        const { data: users, error: usersError } = await supabase
          .from('registered_users')
          .select('*')
        if (!usersError && users && users.length > 0) {
          // registered_users has data — use it directly
          result.users = users
          result.totalUsers = users.length
          const newUsers = (Array.isArray(users) ? users : []).filter((u: UserRow) => {
            const created = u.created_at || u.last_login
            return created && new Date(created) >= cutoff
          })
          result.newUsers = newUsers.length
          const prevNewUsers = (Array.isArray(users) ? users : []).filter((u: UserRow) => {
            const created = u.created_at || u.last_login
            return created && new Date(created) >= prevCutoff && new Date(created) < cutoff
          })
          result.userGrowth =
            prevNewUsers.length > 0
              ? Math.round(((newUsers.length - prevNewUsers.length) / prevNewUsers.length) * 100)
              : 0
          const premiumUsers = (Array.isArray(users) ? users : []).filter(
            (u: UserRow) => u.subscription_plan && u.subscription_plan !== 'free'
          )
          result.premiumUsers = premiumUsers.length
          result.userSource = 'registered_users'
        } else {
          // Fallback: auth.users via Supabase REST API
          // Requires SUPABASE_SERVICE_ROLE_KEY on the server
          try {
            const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
            const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
            if (srKey) {
              const authRes = await fetch(
                `${suUrl}/rest/v1/users?select=id,email,raw_user_meta_data,created_at,last_sign_in_at,banned_until`,
                {
                  headers: {
                    apikey: srKey,
                    Authorization: `Bearer ${srKey}`,
                    'Accept-Profile': 'auth',
                    'Content-Type': 'application/json',
                  },
                }
              )
              if (authRes.ok) {
                const authUsers = await authRes.json()
                if (Array.isArray(authUsers) && authUsers.length > 0) {
                  result.users = authUsers.map((u: UserRow) => ({
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
                    provider: u.app_metadata?.provider || 'email',
                  }))
                  result.totalUsers = authUsers.length
                  result.userSource = 'auth.users'
                }
              }
            }
          } catch {
            /* fallback failed */
          }
        }
      } catch (e: unknown) {
        result.usersError = e instanceof Error ? e.message : 'jadval mavjud emas'
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
          .limit(100)
        if (!loginsError && logins) {
          result.loginActivities = logins
          result.recentLogins = logins.length
          const activeUserIds = new Set(logins.map((l: LoginRow) => l.user_id || l.email))
          result.activeUsers = activeUserIds.size
        } else if (loginsError) {
          result.loginsError = loginsError.message
        }
      } catch (e: unknown) {
        result.loginsError = e instanceof Error ? e.message : 'jadval mavjud emas'
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
          .limit(100)
        if (!tokensError && tokens) {
          result.tokenUsages = tokens
          result.tokensUsed = tokens.reduce((sum: number, t: TokenRow) => sum + (t.tokens || 0), 0)
        } else if (tokensError) {
          result.tokensError = tokensError.message
        }
      } catch (e: unknown) {
        result.tokensError = e instanceof Error ? e.message : 'jadval mavjud emas'
      }
    }

    // Fetch payments
    if (type === 'all' || type === 'payments') {
      try {
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (!paymentsError && payments) {
          result.paymentRequests = payments
          const approvedPayments = (Array.isArray(payments) ? payments : []).filter(
            (p: PaymentRow) => p.status === 'approved'
          )
          const totalRevenue = approvedPayments.reduce(
            (sum: number, p: PaymentRow) => sum + (p.amount || 0),
            0
          )
          result.totalRevenue = totalRevenue
          result.pendingCount = (Array.isArray(payments) ? payments : []).filter(
            (p: PaymentRow) => p.status === 'pending'
          ).length
          result.approvedCount = approvedPayments.length
        } else if (paymentsError) {
          result.paymentsError = paymentsError.message
        }
      } catch (e: unknown) {
        result.paymentsError = e instanceof Error ? e.message : 'jadval mavjud emas'
      }
    }

    result.source = 'supabase'
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    console.error('Admin analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
