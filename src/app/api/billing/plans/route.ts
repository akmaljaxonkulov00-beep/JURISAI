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
      console.error('[Billing Plans] Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Tartib: free -> standart -> pro (id bo'yicha barqaror tartib)
    const order = ['free', 'standart', 'pro']
    const sorted = [...(data || [])].sort((a: { id?: string }, b: { id?: string }) => {
      const ia = order.indexOf(a.id || '')
      const ib = order.indexOf(b.id || '')
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })

    const plans = sorted.map(
      (p: {
        id?: string
        name?: string
        price?: number
        features?: unknown
        limits?: unknown
      }) => ({
        id: p.id,
        name: p.name,
        slug: p.id,
        description: '',
        price: Number(p.price) || 0,
        currency: "so'm",
        billingCycle: 'monthly',
        features: Array.isArray(p.features) ? p.features : [],
        limits: p.limits || {},
        isActive: true,
        isPublic: true,
      })
    )

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
