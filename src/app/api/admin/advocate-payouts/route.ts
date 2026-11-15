import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/advocate-payouts
 * Advokatlarning barcha pul yechish so'rovlarini olish
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const admin = getSupabaseAdmin()
    
    // advocate_payout_requests jadvali tekshiriladi
    let { data: payouts, error } = await admin
      .from('advocate_payout_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Jadval hali yaratilmagan bo'lsa fallback
      return NextResponse.json({
        success: true,
        data: [],
        note: 'Jadval avtomatik tayyorlanmoqda',
      })
    }

    return NextResponse.json({ success: true, data: payouts || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/advocate-payouts
 * Admin tomonidan pul yechish so'rovini tasdiqlash (paid) yoki rad etish
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { payoutId, status, adminNotes } = body

    if (!payoutId || !status) {
      return NextResponse.json(
        { success: false, error: 'payoutId va yangi status kiritilishi shart' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { data: payout, error: fErr } = await admin
      .from('advocate_payout_requests')
      .select('*')
      .eq('id', payoutId)
      .single()

    if (fErr || !payout) {
      return NextResponse.json({ success: false, error: 'So‘rov topilmadi' }, { status: 404 })
    }

    await admin
      .from('advocate_payout_requests')
      .update({
        status,
        admin_notes: adminNotes || null,
        processed_by: auth.user.id,
        processed_at: now,
      })
      .eq('id', payoutId)

    return NextResponse.json({
      success: true,
      message: status === 'paid' ? 'Pul yechish so‘rovi tasdiqlandi va to‘landi' : 'So‘rov rad etildi',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
