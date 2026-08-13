import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, userEmail, userName, plan, amount, receiptImage } = body

    if (!userEmail || !plan || !amount) {
      return NextResponse.json(
        { success: false, error: 'Email, plan and amount are required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      // Supabase not configured - silently skip logging
      return NextResponse.json({ success: true, note: 'Supabase not configured' })
    }

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
      plan,
      amount,
      receipt_image: receiptImage || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Payment log insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment logging API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Logging failed' },
      { status: 500 }
    )
  }
}
