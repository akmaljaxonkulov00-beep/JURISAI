import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response
    const supabase = getSupabaseAdmin()

    const { data: settings } = await supabase
      .from('platform_monetization_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    // Get aggregated statistics for citizen questions & revenue
    const [{ count: totalCitizenQuestions }, { count: totalLegalQuestions }] = await Promise.all([
      supabase.from('citizen_questions').select('*', { count: 'exact', head: true }),
      supabase.from('legal_questions').select('*', { count: 'exact', head: true }),
    ])
    const totalQuestions = (totalCitizenQuestions || 0) + (totalLegalQuestions || 0)

    const { count: paidPurchasesCount } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    return NextResponse.json({
      success: true,
      settings: settings || {
        free_questions_per_month: 2,
        single_question_price: 9900,
        pack5_questions_price: 39900,
        monthly_unlimited_price: 49900,
      },
      stats: {
        totalQuestions: totalQuestions || 0,
        paidPurchasesCount: paidPurchasesCount || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response
    const supabase = getSupabaseAdmin()

    const body = await req.json()
    const {
      freeQuestionsPerMonth,
      singleQuestionPrice,
      pack5QuestionsPrice,
      monthlyUnlimitedPrice,
    } = body

    const updatePayload = {
      free_questions_per_month: Number(freeQuestionsPerMonth) || 2,
      single_question_price: Number(singleQuestionPrice) || 9900,
      pack5_questions_price: Number(pack5QuestionsPrice) || 39900,
      monthly_unlimited_price: Number(monthlyUnlimitedPrice) || 49900,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('platform_monetization_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('platform_monetization_settings')
        .update(updatePayload)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('platform_monetization_settings')
        .insert({
          ...updatePayload,
          id: 'default',
        })
    }

    return NextResponse.json({ success: true, settings: updatePayload })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
