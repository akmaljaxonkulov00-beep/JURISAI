import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getPaymentAdminClient,
  resolvePlan,
  approvePayment,
  type PaymentRecord,
} from '@/lib/payment-admin'

/**
 * POST /api/billing/payment — Payme webhook
 *
 * XAVFSIZLIK:
 * - PAYME_MERCHANT_KEY environment variable'isiz endpoint UMUMAN ishlamaydi (503).
 *   Soxta/webhook'ni chaqirib subskriptiya faollashtirib bo'lmaydi.
 * - Har bir so'rov Payme imzosi bilan tekshiriladi:
 *   sign = base64(sha1(merchant_key + sha1(JSON.stringify(params))))
 * - To'lov faqat 'pending' → 'approved' state machine orqali tasdiqlanadi
 *   (approvePayment — takroriy tasdiqlash balansni ikki marta qo'shmaydi).
 * - Tarif/narx faqat pricing_plans'dan.
 */

type PaymeParams = Record<string, unknown>

function paymeSignature(merchantKey: string, params: PaymeParams): string {
  const payload = JSON.stringify(params)
  const inner = crypto.createHash('sha1').update(payload).digest()
  const outer = crypto
    .createHash('sha1')
    .update(Buffer.concat([Buffer.from(merchantKey, 'utf8'), inner]))
    .digest('base64')
  return outer
}

function paymeError(id: unknown, code: number, message: string) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  })
}

export async function POST(request: NextRequest) {
  try {
    const merchantKey = process.env.PAYME_MERCHANT_KEY
    if (!merchantKey) {
      // Payme integratsiyasi sozlanmagan — soxta chaqiruvlar ishlamaydi
      return NextResponse.json({ error: 'Payme integratsiyasi sozlanmagan' }, { status: 503 })
    }

    const body = await request.json()
    const { method, params, id, sign } = body || {}

    if (!method || !params) {
      return paymeError(id, -32700, 'Invalid request')
    }

    // Imzoni tekshirish
    const expected = paymeSignature(merchantKey, params as PaymeParams)
    const provided = String(sign || '')
    const valid =
      provided.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    if (!valid) {
      return paymeError(id, -32504, 'Invalid signature')
    }

    const supabase = getPaymentAdminClient()
    if (!supabase) {
      return paymeError(id, -32500, 'Supabase not configured')
    }

    const p = params as PaymeParams
    switch (method) {
      case 'CheckPerformTransaction':
        return checkPerform(supabase, id, p)
      case 'CreateTransaction':
        return createTransaction(supabase, id, p)
      case 'PerformTransaction':
        return performTransaction(supabase, id, p)
      case 'CancelTransaction':
        return cancelTransaction(supabase, id, p)
      case 'CheckTransaction':
        return checkTransaction(supabase, id, p)
      case 'GetStatement':
        return getStatement(supabase, id, p)
      default:
        return paymeError(id, -32601, 'Method not found')
    }
  } catch (error) {
    console.error('Payme webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function accountOf(params: PaymeParams): Record<string, string> {
  return (params.account || {}) as Record<string, string>
}

/** account.user_id + account.plan_id + amount tekshiruvi */
async function validateOrder(
  supabase: SupabaseClient,
  params: PaymeParams
): Promise<{ plan: { id: string; name: string; price: number }; userId: string } | null> {
  const account = accountOf(params)
  const plan = await resolvePlan(supabase, account.plan_id || '')
  if (!plan || Number(plan.price) <= 0) return null
  const userId = String(account.user_id || '')
  if (!userId) return null
  const amountTiyin = Number(params.amount)
  if (amountTiyin > 0 && amountTiyin !== Math.round(Number(plan.price) * 100)) return null
  return { plan, userId }
}

async function checkPerform(supabase: SupabaseClient, id: unknown, params: PaymeParams) {
  const order = await validateOrder(supabase, params)
  if (!order) {
    return paymeError(id, -31050, 'Invalid order')
  }
  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: { allow: true },
  })
}

async function createTransaction(supabase: SupabaseClient, id: unknown, params: PaymeParams) {
  const order = await validateOrder(supabase, params)
  if (!order) {
    return paymeError(id, -31050, 'Invalid order')
  }

  const paymeTxnId = String(params.id || '')
  if (!paymeTxnId) return paymeError(id, -32700, 'Transaction id required')

  // Bir xil Payme tranzaksiyasi takroran yaratilmasin
  const { data: existing } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('provider_transaction_id', paymeTxnId)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        create_time: new Date(existing.created_at).getTime(),
        transaction: existing.id,
        state: existing.status === 'approved' ? 2 : 1,
      },
    })
  }

  const { data: payment, error } = await supabase
    .from('payment_requests')
    .insert({
      user_id: order.userId,
      user_email: '',
      user_name: '',
      plan: order.plan.id,
      plan_id: order.plan.id,
      amount: Number(order.plan.price),
      status: 'pending',
      provider: 'payme',
      provider_transaction_id: paymeTxnId,
      billing_cycle: 'monthly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Payme createTransaction error:', error)
    return paymeError(id, -32500, 'Failed to create transaction')
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: { create_time: Date.now(), transaction: payment.id, state: 1 },
  })
}

async function performTransaction(supabase: SupabaseClient, id: unknown, params: PaymeParams) {
  const paymeTxnId = String(params.id || '')
  const { data } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('provider_transaction_id', paymeTxnId)
    .maybeSingle()
  const payment = data as PaymentRecord | null

  if (!payment) {
    return paymeError(id, -32400, 'Transaction not found')
  }

  // To'lov egasini tekshirish — boshqa foydalanuvchi to'lovini bajara olmaydi
  const accountUserId = String(accountOf(params).user_id || '')
  if (accountUserId && String(payment.user_id) !== accountUserId) {
    return paymeError(id, -32504, 'Order mismatch')
  }

  // Faqat pending to'lov tasdiqlanadi; approved bo'lsa idempotent
  const result = await approvePayment(supabase, payment.id || '', 'payme-webhook')
  if (!result.ok && result.status !== 404) {
    return paymeError(id, -32500, result.message)
  }

  const { data: updated } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', payment.id)
    .maybeSingle()

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      perform_time: Date.now(),
      transaction: payment.id,
      state: updated?.status === 'approved' ? 2 : 1,
    },
  })
}

async function cancelTransaction(supabase: SupabaseClient, id: unknown, params: PaymeParams) {
  const paymeTxnId = String(params.id || '')
  const { data } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('provider_transaction_id', paymeTxnId)
    .maybeSingle()
  const payment = data as PaymentRecord | null

  if (!payment) return paymeError(id, -32400, 'Transaction not found')

  if (payment.status === 'pending') {
    await supabase
      .from('payment_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', payment.id)
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: { cancel_time: Date.now(), transaction: payment.id, state: -1 },
  })
}

async function checkTransaction(supabase: SupabaseClient, id: unknown, params: PaymeParams) {
  const paymeTxnId = String(params.id || '')
  const { data } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('provider_transaction_id', paymeTxnId)
    .maybeSingle()
  const payment = data as PaymentRecord | null

  const state = payment?.status === 'approved' ? 2 : payment?.status === 'cancelled' ? -1 : 1

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      create_time: payment?.created_at ? new Date(payment.created_at).getTime() : Date.now(),
      perform_time: payment?.processed_at ? new Date(payment.processed_at).getTime() : 0,
      cancel_time: 0,
      transaction: payment?.id,
      state,
      reason: 0,
    },
  })
}

async function getStatement(supabase: SupabaseClient, id: unknown, params: PaymeParams) {
  const from = new Date(Number(params.from || 0)).toISOString()
  const to = new Date(Number(params.to || Date.now())).toISOString()

  const { data: rows } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('provider', 'payme')
    .gte('created_at', from)
    .lte('created_at', to)

  const transactions = ((rows as PaymentRecord[] | null) || []).map((row: PaymentRecord) => ({
    id: row.id,
    time: row.created_at ? new Date(row.created_at).getTime() : 0,
    amount: Math.round(Number(row.amount || 0) * 100),
    type: 1,
    state: row.status === 'approved' ? 2 : 1,
  }))

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: { transactions },
  })
}
