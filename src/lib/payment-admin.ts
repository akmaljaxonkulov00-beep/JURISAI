import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TO'LOV BOSHQARUVI — YAGONA SERVER-SIDE MANBA
 *
 * Barcha admin to'lov amallari (approve/reject) shu yerda bajariladi.
 * - Status state machine: pending → approved | rejected | cancelled | expired
 * - Faqat 'pending' to'lov tasdiqlanishi/rad etilishi mumkin.
 * - Takroriy tasdiqlash idempotent — balans ikki marta qo'shilmaydi.
 * - Tarif (plan) va narx faqat `pricing_plans` jadvalidan — client ishonilmaydi.
 * - Subskriptiya faqat tasdiqlangan to'lovdan keyin faollashadi.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface ServerPlan {
  id: string
  name: string
  price: number
  billing_cycle?: string | null
  limits?: Record<string, unknown> | null
}

export interface PaymentRecord {
  id?: string
  user_id?: string | null
  user_email?: string | null
  user_name?: string | null
  plan?: string | null
  plan_id?: string | null
  amount?: number | string | null
  status?: string | null
  created_at?: string | null
  processed_at?: string | null
}

export type PaymentActionResult =
  | { ok: true; status?: number; message: string; payment?: PaymentRecord | null }
  | { ok: false; status: number; message: string }

export type PaymentState = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired'

const PAYMENT_STATES: PaymentState[] = ['pending', 'approved', 'rejected', 'cancelled', 'expired']

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Service-role klienti — faqat server tomonda, authz'dan KEYIN ishlatiladi. */
export function getPaymentAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function isPaymentState(value: string): value is PaymentState {
  return PAYMENT_STATES.includes(value as PaymentState)
}

/**
 * Tarifni pricing_plans'dan topish — faqat server tomondan.
 * ref: plan id ('standart') yoki nomi ('Standart') bo'lishi mumkin.
 */
export async function resolvePlan(
  supabase: SupabaseClient,
  ref: string
): Promise<ServerPlan | null> {
  if (!ref) return null
  const trimmed = String(ref).trim()
  if (!trimmed) return null

  const byId = await supabase.from('pricing_plans').select('*').eq('id', trimmed).maybeSingle()
  if (byId.data) return byId.data as ServerPlan

  const byName = await supabase
    .from('pricing_plans')
    .select('*')
    .ilike('name', trimmed)
    .maybeSingle()
  return (byName.data as ServerPlan) || null
}

/** Subskriptiya muddati — monthly → +1 oy, yearly → +1 yil. */
export function computeSubscriptionEnd(plan: ServerPlan, now: Date = new Date()): string {
  const end = new Date(now.getTime())
  const cycle = String(plan?.billing_cycle || 'monthly').toLowerCase()
  if (cycle === 'year' || cycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString()
}

/**
 * To'lovga tegishli foydalanuvchini registered_users'dan topish.
 * payment.user_id — uuid yoki email bo'lishi mumkin (legacy), ikkalasi ham tekshiriladi.
 */
async function findRegisteredUser(
  supabase: SupabaseClient,
  payment: PaymentRecord
): Promise<{ id: string } | null> {
  const userId = String(payment?.user_id || '')
  if (UUID_RE.test(userId)) {
    const { data } = await supabase
      .from('registered_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (data) return data
  }
  const email = String(payment?.user_email || '')
  if (email) {
    const { data } = await supabase
      .from('registered_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (data) return data
  }
  return null
}

/** To'lovni tasdiqlash. Faqat pending → approved. Takroriy chaqiruv idempotent. */
export async function approvePayment(
  supabase: SupabaseClient,
  paymentId: string,
  adminId: string
): Promise<PaymentActionResult> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle()
  const payment = data as PaymentRecord | null

  if (error || !payment) {
    return { ok: false, status: 404, message: "To'lov topilmadi" }
  }

  const current = String(payment.status || 'pending').toLowerCase()

  // State machine — takroriy tasdiqlash balansni ikki marta qo'shmaydi
  if (current === 'approved') {
    return { ok: true, message: "To'lov allaqachon tasdiqlangan", payment }
  }
  if (current !== 'pending') {
    return {
      ok: false,
      status: 409,
      message: `Faqat kutilayotgan to'lov tasdiqlanishi mumkin (hozirgi holat: ${current})`,
    }
  }

  // Tarif va narx — faqat server tomondagi pricing_plans'dan
  const plan = await resolvePlan(supabase, payment.plan || payment.plan_id || '')
  if (!plan || Number(plan.price) <= 0) {
    return {
      ok: false,
      status: 400,
      message: `Tarif topilmadi: ${payment.plan || payment.plan_id}`,
    }
  }

  const amount = Number(payment.amount != null ? payment.amount : plan.price)
  const expiresAt = computeSubscriptionEnd(plan)
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('payment_requests')
    .update({
      status: 'approved',
      processed_at: now,
      processed_by: adminId,
      plan_id: plan.id,
      updated_at: now,
    })
    .eq('id', paymentId)

  if (updateError) {
    return { ok: false, status: 500, message: updateError.message }
  }

  const user = await findRegisteredUser(supabase, payment)
  if (user) {
    // Balansni yangilash (mavjud balansga qo'shish)
    const { data: currentUser } = await supabase
      .from('registered_users')
      .select('balance')
      .eq('id', user.id)
      .maybeSingle()
    const newBalance = Number(currentUser?.balance || 0) + amount

    await supabase
      .from('registered_users')
      .update({
        balance: newBalance,
        subscription_plan: plan.id,
        subscription_expires_at: expiresAt,
        updated_at: now,
      })
      .eq('id', user.id)

    // Auth metadata — premium sayt bo'ylab darhol faollashadi
    try {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { subscription_plan: plan.id, subscription_expires_at: expiresAt },
      })
    } catch {
      /* non-critical */
    }

    // Bildirishnoma
    try {
      await supabase.from('user_notifications').insert({
        user_id: user.id,
        type: 'success',
        category: 'payment',
        title: "To'lov tasdiqlandi ✅",
        message: `"${plan.name}" tarifi faollashtirildi. ${amount.toLocaleString()} so'm to'lov muvaffaqiyatli tasdiqlandi.`,
        action_url: '/dashboard',
        action_text: "Dashboardga o'tish",
      })
    } catch {
      /* non-critical */
    }
  }

  return { ok: true, message: "To'lov tasdiqlandi", payment }
}

/** To'lovni rad etish. Faqat pending → rejected. Takroriy chaqiruv idempotent. */
export async function rejectPayment(
  supabase: SupabaseClient,
  paymentId: string,
  adminId: string,
  reason?: string
): Promise<PaymentActionResult> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle()
  const payment = data as PaymentRecord | null

  if (error || !payment) {
    return { ok: false, status: 404, message: "To'lov topilmadi" }
  }

  const current = String(payment.status || 'pending').toLowerCase()

  if (current === 'rejected') {
    return { ok: true, message: "To'lov allaqachon rad etilgan", payment }
  }
  if (current !== 'pending') {
    return {
      ok: false,
      status: 409,
      message: `Faqat kutilayotgan to'lov rad etilishi mumkin (hozirgi holat: ${current})`,
    }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('payment_requests')
    .update({
      status: 'rejected',
      processed_at: now,
      processed_by: adminId,
      reject_reason: reason || '',
      updated_at: now,
    })
    .eq('id', paymentId)

  if (updateError) {
    return { ok: false, status: 500, message: updateError.message }
  }

  const user = await findRegisteredUser(supabase, payment)
  if (user) {
    try {
      await supabase.from('user_notifications').insert({
        user_id: user.id,
        type: 'error',
        category: 'payment',
        title: "To'lov rad etildi ❌",
        message: `To'lov tekshiruvdan o'tmadi${reason ? `: ${reason}` : ''}. Iltimos, qayta urinib ko'ring.`,
        action_url: '/premium',
        action_text: 'Qayta urinish',
      })
    } catch {
      /* non-critical */
    }
  }

  return { ok: true, message: "To'lov rad etildi", payment }
}
