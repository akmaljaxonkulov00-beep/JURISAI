import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'

interface UserRow {
  id: string
  email: string
  name: string
  role: string
  subscription_plan: string
  subscription_expires_at: string
  created_at: string
  blocked: boolean
}

interface PlanRow {
  id: string
  name: string
  price: number
}

/**
 * GET /api/admin/analytics/users
 *
 * Foydalanuvchi analitikasi — FAQAT real Supabase ma'lumotlaridan:
 *   - registered_users (foydalanuvchilar)
 *   - pricing_plans (tarif nomi/narxi)
 * Hech qanday to'qima raqam, mock yoki demo data yo'q.
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

    // Barcha foydalanuvchilar (registered_users — yagona manba)
    const { data: allUsers, error: usersError } = await supabase
      .from('registered_users')
      .select(
        'id, email, name, role, subscription_plan, subscription_expires_at, created_at, blocked'
      )

    if (usersError) throw usersError
    const users = (allUsers || []) as UserRow[]

    // Tarif nomi/narxi — pricing_plans'dan
    const { data: plans } = await supabase.from('pricing_plans').select('id, name, price')
    const planMap = new Map<string, { name: string; price: number }>()
    for (const p of (plans || []) as PlanRow[]) {
      planMap.set(String(p.id), { name: p.name || String(p.id), price: Number(p.price) || 0 })
    }

    // ── Kunlik o'sish (real) ──
    const dayCount = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const userGrowth: Array<{ date: string; newUsers: number }> = []
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      userGrowth.push({
        date: dateStr,
        newUsers: users.filter(u => String(u.created_at || '').startsWith(dateStr)).length,
      })
    }

    // ── Faol subskriptiyalar (real — muddati o'tmagan, free emas) ──
    const activeSubs = new Map<string, { count: number; users: Set<string> }>()
    for (const u of users) {
      const plan = String(u.subscription_plan || 'free').toLowerCase()
      if (plan === 'free' || plan === '') continue
      const expiresAt = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null
      if (expiresAt && expiresAt < now) continue // muddati o'tgan
      if (!activeSubs.has(plan)) activeSubs.set(plan, { count: 0, users: new Set() })
      const entry = activeSubs.get(plan)!
      entry.count++
      entry.users.add(String(u.id))
    }
    const activeSubscriptions = [...activeSubs.entries()].map(([planId, v]) => {
      const meta = planMap.get(planId) || { name: planId, price: 0 }
      return {
        planName: meta.name,
        planId,
        planPrice: meta.price,
        activeSubscriptions: v.count,
        uniqueUsers: v.users.size,
      }
    })

    // ── Umumiy statistika (real) ──
    const todayStr = now.toISOString().split('T')[0]
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const summary = {
      totalUsers: users.length,
      activeUsers: users.filter(
        u => u.subscription_expires_at && new Date(String(u.subscription_expires_at)) > now
      ).length,
      todayUsers: users.filter(u => String(u.created_at || '').startsWith(todayStr)).length,
      weekUsers: users.filter(u => new Date(u.created_at || 0) >= weekStart).length,
      monthUsers: users.filter(u => new Date(u.created_at || 0) >= monthStart).length,
    }

    // ── Oxirgi ro'yxatdan o'tgan 10 ta (real) ──
    const lastUsers = [...users]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10)
      .map((u: UserRow) => ({
        id: u.id,
        email: u.email || '',
        firstName: (u.name || '').split(' ')[0] || '',
        lastName: (u.name || '').split(' ')[1] || '',
        role: u.role || 'USER',
        status: u.blocked ? 'BLOCKED' : 'ACTIVE',
        createdAt: u.created_at || '',
        subscription: u.subscription_plan
          ? {
              planName: String(u.subscription_plan),
              status:
                u.subscription_expires_at && new Date(u.subscription_expires_at) > now
                  ? 'ACTIVE'
                  : 'EXPIRED',
              currentPeriodEnd: u.subscription_expires_at || '',
            }
          : null,
      }))

    // ── Rollar bo'yicha (real) ──
    const roleCounts = new Map<string, number>()
    for (const u of users) {
      const role = String(u.role || 'USER').toUpperCase()
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1)
    }
    const userRoles = [...roleCounts.entries()].map(([role, count]) => ({ role, count }))

    return NextResponse.json({
      userGrowth,
      activeSubscriptions,
      summary,
      lastUsers,
      userRoles,
      period,
      source: 'supabase',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('User analytics error:', error)
    return NextResponse.json({ error: 'Analitikani olishda xatolik yuz berdi' }, { status: 500 })
  }
}
