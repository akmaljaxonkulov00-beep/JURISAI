import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { plans } = body

    if (!plans || !Array.isArray(plans)) {
      return NextResponse.json(
        { success: false, error: 'Plans array is required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' })
    }

    // Fetch existing limits to preserve them
    const { data: existingPlans } = await supabase.from('pricing_plans').select('id, limits')

    const limitsMap: Record<string, any> = {}
    if (existingPlans) {
      existingPlans.forEach((p: any) => {
        if (p.id) limitsMap[p.id] = p.limits
      })
    }

    // Delete existing plans and re-insert
    const { error: deleteError } = await supabase
      .from('pricing_plans')
      .delete()
      .neq('id', 'nonexistent') // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('[Admin Pricing] Delete error:', deleteError)
    }

    // Insert updated plans (sort_order ustuni bazada bo'lmasa ham ishlaydi)
    const plansToInsert = plans.map((plan: Record<string, unknown>) => ({
      id: plan.id as string,
      name: String(plan.name || ''),
      price: Number(plan.price) || 0,
      features: Array.isArray(plan.features) ? plan.features : [],
      case_limit: Number(plan.caseLimit || plan.case_limit || -1),
      limits: limitsMap[plan.id as string] || (plan.limits as any) || {},
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('pricing_plans')
      .upsert(plansToInsert, { onConflict: 'id' })

    if (insertError) {
      await logAdminAction({
        admin: auth.user,
        action: 'pricing_update',
        targetType: 'pricing',
        targetId: 'plans',
        details: {
          planIds: plans.map((p: Record<string, unknown>) => String(p.id)),
          error: insertError.message,
        },
        success: false,
      })
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    await logAdminAction({
      admin: auth.user,
      action: 'pricing_update',
      targetType: 'pricing',
      targetId: 'plans',
      details: { planIds: plans.map((p: Record<string, unknown>) => String(p.id)) },
      success: true,
    })

    return NextResponse.json({ success: true, data: { count: plans.length } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
