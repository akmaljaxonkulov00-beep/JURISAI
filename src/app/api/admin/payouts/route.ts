import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const admin = getSupabaseAdmin()
    const { data: payouts, error } = await admin
      .from('student_payout_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: payouts || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

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
      .from('student_payout_requests')
      .select('*')
      .eq('id', payoutId)
      .single()

    if (fErr || !payout) {
      return NextResponse.json({ success: false, error: 'So‘rov topilmadi' }, { status: 404 })
    }

    // Statusni yangilash
    await admin
      .from('student_payout_requests')
      .update({
        status,
        admin_notes: adminNotes || null,
        processed_by: auth.user.id,
        processed_at: now,
      })
      .eq('id', payoutId)

    // Agar to'langan bo'lsa: pending_balance dan ayirib, total_withdrawn ga qo'shish
    if (status === 'paid') {
      const { data: wallet } = await admin
        .from('student_wallets')
        .select('*')
        .eq('student_id', payout.student_id)
        .single()

      if (wallet) {
        await admin
          .from('student_wallets')
          .update({
            pending_balance: Math.max(0, Number(wallet.pending_balance || 0) - Number(payout.amount)),
            total_withdrawn: Number(wallet.total_withdrawn || 0) + Number(payout.amount),
            updated_at: now,
          })
          .eq('student_id', payout.student_id)
      }
    } else if (status === 'rejected') {
      // Rad etilsa: pulni yana balansga qaytarish
      const { data: wallet } = await admin
        .from('student_wallets')
        .select('*')
        .eq('student_id', payout.student_id)
        .single()

      if (wallet) {
        await admin
          .from('student_wallets')
          .update({
            balance: Number(wallet.balance || 0) + Number(payout.amount),
            pending_balance: Math.max(0, Number(wallet.pending_balance || 0) - Number(payout.amount)),
            updated_at: now,
          })
          .eq('student_id', payout.student_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `So'rov statusi "${status}" ga o'zgartirildi`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
