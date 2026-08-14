import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// ── GET /api/admin/usage-limits ──────────────────────────────────────────
// Barcha tarif limitlari + per-user override'lar + Pro fair-use chegaralari
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const [plansRes, overridesRes, fairUseRes] = await Promise.all([
      supabase.from('pricing_plans').select('id, name, price, limits').order('sort_order'),
      supabase.from('user_usage_limits').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('fair_use_limits').eq('id', 'global').maybeSingle(),
    ])

    const plans = (plansRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      limits: p.limits || {},
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}

// ── PUT /api/admin/usage-limits ──────────────────────────────────────────
// Body: { plans: [{ id, limits }], fair_use?: { feature: limit } } —
// tarif limitlarini va Pro fair-use chegaralarini yangilash
export async function PUT(request: NextRequest) {
  try {
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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}

// ── POST /api/admin/usage-limits ─────────────────────────────────────────
// Body: { userId, email?, feature, monthlyLimit, note? } — per-user override
export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}

// ── DELETE /api/admin/usage-limits?id=... ────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('user_usage_limits').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}
