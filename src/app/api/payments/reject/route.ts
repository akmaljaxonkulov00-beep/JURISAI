import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/payments/reject
 *
 * Admin tomonidan to'lovni rad etish.
 * payment_requests jadvalidagi statusni 'rejected' ga o'zgartiradi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, notes } = body

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Try payment_requests first (table from admin migration)
    const { data: prData } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (prData) {
      await supabase
        .from('payment_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', paymentId)

      // Foydalanuvchiga bildirishnoma yuborish (to'lov holati haqida)
      try {
        await supabase.from('user_notifications').insert({
          user_id: prData.user_id,
          type: 'error',
          category: 'payment',
          title: "To'lov rad etildi ❌",
          message: `To'lov tekshiruvdan o'tmadi${notes ? `: ${notes}` : ''}. Iltimos, yangi chek yuklang.`,
          action_url: '/premium',
          action_text: 'Qayta urinish',
        })
      } catch {}

      return NextResponse.json({
        success: true,
        message: "To'lov rad etildi",
      })
    }

    // Fallback: try 'payments' table (legacy)
    const { data: legacyPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (legacyPayment) {
      await supabase
        .from('payments')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          notes: notes || 'Payment rejected by admin',
        })
        .eq('id', paymentId)

      return NextResponse.json({
        success: true,
        message: "To'lov rad etildi",
      })
    }

    return NextResponse.json({ success: false, error: "To'lov topilmadi" }, { status: 404 })
  } catch (error: any) {
    console.error('Error rejecting payment:', error)
    return NextResponse.json(
      { success: false, error: error?.message || "To'lovni rad etishda xatolik" },
      { status: 500 }
    )
  }
}
