import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getPaymentAdminClient, approvePayment, rejectPayment } from '@/lib/payment-admin'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * POST /api/payments/manage
 *
 * Admin tomonidan to'lov boshqaruvi (approve/reject). FAQAT ADMIN session.
 * Barcha mantiq `@/lib/payment-admin` dagi yagona state machine orqali —
 * approve/reject route'lari bilan bir xil xatti-harakat.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { paymentId, action, reason } = body

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, error: 'paymentId and action are required' },
        { status: 400 }
      )
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const supabase = getPaymentAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 503 }
      )
    }

    const result =
      action === 'approve'
        ? await approvePayment(supabase, paymentId, auth.user.id)
        : await rejectPayment(supabase, paymentId, auth.user.id, reason)

    await logAdminAction({
      admin: auth.user,
      action: action === 'approve' ? 'payment_approve' : 'payment_reject',
      targetType: 'payment',
      targetId: paymentId,
      details: { paymentId, action, reason: reason || '' },
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
    console.error('[Payment Manage] Error:', error)
    const message = error instanceof Error ? error.message : 'Payment management failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
