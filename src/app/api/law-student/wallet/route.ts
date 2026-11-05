import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const admin = getSupabaseAdmin()

    // 1. Hamyon holati
    let { data: wallet } = await admin
      .from('student_wallets')
      .select('*')
      .eq('student_id', auth.user.id)
      .maybeSingle()

    if (!wallet) {
      const { data: created } = await admin
        .from('student_wallets')
        .insert({
          student_id: auth.user.id,
          balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        })
        .select()
        .single()
      wallet = created
    }

    // 2. Payout so'rovlari
    const { data: payouts } = await admin
      .from('student_payout_requests')
      .select('*')
      .eq('student_id', auth.user.id)
      .order('created_at', { ascending: false })

    // 3. Mukofotlar tarixi
    const { data: rewards } = await admin
      .from('student_rewards')
      .select('*')
      .eq('student_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    return NextResponse.json({
      success: true,
      wallet: {
        balance: Number(wallet?.balance || 0),
        pendingBalance: Number(wallet?.pending_balance || 0),
        totalEarned: Number(wallet?.total_earned || 0),
        totalWithdrawn: Number(wallet?.total_withdrawn || 0),
        minPayout: 100000,
      },
      payouts: payouts || [],
      rewards: rewards || [],
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { amount, cardNumber, cardHolderName } = body

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < 100000) {
      return NextResponse.json(
        { success: false, error: "Minimal pul yechish miqdori: 100 000 so'm" },
        { status: 400 }
      )
    }

    if (!cardNumber || cardNumber.replace(/\s+/g, '').length < 16) {
      return NextResponse.json(
        { success: false, error: "16 xonali Uzcard yoki Humo karta raqami kiritilishi shart" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Hamyon balansini tekshirish
    const { data: wallet } = await admin
      .from('student_wallets')
      .select('balance, pending_balance')
      .eq('student_id', auth.user.id)
      .single()

    const currentBalance = Number(wallet?.balance || 0)
    if (currentBalance < numAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Mablag' yetarli emas. Sizning balansingiz: ${currentBalance.toLocaleString()} so'm`,
        },
        { status: 400 }
      )
    }

    // 1. Yangi payout so'rovini yaratish
    const { data: payout, error: pErr } = await admin
      .from('student_payout_requests')
      .insert({
        student_id: auth.user.id,
        amount: numAmount,
        payment_method: 'card',
        card_number: cardNumber.replace(/\s+/g, ''),
        card_holder_name: (cardHolderName || auth.user.email?.split('@')[0] || 'Talaba').trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (pErr) {
      return NextResponse.json({ success: false, error: pErr.message }, { status: 500 })
    }

    // 2. Balansdan yechish va pending_balance ga o'tkazish
    await admin
      .from('student_wallets')
      .update({
        balance: currentBalance - numAmount,
        pending_balance: (Number(wallet?.pending_balance) || 0) + numAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', auth.user.id)

    return NextResponse.json({
      success: true,
      message:
        "Pul yechib olish so'rovi muvaffaqiyatli qabul qilindi. 24–48 soat ichida admin tomonidan kartangizga o'tkaziladi.",
      data: payout,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
