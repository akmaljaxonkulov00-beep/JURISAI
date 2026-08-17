import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getPaymentAdminClient, approvePayment } from '@/lib/payment-admin'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * POST /api/payments/approve
 *
 * FAQAT ADMIN session (server-side tekshiruv) — oddiy foydalanuvchi yoki
 * tashrif buyuruvchi to'lovni tasdiqlay olmaydi.
 * State machine: faqat 'pending' → 'approved'; takroriy chaqiruv idempotent.
 * Tarif/narx server tomondagi pricing_plans'dan olinadi.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { paymentId } = body

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

    const result = await approvePayment(supabase, paymentId, auth.user.id)
    await logAdminAction({
      admin: auth.user,
      action: 'payment_approve',
      targetType: 'payment',
      targetId: paymentId,
      details: { paymentId },
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
    console.error('Error approving payment:', error)
    const message = error instanceof Error ? error.message : "To'lovni tasdiqlashda xatolik"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
