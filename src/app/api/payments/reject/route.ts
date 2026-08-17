import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getPaymentAdminClient, rejectPayment } from '@/lib/payment-admin'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * POST /api/payments/reject
 *
 * FAQAT ADMIN session (server-side tekshiruv).
 * State machine: faqat 'pending' → 'rejected'; takroriy chaqiruv idempotent.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { paymentId, notes } = body

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 })
    }

    const supabase = getPaymentAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 503 }
      )
    }

    const result = await rejectPayment(supabase, paymentId, auth.user.id, notes)
    await logAdminAction({
      admin: auth.user,
      action: 'payment_reject',
      targetType: 'payment',
      targetId: paymentId,
      details: { paymentId, reason: notes || '' },
      success: result.ok,
    })
    return NextResponse.json(
      {
        success: result.ok,
        message: result.message,
        payment: result.ok ? result.payment : undefined,
      },
      { status: result.ok ? 200 : result.status }
    )
  } catch (error) {
    console.error('Error rejecting payment:', error)
    const message = error instanceof Error ? error.message : "To'lovni rad etishda xatolik"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
