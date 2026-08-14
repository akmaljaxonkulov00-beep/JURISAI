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

// ── Identity: request'dan foydalanuvchini aniqlash ────────────────────────
/**
 * NextRequest'dan foydalanuvchi identity sini aniqlaydi.
 * 1) Body ichidagi userId/email (mavjud bo'lsa)
 * 2) sb-access-token cookie (Supabase JWT — sub va email)
 */
export function getIdentityFromRequest(
  request: any,
  body: Record<string, any> = {}
): { userId?: string; email?: string } {
  const fromBody = {
    userId: body.userId || body.user_id || body.uid || undefined,
    email: body.email || undefined,
  }
  if (fromBody.userId || fromBody.email) return fromBody

  try {
    const token = request.cookies?.get('sb-access-token')?.value
    if (token) {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'))
      if (payload.sub) return { userId: payload.sub, email: payload.email || undefined }
    }
  } catch {}

  return {}
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
  weakness: 'Argument tahlili',
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
    weakness: 3,
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
    weakness: 20,
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
    weakness: -1,
  },
}

export interface UsageResult {
  allowed: boolean
  feature: string
  used: number
  limit: number // -1 = cheksiz
  remaining: number // -1 = cheksiz
  plan: string
  source: 'override' | 'plan' | 'default'
  reason?: string
}

interface CheckOptions {
  userId?: string
  email?: string
  feature: string
  tokens?: number
  metadata?: Record<string, any>
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
export async function getEffectiveLimit(
  userId: string | undefined,
  plan: string,
  feature: string
): Promise<{ limit: number; source: 'override' | 'plan' | 'default' }> {
  // 1. Per-user override
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
          return { limit: data.monthly_limit, source: 'override' }
        }
      }
    } catch {}
  }

  // 2. Tarif limiti (pricing_plans.limits JSONB)
  try {
    const supabase = await getSupabaseAdminLazy()
    if (supabase) {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('limits')
        .eq('id', plan)
        .maybeSingle()
      if (!error && data && data.limits) {
        const val = data.limits[feature]
        if (typeof val === 'number') return { limit: val, source: 'plan' }
      }
    }
  } catch {}

  // 3. Default
  const def = DEFAULT_LIMITS[plan] || DEFAULT_LIMITS.free
  const limit = typeof def[feature] === 'number' ? def[feature] : -1
  return { limit, source: 'default' }
}

/**
 * Shu oy ichida foydalanuvchi shu funksiyani necha marta ishlatganini sanaydi
 */
async function countMonthlyUsage(
  userId: string | undefined,
  email: string | undefined,
  feature: string
): Promise<number> {
  try {
    const supabase = await getSupabaseAdminLazy()
    if (!supabase) return 0

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    let query = supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', feature)
      .gte('created_at', monthStart.toISOString())

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
  const { limit, source } = await getEffectiveLimit(userId, plan, feature)
  const used = await countMonthlyUsage(userId, email, feature)

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
    }
  }

  // Iste'molni yozish (non-blocking)
  try {
    const supabase = await getSupabaseAdminLazy()
    if (supabase) {
      const logRow = {
        user_id: userId || email || 'anonymous',
        email: email || 'anonymous@jurisai.uz',
        name: '',
        tokens: Math.max(1, Math.round(tokens || 1)),
        action: feature,
        metadata: { ...metadata, plan, limit, limit_source: source },
        created_at: new Date().toISOString(),
      }
      const { error: insErr } = await supabase.from('usage_logs').insert(logRow)
      if (insErr) {
        // Eski baza: metadata ustuni bo'lmasa — metadatasiz qayta urinamiz
        const { metadata: _drop, ...baseRow } = logRow
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
  }
}

/**
 * Limit tugaganda foydalanuvchiga ko'rsatiladigan matn
 */
export function usageMessage(r: UsageResult): string {
  const label = FEATURES[r.feature] || r.feature
  if (r.limit === -1) return `${label} — cheksiz`
  const planName = r.plan === 'pro' ? 'Pro' : r.plan === 'standart' ? 'Standart' : 'Bepul'
  return `${planName} tarifida ${label} limiti tugadi (${r.used}/${r.limit} oy). Limitni oshirish uchun Premium'ga o'ting.`
}

/**
 * Foydalanuvchining barcha funksiyalar bo'yicha holatini qaytaradi (UI uchun)
 */
export async function getUsageStatus(
  userId?: string,
  email?: string
): Promise<{
  plan: string
  features: Record<string, { used: number; limit: number; remaining: number; label: string }>
}> {
  const plan = await getUserPlan(userId, email)
  const result: Record<string, any> = {}

  for (const [feature, label] of Object.entries(FEATURES)) {
    const { limit } = await getEffectiveLimit(userId, plan, feature)
    const used = await countMonthlyUsage(userId, email, feature)
    result[feature] = {
      label,
      used,
      limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    }
  }

  return { plan, features: result }
}
