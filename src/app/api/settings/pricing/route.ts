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

    // Transform snake_case to camelCase + calculate discounted price
    const plans = (data || []).map(
      (p: {
        id?: string
        name?: string
        price?: number
        features?: unknown
        case_limit?: number
        caseLimit?: number
        limits?: unknown
        discount_percent?: number
        discount_label?: string
      }) => {
        const price = Number(p.price) || 0
        const discountPercent = Number(p.discount_percent) || 0
        const discountedPrice =
          discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price

        return {
          id: p.id,
          name: p.name,
          price,
          discountedPrice,
          discountPercent,
          discountLabel: p.discount_label || '',
          features: p.features || [],
          caseLimit: p.case_limit || p.caseLimit || -1,
          limits: p.limits || {},
        }
      }
    )

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
