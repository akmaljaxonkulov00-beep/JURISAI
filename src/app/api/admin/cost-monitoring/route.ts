import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Har bir funksiya chaqiruvining TAXMINIY narxi (USD) — Groq llama-3.3-70b
// va whisper-large-v3 narxlari asosida (token miqdori bo'yicha o'rtacha):
//   ai_chat ~0.0009 | irac ~0.0028 | hujjat gen ~0.0038 | tahlil ~0.0035
//   virtual sud ~0.011/sessiya | daraxt ~0.0029 | STT ~0.003 | senariy ~0.0022
const FEATURE_COST: Record<string, number> = {
  ai_chat: 0.0009,
  irac: 0.0028,
  document_generate: 0.0038,
  document_analysis: 0.0035,
  virtual_court: 0.011,
  decision_tree: 0.0029,
  speech_stt: 0.003,
  scenario: 0.0022,
  weakness: 0.0028,
}

const FEATURE_LABELS: Record<string, string> = {
  ai_chat: "AI chat (huquqiy so'rov)",
  irac: 'IRAC tahlil',
  document_generate: 'Hujjat generator',
  document_analysis: 'Hujjat tahlili',
  virtual_court: 'Virtual sud',
  decision_tree: 'Qarorlar daraxti',
  speech_stt: 'Ovozli yozuv (STT)',
  scenario: 'Senariy generator',
  weakness: 'Argument tahlili',
}

// GET /api/admin/cost-monitoring?days=30 — joriy oy bo'yicha xarajat hisoboti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '30') || 30))

    const supabase = getSupabaseAdmin()
    const since = new Date()
    since.setDate(since.getDate() - days)

    // 1) Davr ichidagi barcha iste'mol yozuvlari
    const { data: logs, error } = await supabase
      .from('usage_logs')
      .select('user_id, email, action, tokens, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) throw error

    // 2) Foydalanuvchilar → tarif rejasi (registered_users)
    const userIds = Array.from(
      new Set((logs || []).map((l: any) => l.user_id).filter((u: any) => u && u.includes('-')))
    ).slice(0, 500)
    const plans: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('registered_users')
        .select('id, subscription_plan')
        .in('id', userIds)
      for (const u of users || []) {
        plans[u.id] = ['pro', 'premium'].includes(u.subscription_plan)
          ? 'pro'
          : ['standart', 'basic'].includes(u.subscription_plan)
            ? 'standart'
            : 'free'
      }
    }

    // 3) Yig'ish
    const perFeature: Record<string, { count: number; cost: number }> = {}
    const perPlan: Record<string, { count: number; cost: number }> = {}
    let totalCalls = 0
    let totalTokens = 0
    let totalCost = 0

    for (const l of logs || []) {
      const action = l.action || 'unknown'
      const cost = FEATURE_COST[action] || 0.0009
      totalCalls++
      totalTokens += Number(l.tokens) || 0
      totalCost += cost

      perFeature[action] = perFeature[action] || { count: 0, cost: 0 }
      perFeature[action].count++
      perFeature[action].cost += cost

      const plan = plans[l.user_id] || 'free'
      perPlan[plan] = perPlan[plan] || { count: 0, cost: 0 }
      perPlan[plan].count++
      perPlan[plan].cost += cost
    }

    const featureList = Object.entries(perFeature)
      .map(([key, v]) => ({
        feature: key,
        label: FEATURE_LABELS[key] || key,
        count: v.count,
        cost: Math.round(v.cost * 10000) / 10000,
      }))
      .sort((a, b) => b.cost - a.cost)

    const planList = Object.entries(perPlan)
      .map(([key, v]) => ({
        plan: key,
        label: key === 'pro' ? 'Pro' : key === 'standart' ? 'Standart' : 'Bepul',
        count: v.count,
        cost: Math.round(v.cost * 10000) / 10000,
      }))
      .sort((a, b) => b.cost - a.cost)

    // 4) O'rtacha 1 foydalanuvchi narxi (faol foydalanuvchilar bo'yicha)
    const activeUsers = new Set((logs || []).map((l: any) => l.user_id)).size

    return NextResponse.json({
      success: true,
      data: {
        period_days: days,
        since: since.toISOString(),
        totals: {
          calls: totalCalls,
          tokens: totalTokens,
          est_cost_usd: Math.round(totalCost * 10000) / 10000,
          est_cost_uzs: Math.round(totalCost * 12500),
          active_users: activeUsers,
          avg_cost_per_user_usd: activeUsers
            ? Math.round((totalCost / activeUsers) * 10000) / 10000
            : 0,
        },
        per_feature: featureList,
        per_plan: planList,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}
