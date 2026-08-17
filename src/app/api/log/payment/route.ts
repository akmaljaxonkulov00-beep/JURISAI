import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/server-auth'
import { resolvePlan } from '@/lib/payment-admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, userName, plan, receiptImage } = body

    // Identity session'dan — client yuborgan userId/userEmail ishonilmaydi
    const userId = auth.user.id
    const userEmail = auth.user.email

    if (!userEmail || !plan) {
      return NextResponse.json({ success: false, error: 'Email va plan required' }, { status: 400 })
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      // Supabase not configured - silently skip logging
      return NextResponse.json({ success: true, note: 'Supabase not configured' })
    }

    // Tarif va narx — faqat server tomondagi pricing_plans'dan.
    // Client yuborgan amount ishonilmaydi, haqiqiy narx bazadan olinadi.
    const resolved = await resolvePlan(supabase, plan)
    if (!resolved || Number(resolved.price) <= 0) {
      return NextResponse.json(
        { success: false, error: `Tarif topilmadi: ${plan}` },
        { status: 400 }
      )
    }
    const planId = resolved.id
    const amount = Number(resolved.price)

    // CRITICAL: payment_requests.id — UUID tipida. Frontend matn ID yuboradi
    // ('pay_...'), shuning uchun UUID server tomonda generatsiya qilinadi,
    // aks holda insert fail bo'lib chek adminga yetib bormaydi.
    let paymentId = id
    try {
      // UUID formatida bo'lmasa yoki yo'q bo'lsa yangi UUID generatsiya qilamiz
      if (
        !paymentId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)
      ) {
        paymentId = crypto.randomUUID()
      }
    } catch {
      paymentId = crypto.randomUUID()
    }

    const { error } = await supabase.from('payment_requests').insert({
      id: paymentId,
      user_id: userId || userEmail,
      user_email: userEmail,
      user_name: userName || '',
      plan: planId,
      plan_id: planId,
      amount,
      receipt_image: receiptImage || '',
      status: 'pending',
      billing_cycle: 'monthly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Payment log insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Logging failed'
    console.error('Payment logging API error:', e)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
