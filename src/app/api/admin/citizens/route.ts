import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/citizens
 * Barcha fuqarolarni olish, filtrlash, balans va obunalar bo'yicha saralash
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const plan = searchParams.get('plan') || 'all'
    const status = searchParams.get('status') || 'all'

    const admin = getSupabaseAdmin()
    const { data: users, error } = await admin
      .from('registered_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Fuqarolar (roli USER yoki citizen yoki undefined bo'lganlar, ya'ni ADMIN yoki ADVOCATE emaslar)
    let citizens = (users || []).filter((u: any) => {
      const r = (u.role || '').toUpperCase()
      return r !== 'ADMIN' && r !== 'SUPER_ADMIN' && r !== 'ADVOCATE' && r !== 'LAW_STUDENT'
    })

    // Plan filter
    if (plan !== 'all') {
      citizens = citizens.filter((c: any) => (c.subscription_plan || 'free') === plan)
    }

    // Status filter
    if (status !== 'all') {
      citizens = citizens.filter((c: any) =>
        status === 'blocked' ? c.blocked : !c.blocked
      )
    }

    // Search filter
    if (search) {
      citizens = citizens.filter((c: any) =>
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.full_name && c.full_name.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.phone && c.phone.toLowerCase().includes(search)) ||
        (c.city && c.city.toLowerCase().includes(search))
      )
    }

    const allCitizens = (users || []).filter((u: any) => {
      const r = (u.role || '').toUpperCase()
      return r !== 'ADMIN' && r !== 'SUPER_ADMIN' && r !== 'ADVOCATE'
    })

    const stats = {
      total: allCitizens.length,
      active: allCitizens.filter((c: any) => !c.blocked).length,
      blocked: allCitizens.filter((c: any) => c.blocked).length,
      pro: allCitizens.filter((c: any) => c.subscription_plan === 'pro').length,
      premium: allCitizens.filter((c: any) => c.subscription_plan === 'premium').length,
      total_balance: allCitizens.reduce((acc: number, c: any) => acc + (c.balance || 0), 0),
    }

    return NextResponse.json({
      success: true,
      stats,
      citizens,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/citizens
 * Fuqaroni bloklash/ochish, balansini o'zgartirish, obuna tarifini belgilash
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { citizenId, action, blocked, balanceChange, subscriptionPlan, subscriptionExpiresAt } = body

    if (!citizenId) {
      return NextResponse.json({ success: false, error: 'citizenId ko‘rsatilmadi' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()
    const updates: Record<string, any> = { updated_at: now }

    if (action === 'toggle_block' || blocked !== undefined) {
      updates.blocked = Boolean(blocked)
      updates.status = blocked ? 'blocked' : 'active'
    }

    if (subscriptionPlan) {
      updates.subscription_plan = subscriptionPlan
      if (subscriptionExpiresAt) {
        updates.subscription_expires_at = subscriptionExpiresAt
      } else {
        // default 30 kun
        const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        updates.subscription_expires_at = exp
      }
    }

    if (balanceChange !== undefined && Number.isFinite(Number(balanceChange))) {
      const { data: userRecord } = await admin
        .from('registered_users')
        .select('balance')
        .eq('id', citizenId)
        .single()
      const current = userRecord?.balance || 0
      updates.balance = Math.max(0, current + Number(balanceChange))
    }

    const { data: updated, error } = await admin
      .from('registered_users')
      .update(updates)
      .eq('id', citizenId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, citizen: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
