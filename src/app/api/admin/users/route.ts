import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Admin-only: Get all users with search, filter, pagination
// Falls back through: users → auth_users_view → registered_users → auth.users REST API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const statusParam = searchParams.get('status')
    const roleParam = searchParams.get('role')

    const skip = (page - 1) * limit

    // ── Helper: map user from any table to unified format ──
    const mapUser = (u: any) => ({
      id: u.id,
      email: u.email || '',
      firstName: (u.name || u.first_name || '').split(' ')[0] || '',
      lastName: (u.name || u.last_name || '').split(' ')[1] || '',
      phone: u.phone || '',
      role: u.role || 'USER',
      status: u.blocked ? 'SUSPENDED' : u.status || 'ACTIVE',
      provider: u.provider || u.app_metadata?.provider || 'email',
      createdAt: u.created_at || u.createdAt || '',
      updatedAt: u.updated_at || u.updatedAt || '',
      subscription: u.subscription_plan
        ? {
            id: u.id + '_sub',
            planName: u.subscription_plan,
            planPrice: u.balance || 0,
            status: 'ACTIVE',
            currentPeriodEnd: u.subscription_expires_at || '',
          }
        : null,
      aiUsageCount: u.ai_usage_count || 0,
    })

    // ── Try 1: registered_users table (admin migration) ──
    let query = supabase.from('registered_users').select('*', { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (statusParam && statusParam !== 'all') {
      if (statusParam === 'SUSPENDED') query = query.eq('blocked', true)
      else query = query.eq('blocked', false)
    }
    if (roleParam && roleParam !== 'all') {
      query = query.eq('role', roleParam)
    }

    let {
      data: users,
      error,
      count,
    } = await query.order('created_at', { ascending: false }).range(skip, skip + limit - 1)

    // ── Try 2: users table (legacy) ──
    if (error || !users || users.length === 0) {
      let q2 = supabase.from('users').select('*', { count: 'exact' })
      if (search) q2 = q2.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      if (roleParam && roleParam !== 'all') q2 = q2.eq('role', roleParam)
      const r2 = await q2.order('created_at', { ascending: false }).range(skip, skip + limit - 1)
      if (!r2.error && r2.data && r2.data.length > 0) {
        users = r2.data
        count = r2.count
        error = null
      }
    }

    // ── Try 3: auth.users via service_role REST API ──
    if (error || !users || users.length === 0) {
      try {
        const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        let authUrl = `${suUrl}/rest/v1/users?select=id,email,raw_user_meta_data,created_at,last_sign_in_at,banned_until&limit=${limit}&offset=${skip}`
        if (search) authUrl += `&email=ilike.%25${encodeURIComponent(search)}%25`
        const authRes = await fetch(authUrl, {
          headers: {
            apikey: srKey,
            Authorization: `Bearer ${srKey}`,
            'Accept-Profile': 'auth',
            'Content-Type': 'application/json',
          },
        })
        if (authRes.ok) {
          const authUsers = await authRes.json()
          if (Array.isArray(authUsers) && authUsers.length > 0) {
            users = authUsers.map((u: any) => ({
              id: u.id,
              email: u.email,
              name: u.raw_user_meta_data?.name || u.email?.split('@')[0] || '',
              role: u.raw_user_meta_data?.role || 'USER',
              status: u.banned_until ? 'SUSPENDED' : 'ACTIVE',
              created_at: u.created_at,
              updated_at: u.last_sign_in_at || u.created_at,
              subscription_plan: u.raw_user_meta_data?.subscription_plan || 'free',
              blocked: !!u.banned_until,
            }))
            count = users.length
            error = null
          }
        }
      } catch {
        /* auth users fallback failed */
      }
    }

    if (error) {
      console.warn('[Admin Users] All sources failed, returning empty:', error.message)
      return NextResponse.json({
        users: [],
        pagination: { page, limit, total: 0, pages: 1 },
        source: 'empty',
      })
    }

    const formattedUsers = (users || []).map(mapUser)

    // ── Enrich with payment & usage stats ──
    // Fetch aggregate payment data per user
    let paymentStatsMap: Record<string, { count: number; total: number }> = {}
    try {
      const { data: payments } = await supabase
        .from('payment_requests')
        .select('user_id, amount, status')
      if (payments) {
        for (const p of payments) {
          const uid = p.user_id || ''
          if (!uid) continue
          if (!paymentStatsMap[uid]) paymentStatsMap[uid] = { count: 0, total: 0 }
          paymentStatsMap[uid].count += 1
          if (p.status === 'approved') {
            paymentStatsMap[uid].total += p.amount || 0
          }
        }
      }
    } catch {
      /* payment stats non-critical */
    }

    // Fetch aggregate usage (AI request count) per user
    let usageStatsMap: Record<string, number> = {}
    try {
      const { data: usageLogs } = await supabase.from('usage_logs').select('user_id, email')
      if (usageLogs) {
        for (const u of usageLogs) {
          const uid = u.user_id || u.email || ''
          if (!uid) continue
          usageStatsMap[uid] = (usageStatsMap[uid] || 0) + 1
        }
      }
    } catch {
      /* usage stats non-critical */
    }

    // Enrich each user with stats
    const enrichedUsers = formattedUsers.map((u: any) => {
      // Prefer id-based lookup, fallback to email (avoids double-counting)
      const pId = paymentStatsMap[u.id]
      const pEmail = paymentStatsMap[u.email]
      const pStats = pId || pEmail || { count: 0, total: 0 }
      const uCount = usageStatsMap[u.id] || usageStatsMap[u.email] || 0
      return {
        ...u,
        paymentCount: pStats.count,
        paymentTotal: pStats.total,
        totalRequests: uCount,
      }
    })

    const total = count || enrichedUsers.length

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      source: 'multi-fallback',
    })
  } catch (error: any) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      {
        users: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 },
        error: error?.message || 'Xatolik',
      },
      { status: 200 } // Return 200 with empty data rather than breaking the UI
    )
  }
}

// PATCH - Admin-only: Update user fields (role, subscription, block status)
// Accepts direct field updates — matches admin page syncUserToSupabase()
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, data, ...directFields } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Support both action-based (legacy) and direct field updates
    let updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (action) {
      switch (action) {
        case 'block':
          updatePayload.blocked = true
          break
        case 'unblock':
          updatePayload.blocked = false
          break
        case 'changeRole':
          updatePayload.role = data?.role || 'USER'
          break
        case 'changeSubscription':
          updatePayload.subscription_plan = data?.planId || 'free'
          updatePayload.subscription_expires_at =
            data?.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString()
          break
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    } else {
      // Direct field updates from syncUserToSupabase
      if (directFields.role !== undefined) updatePayload.role = directFields.role
      if (directFields.subscription_plan !== undefined)
        updatePayload.subscription_plan = directFields.subscription_plan
      if (directFields.subscription_expires_at !== undefined)
        updatePayload.subscription_expires_at = directFields.subscription_expires_at
      if (directFields.blocked !== undefined) updatePayload.blocked = directFields.blocked
      if (directFields.name !== undefined) updatePayload.name = directFields.name
      if (directFields.email !== undefined) updatePayload.email = directFields.email
    }

    // Use the same table name as analytics API: registered_users
    // Try update first to avoid creating phantom records
    const { data: existing, error: checkError } = await supabase
      .from('registered_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('registered_users')
        .update(updatePayload)
        .eq('id', userId)

      if (updateError) {
        console.error('[Admin Users] Update error:', updateError)
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
      }
    } else {
      // Fallback to 'users' table
      const { error: fallbackError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId)

      if (fallbackError) {
        console.error('[Admin Users] Fallback update error:', fallbackError)
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Foydalanuvchi maʼlumotlari yangilandi' })
  } catch (error: any) {
    console.error('[Admin Users] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

// DELETE - Admin-only: Remove user
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Try registered_users first, fallback to users
    const { error } = await supabase.from('registered_users').delete().eq('id', userId)

    if (error) {
      await supabase.from('users').delete().eq('id', userId)
    }

    return NextResponse.json({ success: true, message: "Foydalanuvchi o'chirildi" })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
