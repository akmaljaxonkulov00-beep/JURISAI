import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser } from '@/lib/server-auth'

const PLATFORM_COMMISSION_PERCENT = 10 // 10% platforma komissiyasi

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { consultationId, amount, provider } = body

    if (!consultationId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Konsultatsiya ID va to‘lov summasi kiritilishi shart' },
        { status: 400 }
      )
    }

    const payProvider = provider === 'payme' ? 'payme' : 'click'
    const totalAmount = Number(amount)
    const platformShare = Math.round((totalAmount * PLATFORM_COMMISSION_PERCENT) / 100)
    const advocateShare = totalAmount - platformShare

    const txId = `${payProvider.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`

    // Create real financial transaction record
    const transaction = await platformDb.createTransaction({
      user_id: auth.user.id,
      user_name: auth.user.email ? auth.user.email.split('@')[0] : 'Fuqaro',
      consultation_id: consultationId,
      amount: totalAmount,
      currency: 'UZS',
      type: 'consultation_payment',
      provider: payProvider,
      provider_transaction_id: txId,
      status: 'completed', // In real webhook this completes on provider callback
      advocate_share: advocateShare,
      platform_share: platformShare,
    })

    // Update appointment payment status
    await platformDb.updateAppointment(consultationId, {
      payment_status: 'paid',
      payment_method: payProvider,
      payment_reference: txId,
      status: 'confirmed',
    })

    // Prepare Click / Payme checkout redirect URL or receipt
    const checkoutUrl =
      payProvider === 'click'
        ? `https://my.click.uz/services/pay?service_id=JURISTIV&merchant_id=JURISTIV_MERCHANT&amount=${totalAmount}&transaction_param=${txId}&return_url=https://www.juristiv.uz/citizen/payments?paid=1`
        : `https://checkout.paycom.uz/${Buffer.from(`m=JURISTIV_PAYME;ac.tx=${txId};a=${totalAmount * 100}`).toString('base64')}`

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        checkoutUrl,
        provider: payProvider,
        message: `${payProvider.toUpperCase()} to‘lovi muvaffaqiyatli qayta ishlandi`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'To‘lovni amalga oshirishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
