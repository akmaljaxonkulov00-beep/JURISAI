import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'

interface PaymentRow {
  id: string
  user_id: string
  user_email: string
  plan: string
  plan_id?: string
  amount: number
  status: string
  created_at: string
}

interface PlanRow {
  id: string
  name: string
  price: number
}

/**
 * GET /api/admin/analytics/revenue
 *
 * Daromad analitikasi — FAQAT real Supabase ma'lumotlaridan:
 *   - payment_requests (status = approved)
 *   - pricing_plans (tarif nomi/narxi)
 * Hech qanday to'qima daromad yoki mock data yo'q.
 */
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

    // Tasdiqlangan to'lovlar (real) — faqat mavjud ustunlar:
    // plan_id ustuni 20250817_payment_state_machine.sql migratsiyasi bilan qo'shiladi
    const { data: payments, error } = await supabase
      .from('payment_requests')
      .select('id, user_id, user_email, plan, amount, status, created_at')
      .eq('status', 'approved')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    const approved = (payments || []) as PaymentRow[]

    // Tarif nomi/narxi — pricing_plans'dan
    const { data: plans } = await supabase.from('pricing_plans').select('id, name, price')
    const planMap = new Map<string, { name: string; price: number }>()
    for (const p of (plans || []) as PlanRow[]) {
      planMap.set(String(p.id), { name: p.name || String(p.id), price: Number(p.price) || 0 })
    }

    // ── Kunlik daromad (real) ──
    const dayCount = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const revenueData: Array<{ date: string; revenue: number; transactionCount: number }> = []
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayPayments = approved.filter(p => String(p.created_at || '').startsWith(dateStr))
      revenueData.push({
        date: dateStr,
        revenue: dayPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        transactionCount: dayPayments.length,
      })
    }

    // ── Umumiy statistika (real) ──
    const todayStr = now.toISOString().split('T')[0]
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const summary = {
      totalRevenue: approved.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      totalTransactions: approved.length,
      todayRevenue: approved
        .filter(p => String(p.created_at || '').startsWith(todayStr))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0),
      todayTransactions: approved.filter(p => String(p.created_at || '').startsWith(todayStr))
        .length,
      weekRevenue: approved
        .filter(p => new Date(p.created_at || 0) >= weekStart)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0),
      weekTransactions: approved.filter(p => new Date(p.created_at || 0) >= weekStart).length,
      monthRevenue: approved
        .filter(p => new Date(p.created_at || 0) >= monthStart)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0),
      monthTransactions: approved.filter(p => new Date(p.created_at || 0) >= monthStart).length,
    }

    // ── Tariflar bo'yicha (real — pricing_plans nomlari bilan) ──
    const byPlan = new Map<string, { count: number; revenue: number }>()
    for (const p of approved) {
      const planId = String(p.plan_id || p.plan || 'unknown')
      if (!byPlan.has(planId)) byPlan.set(planId, { count: 0, revenue: 0 })
      const e = byPlan.get(planId)!
      e.count++
      e.revenue += Number(p.amount) || 0
    }
    const revenueByPlan = [...byPlan.entries()]
      .map(([planId, v]) => {
        const meta = planMap.get(planId) || { name: planId, price: 0 }
        return {
          planName: meta.name,
          planId,
          planPrice: meta.price,
          subscriptionCount: v.count,
          totalRevenue: v.revenue,
        }
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    return NextResponse.json({
      revenueData,
      summary,
      revenueByPlan,
      period,
      source: 'supabase',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Revenue analytics error:', error)
    return NextResponse.json({ error: 'Analitikani olishda xatolik yuz berdi' }, { status: 500 })
  }
}
