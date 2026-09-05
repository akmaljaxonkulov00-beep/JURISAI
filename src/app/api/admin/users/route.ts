import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

const ALLOWED_ROLES = new Set(['USER', 'ADMIN', 'SUPER_ADMIN'])

/** Foydalanuvchi manbalarining birlashgan ko'rinishi (registered_users / auth.users) */
interface UserSource {
  id: string
  email?: string
  name?: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
  blocked?: boolean
  status?: string
  provider?: string
  app_metadata?: { provider?: string }
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  subscription_plan?: string
  balance?: number
  subscription_expires_at?: string
  ai_usage_count?: number
  raw_user_meta_data?: Record<string, unknown>
  banned_until?: string
  last_sign_in_at?: string
}

// GET - Admin-only: Get all users with search, filter, pagination
// Falls back through: users → auth_users_view → registered_users → auth.users REST API
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const statusParam = searchParams.get('status')
    const roleParam = searchParams.get('role')

    const skip = (page - 1) * limit

    // ── Helper: map user from any table to unified format ──
    const mapUser = (u: UserSource) => ({
      id: String(u.id),
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
            id: String(u.id) + '_sub',
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
            users = (authUsers as UserSource[]).map((u: UserSource) => ({
              id: u.id,
              email: u.email,
              name: (u.raw_user_meta_data?.name as string) || u.email?.split('@')[0] || '',
              role: (u.raw_user_meta_data?.role as string) || 'USER',
              status: u.banned_until ? 'SUSPENDED' : 'ACTIVE',
              created_at: u.created_at,
              updated_at: u.last_sign_in_at || u.created_at,
              subscription_plan: (u.raw_user_meta_data?.subscription_plan as string) || 'free',
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
    const paymentStatsMap: Record<string, { count: number; total: number }> = {}
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
    const usageStatsMap: Record<string, number> = {}
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
    const enrichedUsers = formattedUsers.map((u: UserSource) => {
      // Prefer id-based lookup, fallback to email (avoids double-counting)
      const pId = paymentStatsMap[u.id]
      const pEmail = u.email ? paymentStatsMap[u.email] : undefined
      const pStats = pId || pEmail || { count: 0, total: 0 }
      const uCount = usageStatsMap[u.id] || (u.email ? usageStatsMap[u.email] : 0) || 0
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
  } catch (error) {
    console.error('Users fetch error:', error)
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json(
      {
        users: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 },
        error: message,
      },
      { status: 200 } // Return 200 with empty data rather than breaking the UI
    )
  }
}

// ── Rol himoyasi: faqat SUPER_ADMIN ADMIN/SUPER_ADMIN roli berishi mumkin ──
function canGrantRole(actorRole: string, newRole: string): boolean {
  if (newRole === 'USER') return true // har qanday admin USER qilib qo'yishi mumkin
  return actorRole === 'SUPER_ADMIN' // ADMIN/SUPER_ADMIN faqat super_admin beradi
}

// ── PATCH - Admin-only: Update user fields (role, subscription, block status) ──
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    // Amaldagi adminning DB roli (requireAdmin ADMIN deb qaytaradi, lekin SUPER_ADMIN
    // ekanini alohida tekshiramiz — rolni o'zgartirish imtiyozi uchun)
    const { data: actorRow } = await supabase
      .from('registered_users')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()
    const actorRole = String(actorRow?.role || 'USER').toUpperCase()
    const isSuperAdmin = actorRole === 'SUPER_ADMIN'

    const body = await request.json()
    const { userId, action, data, ...directFields } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Maqsad foydalanuvchini topamiz (ho'zirgi rol va email uchun)
    const { data: target } = await supabase
      .from('registered_users')
      .select('id, role, email, name')
      .eq('id', userId)
      .maybeSingle()
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Foydalanuvchi topilmadi' },
        { status: 404 }
      )
    }
    const targetRole = String(target.role || 'USER').toUpperCase()

    // ── Imtiyoz qoidalari ──
    // 1. Oddiy ADMIN boshqa ADMIN/SUPER_ADMIN'ni tahrirlay olmaydi
    if (!isSuperAdmin && (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Faqat SUPER_ADMIN boshqa adminni tahrirlashi mumkin' },
        { status: 403 }
      )
    }
    // 2. O'z-o'zini tahrirlash (rol/block/subscription) — faqat SUPER_ADMIN o'z rolini
    //    o'zgartira oladi, u ham oxirgi super_admin bo'lmasa
    if (
      userId === auth.user.id &&
      (action || directFields.role !== undefined || directFields.blocked !== undefined)
    ) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { success: false, error: "O'z rolingizni o'zgartira olmaysiz" },
          { status: 403 }
        )
      }
    }

    // Support both action-based (legacy) and direct field updates
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    let newRole: string | null = null
    let auditedAction = ''
    const auditDetails: Record<string, unknown> = {}

    if (action) {
      switch (action) {
        case 'block':
          if (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN') {
            return NextResponse.json(
              { success: false, error: 'Adminni bloklash mumkin emas' },
              { status: 403 }
            )
          }
          updatePayload.blocked = true
          auditedAction = 'user_block'
          break
        case 'unblock':
          updatePayload.blocked = false
          auditedAction = 'user_unblock'
          break
        case 'changeRole':
          newRole = String(data?.role || 'USER').toUpperCase()
          if (!ALLOWED_ROLES.has(newRole)) {
            return NextResponse.json(
              { success: false, error: `Noto\'g\'ri rol: ${newRole}` },
              { status: 400 }
            )
          }
          if (!canGrantRole(actorRole, newRole)) {
            return NextResponse.json(
              { success: false, error: 'Faqat SUPER_ADMIN admin rolini bera/olishi mumkin' },
              { status: 403 }
            )
          }
          // Oxirgi SUPER_ADMIN'ni tushirish taqiqlanadi
          if (targetRole === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
            const { count: superCount } = await supabase
              .from('registered_users')
              .select('id', { count: 'exact', head: true })
              .eq('role', 'SUPER_ADMIN')
            if ((superCount || 0) <= 1) {
              return NextResponse.json(
                { success: false, error: "Oxirgi SUPER_ADMIN rolini o'zgartirib bo'lmaydi" },
                { status: 409 }
              )
            }
          }
          updatePayload.role = newRole
          auditedAction = 'user_role_change'
          auditDetails.from = targetRole
          auditDetails.to = newRole
          break
        case 'changeSubscription':
          updatePayload.subscription_plan = data?.planId || 'free'
          updatePayload.subscription_expires_at =
            data?.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString()
          auditedAction = 'user_subscription_change'
          auditDetails.plan = updatePayload.subscription_plan
          break
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    } else {
      // Direct field updates (email AUTH tomonidan boshqariladi — bu yerda qabul qilinmaydi)
      if (directFields.role !== undefined) {
        newRole = String(directFields.role).toUpperCase()
        if (!ALLOWED_ROLES.has(newRole)) {
          return NextResponse.json(
            { success: false, error: `Noto\'g\'ri rol: ${newRole}` },
            { status: 400 }
          )
        }
        if (!canGrantRole(actorRole, newRole)) {
          return NextResponse.json(
            { success: false, error: 'Faqat SUPER_ADMIN admin rolini bera/olishi mumkin' },
            { status: 403 }
          )
        }
        if (targetRole === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
          const { count: superCount } = await supabase
            .from('registered_users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'SUPER_ADMIN')
          if ((superCount || 0) <= 1) {
            return NextResponse.json(
              { success: false, error: "Oxirgi SUPER_ADMIN rolini o'zgartirib bo'lmaydi" },
              { status: 409 }
            )
          }
        }
        updatePayload.role = newRole
        auditedAction = 'user_role_change'
        auditDetails.from = targetRole
        auditDetails.to = newRole
      }
      if (directFields.subscription_plan !== undefined) {
        updatePayload.subscription_plan = directFields.subscription_plan
        auditedAction = auditedAction || 'user_subscription_change'
        auditDetails.plan = directFields.subscription_plan
      }
      if (directFields.subscription_expires_at !== undefined) {
        updatePayload.subscription_expires_at = directFields.subscription_expires_at
      }
      if (directFields.blocked !== undefined) {
        if (directFields.blocked && (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN')) {
          return NextResponse.json(
            { success: false, error: 'Adminni bloklash mumkin emas' },
            { status: 403 }
          )
        }
        updatePayload.blocked = directFields.blocked
        auditedAction = auditedAction || (directFields.blocked ? 'user_block' : 'user_unblock')
      }
      if (directFields.name !== undefined) updatePayload.name = directFields.name
      // NOTE: email bu yerda YO'Q — auth.users tomonidan boshqariladi
    }

    const { error: updateError } = await supabase
      .from('registered_users')
      .update(updatePayload)
      .eq('id', userId)

    if (updateError) {
      console.error('[Admin Users] Update error:', updateError)
      await logAdminAction({
        admin: auth.user,
        action: auditedAction || 'user_update',
        targetType: 'user',
        targetId: userId,
        targetEmail: target.email || '',
        details: { ...auditDetails, error: updateError.message },
        success: false,
      })
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // ── auth.users metadata ni ham yangilash (tarif/rol sinxron qoladi) ──
    // Muammo root cause: registered_users o'zgaradi, lekin auth.users
    // raw_user_meta_data dagi eski qiymat saqlanadi. Har bir login/auth
    // UPDATE da trigger eski qiymatni qayta yozadi. Buni oldini olish uchun
    // ikkala manba bir vaqtda yangilanadi (best-effort).
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (
        suUrl &&
        srKey &&
        (updatePayload.subscription_plan !== undefined ||
          updatePayload.role !== undefined ||
          updatePayload.blocked !== undefined)
      ) {
        const adminClient = createClient(suUrl, srKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const metaUpdate: Record<string, unknown> = {}
        if (updatePayload.subscription_plan !== undefined) {
          metaUpdate.subscription_plan = updatePayload.subscription_plan
          metaUpdate.subscription_expires_at = updatePayload.subscription_expires_at || null
        }
        if (updatePayload.role !== undefined) {
          metaUpdate.role = updatePayload.role
        }
        if (updatePayload.blocked !== undefined) {
          metaUpdate.banned = updatePayload.blocked ? true : null
        }
        await adminClient.auth.admin.updateUserById(userId, { user_metadata: metaUpdate })
      }
    } catch {
      // Best-effort — registered_users allaqachon yangilandi
    }

    // Sezgir amal bo'lsa — audit log
    if (auditedAction) {
      await logAdminAction({
        admin: auth.user,
        action: auditedAction,
        targetType: 'user',
        targetId: userId,
        targetEmail: target.email || '',
        details: auditDetails,
        success: true,
      })
    }

    return NextResponse.json({ success: true, message: 'Foydalanuvchi maʼlumotlari yangilandi' })
  } catch (error) {
    console.error('[Admin Users] Error:', error)
    const message = error instanceof Error ? error.message : 'Xatolik yuz berdi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── DELETE - Admin-only: Remove user ──
// Himoya: o'z-o'zini o'chirish, boshqa adminni o'chirish, oxirgi SUPER_ADMIN
// o'chirish taqiqlanadi. Foydalanuvchi auth'dan ham o'chiriladi (profil yozuvi + auth).
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // O'z-o'zini o'chirish taqiqlanadi
    if (userId === auth.user.id) {
      return NextResponse.json(
        { success: false, error: "O'z hisobingizni o'chirib bo'lmaydi" },
        { status: 403 }
      )
    }

    const { data: target } = await supabase
      .from('registered_users')
      .select('id, role, email')
      .eq('id', userId)
      .maybeSingle()
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Foydalanuvchi topilmadi' },
        { status: 404 }
      )
    }
    const targetRole = String(target.role || 'USER').toUpperCase()

    const { data: actorRow } = await supabase
      .from('registered_users')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()
    const actorRole = String(actorRow?.role || 'USER').toUpperCase()

    // Admin/SUPER_ADMIN'ni faqat SUPER_ADMIN o'chira oladi
    if ((targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN') && actorRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: "Faqat SUPER_ADMIN adminni o'chirishi mumkin" },
        { status: 403 }
      )
    }

    // Oxirgi SUPER_ADMIN o'chirilmaydi
    if (targetRole === 'SUPER_ADMIN') {
      const { count: superCount } = await supabase
        .from('registered_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'SUPER_ADMIN')
      if ((superCount || 0) <= 1) {
        return NextResponse.json(
          { success: false, error: "Oxirgi SUPER_ADMIN o'chirilishi mumkin emas" },
          { status: 409 }
        )
      }
    }

    // Profil yozuvini o'chirish
    const { error } = await supabase.from('registered_users').delete().eq('id', userId)
    if (error) {
      await logAdminAction({
        admin: auth.user,
        action: 'user_delete',
        targetType: 'user',
        targetId: userId,
        targetEmail: target.email || '',
        details: { error: error.message },
        success: false,
      })
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Auth user'ni ham o'chirish (best-effort — login qila olmasin)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (suUrl && srKey) {
        const adminClient = createClient(suUrl, srKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        await adminClient.auth.admin.deleteUser(userId)
      }
    } catch {
      // Auth o'chirish best-effort — profil yozuvi allaqachon o'chirildi
    }

    await logAdminAction({
      admin: auth.user,
      action: 'user_delete',
      targetType: 'user',
      targetId: userId,
      targetEmail: target.email || '',
      details: { role: targetRole },
      success: true,
    })

    return NextResponse.json({ success: true, message: "Foydalanuvchi o'chirildi" })
  } catch (error) {
    console.error('[Admin Users] Delete error:', error)
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
