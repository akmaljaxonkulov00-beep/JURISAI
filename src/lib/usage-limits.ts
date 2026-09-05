// ═══════════════════════════════════════════════════════════════════════════
// usage-limits.ts — AI FOYDALANISH LIMITLARI (markaziy tekshiruv)
//
// Har bir AI funksiyasi Groq'ga so'rov yuborishdan OLDIN shu yerdan
// checkAndIncrement() ni chaqiradi. Limit tugagan bo'lsa 429 qaytariladi.
//
// Limit manbalari (ustunlik tartibida):
//   1. user_usage_limits  — admin shaxsan bergan limit (per-user override)
//   2. pricing_plans.limits — tarif (Bepul/Standart/Pro) limiti
//   3. DEFAULT_LIMITS     — kod ichidagi zaxira (baza sozlanmagan bo'lsa)
//
// -1 = cheksiz
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Identity: request'dan foydalanuvchini aniqlash ────────────────────────
/**
 * NextRequest'dan foydalanuvchi identity sini aniqlaydi.
 * 1) Body ichidagi userId/email (mavjud bo'lsa)
 * 2) sb-access-token cookie (Supabase JWT — sub va email)
 */
/**
 * Identity FAQAT tasdiqlangan Supabase session'dan olinadi: token Supabase
 * `auth.getUser` orqali server tomonda TEKSHIRILADI (imzo + amal qilish
 * muddati). Client tomonidan yuborilgan userId/email ishonilmaydi — aks holda
 * boshqa foydalanuvchining limitini ishlatish yoki soxta token bilan chetlab
 * o'tish mumkin bo'lardi.
 */
interface IdentityRequest {
  headers?: { get?: (name: string) => string | null }
  cookies?: { get?: (name: string) => { value?: string } | undefined }
}

export async function getIdentityFromRequest(
  request: IdentityRequest
): Promise<{ userId?: string; email?: string }> {
  let token: string | undefined
  const authHeader = request?.headers?.get?.('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim()
  } else {
    token = request?.cookies?.get?.('sb-access-token')?.value
  }

  if (!token) return {}

  try {
    const client = getVerifyClient()
    if (!client) return {}
    const { data, error } = await client.auth.getUser(token)
    if (error || !data?.user) return {}
    return { userId: data.user.id, email: data.user.email || undefined }
  } catch {
    return {}
  }
}

let _verifyClient: SupabaseClient | null = null
function getVerifyClient() {
  if (_verifyClient) return _verifyClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const { createClient } =
    require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')
  _verifyClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _verifyClient
}

// ── Feature kalitlari va o'zbekcha nomlari ─────────────────────────────────
export const FEATURES: Record<string, string> = {
  ai_chat: "AI chat (huquqiy so'rov)",
  irac: 'IRAC tahlil',
  document_generate: 'Hujjat generator',
  document_analysis: 'Hujjat tahlili',
  virtual_court: 'Virtual sud',
  decision_tree: 'Qarorlar daraxti (AI)',
  speech_stt: 'Ovozli yozuv (STT)',
  scenario: 'Senariy generator',
}

// ── Default limitlar (baza sozlanmagan/bo'sh bo'lsa) ──────────────────────
export const DEFAULT_LIMITS: Record<string, Record<string, number>> = {
  free: {
    ai_chat: 10,
    irac: 3,
    document_generate: 3,
    document_analysis: 2,
    virtual_court: 2,
    decision_tree: 2,
    speech_stt: 5,
    scenario: 3,
  },
  standart: {
    ai_chat: 200,
    irac: -1,
    document_generate: 50,
    document_analysis: 20,
    virtual_court: 5,
    decision_tree: 20,
    speech_stt: 100,
    scenario: 20,
  },
  pro: {
    ai_chat: -1,
    irac: -1,
    document_generate: -1,
    document_analysis: -1,
    virtual_court: -1,
    decision_tree: -1,
    speech_stt: -1,
    scenario: -1,
  },
}

// ── Pro tarif uchun ADOLATLI ISHLATISH (fair use) chegaralari ─────────────
// UI'da Pro "cheksiz" ko'rinadi, lekin suiste'moldan himoya qilish uchun
// oylik yuqori chegara qo'llaniladi. site_settings.fair_use_limits JSONB dan
// o'qiladi, kolonna yo'q bo'lsa shu default ishlaydi.
export const FAIR_USE_LIMITS: Record<string, number> = {
  ai_chat: 2000,
  irac: 500,
  document_generate: 300,
  document_analysis: 300,
  virtual_court: 100,
  decision_tree: 300,
  speech_stt: 500,
  scenario: 200,
}

/** site_settings (key-value) dan chegarani o'qiydi */
async function getFairUseLimit(feature: string): Promise<number | null> {
  try {
    const supabase = await getSupabaseAdminLazy()
    if (supabase) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'fair_use_limits')
        .maybeSingle()
      if (!error && data && data.value) {
        try {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
          if (parsed && typeof parsed === 'object') {
            const val = (parsed as Record<string, unknown>)[feature]
            if (typeof val === 'number' && val > 0) return val
          }
        } catch {
          /* noto'g'ri JSON — default ishlatiladi */
        }
      }
    }
  } catch {}
  const def = FAIR_USE_LIMITS[feature]
  return typeof def === 'number' && def > 0 ? def : null
}

export type PeriodType = 'daily' | 'weekly' | 'monthly'

export interface UsageResult {
  allowed: boolean
  feature: string
  used: number
  limit: number // -1 = cheksiz
  remaining: number // -1 = cheksiz
  plan: string
  source: 'override' | 'plan' | 'default' | 'fair_use'
  reason?: string
  periodType: PeriodType
  periodEnd: string // ISO date string — limit qachon yangilanishi
}

interface CheckOptions {
  userId?: string
  email?: string
  feature: string
  tokens?: number
  metadata?: Record<string, unknown>
}

async function getSupabaseAdminLazy() {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
    return getSupabaseAdmin()
  } catch {
    return null
  }
}

/**
 * Foydalanuvchining tarif rejasini aniqlaydi (registered_users.subscription_plan)
 */
export async function getUserPlan(userId?: string, email?: string): Promise<string> {
  const identity = userId || email
  if (!identity) return 'free'

  try {
    const supabase = await getSupabaseAdminLazy()
    if (!supabase) return 'free'

    // Avval registered_users dan (subscription_plan ustuni)
    let query = supabase
      .from('registered_users')
      .select('subscription_plan, subscription_expires_at')
    if (userId) query = query.eq('id', userId)
    else query = query.eq('email', email)
    const { data, error } = await query.maybeSingle()

    if (!error && data) {
      const plan = (data.subscription_plan || 'free').toLowerCase()
      // Muddati o'tgan bo'lsa — free ga tushirish
      if (plan !== 'free' && data.subscription_expires_at) {
        const exp = new Date(data.subscription_expires_at)
        if (exp < new Date()) return 'free'
      }
      if (plan === 'standart' || plan === 'pro' || plan === 'basic' || plan === 'premium') {
        return plan === 'pro' || plan === 'premium' ? 'pro' : 'standart'
      }
      return 'free'
    }
  } catch {}

  return 'free'
}

/**
 * Foydalanuvchi uchun samarali limitni aniqlaydi:
 * per-user override > tarif limiti > default limit
 */
/**
 * Joriy davr boshlanish sanasini hisoblaydi
 */
function getPeriodStart(periodType: PeriodType): Date {
  const now = new Date()
  if (periodType === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  }
  if (periodType === 'weekly') {
    const day = now.getDay() // 0=Sun
    const diff = day === 0 ? 6 : day - 1 // Monday = 0
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0)
  }
  // monthly (default)
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

/**
 * Joriy davr tugash sanasini hisoblaydi (keyingi davr boshlanishidan 1 ms oldin)
 */
function getPeriodEnd(periodType: PeriodType): Date {
  const start = getPeriodStart(periodType)
  const end = new Date(start)
  if (periodType === 'daily') {
    end.setDate(end.getDate() + 1)
  } else if (periodType === 'weekly') {
    end.setDate(end.getDate() + 7)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  end.setTime(end.getTime() - 1)
  return end
}

/**
 * Pricing_plans.limits JSONB dan limit va period_type ni ajratadi.
 * Format: { feature_key: number } yoki { feature_key: { value: number, period_type: string } }
 */
function parsePlanLimit(
  limitsObj: Record<string, unknown>,
  feature: string
): { limit: number; periodType: PeriodType } | null {
  const raw = limitsObj[feature]
  if (raw == null) return null
  if (typeof raw === 'number') return { limit: raw, periodType: 'monthly' }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    const value =
      typeof obj.value === 'number' ? obj.value : typeof obj.limit === 'number' ? obj.limit : null
    const pt = typeof obj.period_type === 'string' ? obj.period_type : 'monthly'
    if (value != null) {
      const periodType: PeriodType = pt === 'daily' || pt === 'weekly' ? pt : 'monthly'
      return { limit: value, periodType }
    }
  }
  return null
}

export async function getEffectiveLimit(
  userId: string | undefined,
  plan: string,
  feature: string
): Promise<{ limit: number; source: 'override' | 'plan' | 'default'; periodType: PeriodType }> {
  // 1. Per-user override (always monthly)
  if (userId) {
    try {
      const supabase = await getSupabaseAdminLazy()
      if (supabase) {
        const { data, error } = await supabase
          .from('user_usage_limits')
          .select('monthly_limit')
          .eq('user_id', userId)
          .eq('feature', feature)
          .maybeSingle()
        if (!error && data && data.monthly_limit != null) {
          return { limit: data.monthly_limit, source: 'override', periodType: 'monthly' }
        }
      }
    } catch {}
  }

  // 2. Tarif limiti (pricing_plans.limits JSONB) — supports {value, period_type}
  try {
    const supabase = await getSupabaseAdminLazy()
    if (supabase) {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('limits')
        .eq('id', plan)
        .maybeSingle()
      if (!error && data && data.limits) {
        const parsed = parsePlanLimit(data.limits, feature)
        if (parsed) return { ...parsed, source: 'plan' }
      }
    }
  } catch {}

  // 3. Default (always monthly)
  const def = DEFAULT_LIMITS[plan] || DEFAULT_LIMITS.free
  const limit = typeof def[feature] === 'number' ? def[feature] : -1
  return { limit, source: 'default', periodType: 'monthly' }
}

/**
 * Davr turiga qarab foydalanuvchining ishlatish sonini sanaydi
 */
async function countUsage(
  userId: string | undefined,
  email: string | undefined,
  feature: string,
  periodType: PeriodType = 'monthly'
): Promise<number> {
  try {
    const supabase = await getSupabaseAdminLazy()
    if (!supabase) return 0

    const periodStart = getPeriodStart(periodType)

    let query = supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', feature)
      .gte('created_at', periodStart.toISOString())

    if (userId) query = query.eq('user_id', userId)
    else if (email) query = query.eq('email', email)
    else return 0

    const { count, error } = await query
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

/**
 * ASOSIY FUNKSIYA: limitni tekshiradi va ishlatilganini yozadi.
 *
 * Ruxsat berilsa → usage_logs ga qator qo'shib, { allowed: true } qaytaradi.
 * Limit tugagan bo'lsa → { allowed: false, reason: 'limit_reached' } qaytaradi.
 * (Frontend shu holatda 429 xatoni ko'rsatadi va Premium'ga yo'naltiradi)
 */
export async function checkAndIncrement(opts: CheckOptions): Promise<UsageResult> {
  const { userId, email, feature, tokens = 1, metadata = {} } = opts

  // Foydalanuvchi aniqlanmasa — bloklamaymiz, lekin yozib qo'yamiz (api)
  const plan = await getUserPlan(userId, email)
  const eff = await getEffectiveLimit(userId, plan, feature)
  let limit: number = eff.limit
  let source: UsageResult['source'] = eff.source

  // Pro "cheksiz" (limit=-1) — adolatli ishlatish chegarasini qo'llaymiz
  if (limit === -1 && source === 'plan' && plan === 'pro') {
    const fair = await getFairUseLimit(feature)
    if (fair != null) {
      limit = fair
      source = 'fair_use'
    }
  }

  const periodType = eff.periodType
  const periodEnd = getPeriodEnd(periodType)
  const used = await countUsage(userId, email, feature, periodType)

  const remaining = limit === -1 ? -1 : Math.max(0, limit - used)

  if (limit !== -1 && used >= limit) {
    return {
      allowed: false,
      feature,
      used,
      limit,
      remaining: 0,
      plan,
      source,
      reason: 'limit_reached',
      periodType,
      periodEnd: periodEnd.toISOString(),
    }
  }

  // Iste'molni yozish (non-blocking)
  try {
    const supabase = await getSupabaseAdminLazy()
    if (supabase) {
      const logRow = {
        user_id: userId || email || 'anonymous',
        email: email || 'anonymous@juristiv.uz',
        name: '',
        tokens: Math.max(1, Math.round(tokens || 1)),
        action: feature,
        metadata: { ...metadata, plan, limit, limit_source: source, period_type: periodType },
        created_at: new Date().toISOString(),
      }
      const { error: insErr } = await supabase.from('usage_logs').insert(logRow)
      if (insErr) {
        const baseRow = { ...logRow }
        delete (baseRow as any).metadata
        await supabase.from('usage_logs').insert(baseRow)
      }
    }
  } catch {}

  return {
    allowed: true,
    feature,
    used: used + 1,
    limit,
    remaining: remaining === -1 ? -1 : remaining - 1,
    plan,
    source,
    periodType,
    periodEnd: periodEnd.toISOString(),
  }
}

/**
 * Limit tugaganda foydalanuvchiga ko'rsatiladigan matn
 */
export function formatPeriodEnd(periodEnd: string, periodType: PeriodType): string {
  const d = new Date(periodEnd)
  const now = new Date()
  if (periodType === 'daily') {
    if (d.getDate() === now.getDate() + 1) return 'Ertaga yangilanadi'
    return `${d.toLocaleDateString('uz-UZ')} da yangilanadi`
  }
  if (periodType === 'weekly') {
    const dayNames = [
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
      'Yakshanba',
    ]
    const target = new Date(d)
    target.setDate(target.getDate() + 1) // Monday after period end
    const dayName = dayNames[(target.getDay() + 6) % 7]
    return `${dayName} kuni yangilanadi`
  }
  // monthly
  const monthNames = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ]
  return `${d.getDate()}-${monthNames[d.getMonth()]} kuni 00:00 da yangilanadi`
}

export function usageMessage(r: UsageResult): string {
  const label = FEATURES[r.feature] || r.feature
  if (r.limit === -1) return `${label} — cheksiz`
  if (r.source === 'fair_use') {
    const periodText = r.periodType === 'daily' ? 'kun' : r.periodType === 'weekly' ? 'hafta' : 'oy'
    return `${label} uchun adolatli ishlatish chegarasi tugadi (${r.used}/${r.limit} ${periodText}). ${formatPeriodEnd(r.periodEnd, r.periodType)}`
  }
  const planName = r.plan === 'pro' ? 'Pro' : r.plan === 'standart' ? 'Standart' : 'Bepul'
  const periodText = r.periodType === 'daily' ? 'kun' : r.periodType === 'weekly' ? 'hafta' : 'oy'
  return `${planName} tarifida ${label} limiti tugadi (${r.used}/${r.limit} ${periodText}). ${formatPeriodEnd(r.periodEnd, r.periodType)}. Limitni oshirish uchun Premium'ga o'ting.`
}

/**
 * Foydalanuvchining barcha funksiyalar bo'yicha holatini qaytaradi (UI uchun)
 */
export async function getUsageStatus(
  userId?: string,
  email?: string
): Promise<{
  plan: string
  features: Record<
    string,
    {
      used: number
      limit: number
      remaining: number
      label: string
      periodType: PeriodType
      periodEnd: string
    }
  >
}> {
  const plan = await getUserPlan(userId, email)
  const result: Record<
    string,
    {
      used: number
      limit: number
      remaining: number
      label: string
      periodType: PeriodType
      periodEnd: string
    }
  > = {}

  for (const [feature, label] of Object.entries(FEATURES)) {
    const eff = await getEffectiveLimit(userId, plan, feature)
    let limit = eff.limit
    let source: UsageResult['source'] = eff.source

    if (limit === -1 && source === 'plan' && plan === 'pro') {
      const fair = await getFairUseLimit(feature)
      if (fair != null) {
        limit = fair
        source = 'fair_use'
      }
    }

    const used = await countUsage(userId, email, feature, eff.periodType)
    const periodEnd = getPeriodEnd(eff.periodType)

    result[feature] = {
      label,
      used,
      limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - used),
      periodType: eff.periodType,
      periodEnd: periodEnd.toISOString(),
    }
  }

  return { plan, features: result }
}
