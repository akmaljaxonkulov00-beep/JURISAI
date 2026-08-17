import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getPaymentAdminClient, approvePayment, rejectPayment } from '@/lib/payment-admin'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * Admin Payments API
 * GET  — to'lovlar ro'yxati (payment_requests)
 * PATCH — approve/reject (shared state machine orqali)
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const supabase = getPaymentAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected

    if (!supabase) {
      return NextResponse.json({
        success: true,
        payments: [],
        source: 'empty',
        message: 'Supabase mavjud emas',
      })
    }

    let query = supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({
        success: true,
        payments: [],
        source: 'empty',
        message: "To'lov jadvali mavjud emas",
      })
    }

    return NextResponse.json({
      success: true,
      payments: data || [],
      source: 'payment_requests',
    })
  } catch (error) {
    console.error('Admin payments API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { paymentId, action, reason } = body

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, error: 'paymentId va action talab qilinadi' },
        { status: 400 }
      )
    }

    const supabase = getPaymentAdminClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase mavjud emas' }, { status: 503 })
    }

    // Status/balans/admin tekshiruvi yagona payment-admin mantiqidan
    const result =
      action === 'approve'
        ? await approvePayment(supabase, paymentId, auth.user.id)
        : action === 'reject'
          ? await rejectPayment(supabase, paymentId, auth.user.id, reason)
          : {
              ok: false as const,
              status: 400,
              message: 'Action "approve" yoki "reject" bo\'lishi kerak',
            }

    if (action === 'approve' || action === 'reject') {
      await logAdminAction({
        admin: auth.user,
        action: action === 'approve' ? 'payment_approve' : 'payment_reject',
        targetType: 'payment',
        targetId: paymentId,
        details: { paymentId, action, reason: reason || '' },
        success: result.ok,
      })
    }

    return NextResponse.json(
      {
        success: result.ok,
        message: result.message,
        payment: result.ok ? result.payment : undefined,
      },
      { status: result.ok ? 200 : result.status }
    )
  } catch (error) {
    console.error('Admin payments PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update payment' }, { status: 500 })
  }
}
