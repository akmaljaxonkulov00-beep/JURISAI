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

    // CRITICAL: Use client-provided ID so admin can look up payment by same ID
    const paymentId = id || 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)

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
