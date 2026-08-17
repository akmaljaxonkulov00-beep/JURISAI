import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getErrorMessage } from '@/lib/errors'

export async function GET() {
  try {
    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' })
    }

    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Pricing Public] Error:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    // Transform snake_case to camelCase
    const plans = (data || []).map(
      (p: {
        id?: string
        name?: string
        price?: number
        features?: unknown
        case_limit?: number
        caseLimit?: number
        limits?: unknown
      }) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        features: p.features || [],
        caseLimit: p.case_limit || p.caseLimit || -1,
        limits: p.limits || {}, // tarif limitlari (har bir funksiya bo'yicha)
      })
    )

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
