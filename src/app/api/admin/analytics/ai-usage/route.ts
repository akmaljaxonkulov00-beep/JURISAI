import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'

interface UsageLogRow {
  id: string
  user_id: string
  email: string
  action: string
  tokens: number
  created_at: string
}

/**
 * GET /api/admin/analytics/ai-usage
 *
 * AI iste'mol analitikasi — FAQAT real Supabase `usage_logs` ma'lumotlaridan.
 * Feature nomlari kod bilan mos: ai_chat, irac, document_generate,
 * document_analysis, virtual_court, decision_tree, speech_stt, scenario.
 * Hech qanday to'qima raqam yoki mock data yo'q.
 */

const FEATURE_LABELS: Record<string, string> = {
  ai_chat: 'AI chat',
  irac: 'IRAC tahlil',
  document_generate: 'Hujjat generator',
  document_analysis: 'Hujjat tahlili',
  virtual_court: 'Virtual sud',
  decision_tree: 'Qarorlar daraxti',
  speech_stt: 'Ovozli yozuv',
  scenario: 'Senariy generator',
  ai_legal_chat: 'AI chat',
  irac_analysis: 'IRAC tahlil',
  document_generation: 'Hujjat generator',
  law_search: 'Qonun qidiruv',
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily'

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const supabase = getSupabaseAdmin()

    const { data: usageData, error } = await supabase
      .from('usage_logs')
      .select('id, user_id, email, action, tokens, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    const logs = (usageData || []) as UsageLogRow[]

    // ── Kunlik iste'mol (real) ──
    const dayCount = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const aiUsageOverTime: Array<Record<string, number | string>> = []
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayLogs = (Array.isArray(logs) ? logs : []).filter(l =>
        String(l.created_at || '').startsWith(dateStr)
      )
      const byFeature: Record<string, number> = {}
      for (const l of dayLogs) {
        const f = String(l.action || 'unknown')
        byFeature[f] = (byFeature[f] || 0) + 1
      }
      aiUsageOverTime.push({
        date: dateStr,
        legalChatRequests: byFeature.ai_chat || byFeature.ai_legal_chat || 0,
        iracAnalysisRequests: byFeature.irac || byFeature.irac_analysis || 0,
        documentGenerationRequests:
          byFeature.document_generate || byFeature.document_generation || 0,
        lawSearchRequests: byFeature.law_search || 0,
        totalRequests: dayLogs.length,
      })
    }

    // ── Eng ko'p ishlatilgan funksiyalar (real) ──
    const featureCounts = new Map<string, { count: number; users: Set<string> }>()
    for (const l of logs) {
      const f = String(l.action || 'unknown')
      if (!featureCounts.has(f)) featureCounts.set(f, { count: 0, users: new Set() })
      const e = featureCounts.get(f)!
      e.count++
      if (l.user_id) e.users.add(String(l.user_id))
      else if (l.email) e.users.add(String(l.email))
    }
    const mostUsedFeatures = [...featureCounts.entries()]
      .map(([feature, v]) => ({
        feature,
        label: FEATURE_LABELS[feature] || feature,
        totalUsage: v.count,
        uniqueUsers: v.users.size,
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage)

    // ── Top foydalanuvchilar (real — ism/email aslida ko'rsatiladi) ──
    const userUsage = new Map<string, { total: number; features: Set<string>; email: string }>()
    for (const l of logs) {
      const key = l.user_id ? `id:${l.user_id}` : `email:${l.email || 'anonymous'}`
      if (!userUsage.has(key)) {
        userUsage.set(key, {
          total: 0,
          features: new Set(),
          email: l.email || 'Noma’lum',
        })
      }
      const e = userUsage.get(key)!
      e.total++
      e.features.add(String(l.action || 'unknown'))
    }
    const topUsers = [...userUsage.entries()]
      .map(([key, v]) => ({
        id: key,
        email: v.email,
        firstName: '',
        lastName: '',
        totalAIUsage: v.total,
        featuresUsed: v.features.size,
      }))
      .sort((a, b) => b.totalAIUsage - a.totalAIUsage)
      .slice(0, 10)

    // ── Umumiy statistika (real) ──
    const todayStr = now.toISOString().split('T')[0]
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const summary = {
      totalAIUsage: logs.length,
      totalRequests: logs.length,
      todayAIUsage: (Array.isArray(logs) ? logs : []).filter(l =>
        String(l.created_at || '').startsWith(todayStr)
      ).length,
      todayRequests: (Array.isArray(logs) ? logs : []).filter(l =>
        String(l.created_at || '').startsWith(todayStr)
      ).length,
      weekAIUsage: (Array.isArray(logs) ? logs : []).filter(
        l => new Date(l.created_at || 0) >= weekStart
      ).length,
      weekRequests: (Array.isArray(logs) ? logs : []).filter(
        l => new Date(l.created_at || 0) >= weekStart
      ).length,
      monthAIUsage: (Array.isArray(logs) ? logs : []).filter(
        l => new Date(l.created_at || 0) >= monthStart
      ).length,
      monthRequests: (Array.isArray(logs) ? logs : []).filter(
        l => new Date(l.created_at || 0) >= monthStart
      ).length,
    }

    return NextResponse.json({
      aiUsageOverTime,
      mostUsedFeatures,
      topUsers,
      summary,
      period,
      source: 'supabase',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI usage analytics error:', error)
    return NextResponse.json({ error: 'Analitikani olishda xatolik yuz berdi' }, { status: 500 })
  }
}
