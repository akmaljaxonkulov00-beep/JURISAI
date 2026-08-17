import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

// ── GET /api/admin/usage-limits ──────────────────────────────────────────
// Barcha tarif limitlari + per-user override'lar + Pro fair-use chegaralari
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const supabase = getSupabaseAdmin()

    const [plansRes, overridesRes, fairUseRes] = await Promise.all([
      supabase.from('pricing_plans').select('id, name, price, limits').order('created_at'),
      supabase.from('user_usage_limits').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('fair_use_limits').eq('id', 'global').maybeSingle(),
    ])

    const plans = (plansRes.data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: String(p.name || ''),
      price: Number(p.price) || 0,
      limits: (p.limits as Record<string, unknown>) || {},
    }))

    // fair_use_limits ustuni hali bazada bo'lmasa — bo'sh obyekt (frontend default ishlatadi)
    let fairUse: Record<string, number> = {}
    if (!fairUseRes.error && fairUseRes.data && fairUseRes.data.fair_use_limits) {
      fairUse = fairUseRes.data.fair_use_limits
    }

    return NextResponse.json({
      success: true,
      data: { plans, overrides: overridesRes.data || [], fair_use: fairUse },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── PUT /api/admin/usage-limits ──────────────────────────────────────────
// Body: { plans: [{ id, limits }], fair_use?: { feature: limit } } —
// tarif limitlarini va Pro fair-use chegaralarini yangilash
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { plans, fair_use } = await request.json()
    if (!Array.isArray(plans)) {
      return NextResponse.json({ success: false, error: 'plans array required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    for (const plan of plans) {
      if (!plan.id || typeof plan.limits !== 'object') continue
      const { error } = await supabase
        .from('pricing_plans')
        .update({ limits: plan.limits, updated_at: new Date().toISOString() })
        .eq('id', plan.id)
      if (error) throw error
    }

    // Pro fair-use chegaralarini saqlash (ustun hali mavjud bo'lmasa — postgrest xatosi, yumshoq o'tamiz)
    if (fair_use && typeof fair_use === 'object') {
      const { error: fairErr } = await supabase
        .from('site_settings')
        .update({ fair_use_limits: fair_use, updated_at: new Date().toISOString() })
        .eq('id', 'global')
      if (fairErr && !/column/i.test(fairErr.message)) throw fairErr
    }

    await logAdminAction({
      admin: auth.user,
      action: 'usage_limits_update',
      targetType: 'usage_limits',
      targetId: 'plans',
      details: {
        planIds: plans.map((p: Record<string, unknown>) => String(p.id)),
        fairUse: !!fair_use,
      },
      success: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── POST /api/admin/usage-limits ─────────────────────────────────────────
// Body: { userId, email?, feature, monthlyLimit, note? } — per-user override
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { userId, email, feature, monthlyLimit, note } = body

    if (!userId || !feature || typeof monthlyLimit !== 'number') {
      return NextResponse.json(
        { success: false, error: 'userId, feature va monthlyLimit kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('user_usage_limits')
      .upsert(
        {
          user_id: userId,
          email: email || '',
          feature,
          monthly_limit: monthlyLimit,
          note: note || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,feature' }
      )
      .select()
      .single()

    if (error) throw error
    await logAdminAction({
      admin: auth.user,
      action: 'usage_limit_override',
      targetType: 'user',
      targetId: userId,
      targetEmail: email || '',
      details: { feature, monthlyLimit },
      success: true,
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── DELETE /api/admin/usage-limits?id=... ────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('user_usage_limits').delete().eq('id', id)
    if (error) throw error
    await logAdminAction({
      admin: auth.user,
      action: 'usage_limit_delete',
      targetType: 'usage_limits',
      targetId: id,
      success: true,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
