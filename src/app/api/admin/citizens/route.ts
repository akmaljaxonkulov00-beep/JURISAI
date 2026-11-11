import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/citizens
 * Fuqarolar boshqaruvi tizimi:
 * 1. Fuqarolar reyestri (faqat fuqaro/user roli, talaba va advokatlar aralashmasdan)
 * 2. Fuqarolar bergan yuridik savollar (legal_questions)
 * 3. Alohida Pul tushumi (savol xaridlari, obunalar, depozitlar)
 * 4. Alohida Nastroykalar (bepul limit, 1 ta savol narxi 9900, paketlar)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const plan = searchParams.get('plan') || 'all'
    const status = searchParams.get('status') || 'all'

    const admin = getSupabaseAdmin()

    const [usersRes, questionsRes, settingsRes, profilesRes] = await Promise.allSettled([
      admin.from('registered_users').select('*').order('created_at', { ascending: false }),
      admin.from('legal_questions').select('*').order('created_at', { ascending: false }).limit(100),
      admin.from('platform_settings').select('value').eq('key', 'citizen_settings').maybeSingle(),
      admin.from('citizen_profiles').select('*'),
    ])

    const users = usersRes.status === 'fulfilled' && usersRes.value.data ? usersRes.value.data : []
    const questions = questionsRes.status === 'fulfilled' && questionsRes.value.data ? questionsRes.value.data : []
    const profiles = profilesRes.status === 'fulfilled' && profilesRes.value.data ? profilesRes.value.data : []
    const settings = (settingsRes.status === 'fulfilled' && settingsRes.value.data?.value) || {
      free_questions_monthly: 2,
      question_price: 9900,
      express_surcharge: 15000,
      pro_monthly_price: 79000,
      premium_monthly_price: 149000,
      enable_paid_questions: true,
    }

    // Faqat FUQAROLARNI ajratib olish (advokat, talaba, nomzod, adminlar aralashmasin!)
    const allCitizens = users.filter((u: any) => {
      const r = (u.role || '').toLowerCase()
      return r === 'citizen' || r === 'user' || (!r && u.role !== 'advocate' && u.role !== 'student' && u.role !== 'law_student' && u.role !== 'admin')
    })

    let filteredCitizens = [...allCitizens]

    if (plan !== 'all') {
      filteredCitizens = filteredCitizens.filter((c: any) => (c.subscription_plan || 'free') === plan)
    }

    if (status !== 'all') {
      filteredCitizens = filteredCitizens.filter((c: any) =>
        status === 'blocked' ? c.blocked : !c.blocked
      )
    }

    if (search) {
      filteredCitizens = filteredCitizens.filter((c: any) =>
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.full_name && c.full_name.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.phone && c.phone.toLowerCase().includes(search)) ||
        (c.city && c.city.toLowerCase().includes(search))
      )
    }

    // Fuqarolar profillari xaritasi
    const profileMap = new Map<string, any>()
    for (const p of profiles) {
      profileMap.set(p.user_id, p)
    }

    // Alohida Fuqarolar Pul Tushumi (Moliya) hisobi
    const totalDeposits = allCitizens.reduce((acc: number, c: any) => acc + Number(c.balance || 0), 0)
    const paidQuestions = questions.filter((q: any) => q.is_paid_question)
    const questionsRevenue = paidQuestions.length * Number(settings.question_price || 9900)
    const proUsersCount = allCitizens.filter((c: any) => c.subscription_plan === 'pro').length
    const premiumUsersCount = allCitizens.filter((c: any) => c.subscription_plan === 'premium').length
    const subscriptionsRevenue = (proUsersCount * Number(settings.pro_monthly_price || 79000)) +
                                 (premiumUsersCount * Number(settings.premium_monthly_price || 149000))

    const financeStats = {
      total_citizen_revenue: questionsRevenue + subscriptionsRevenue,
      questions_revenue: questionsRevenue,
      subscriptions_revenue: subscriptionsRevenue,
      total_balance_held: totalDeposits,
      paid_questions_count: paidQuestions.length,
    }

    const stats = {
      total: allCitizens.length,
      active: allCitizens.filter((c: any) => !c.blocked).length,
      blocked: allCitizens.filter((c: any) => c.blocked).length,
      pro: proUsersCount,
      premium: premiumUsersCount,
      total_questions: questions.length,
      unresolved_questions: questions.filter((q: any) => q.status === 'open' || q.status === 'pending').length,
    }

    return NextResponse.json({
      success: true,
      stats,
      financeStats,
      settings,
      citizens: filteredCitizens.map((c: any) => ({
        ...c,
        profile: profileMap.get(c.id) || null,
      })),
      questions: questions.map((q: any) => ({
        id: q.id,
        citizen_id: q.citizen_id,
        title: q.title || 'Yuridik savol',
        category: q.category || 'Umumiy',
        status: q.status || 'open',
        is_paid_question: Boolean(q.is_paid_question),
        price: q.is_paid_question ? Number(settings.question_price || 9900) : 0,
        answers_count: q.answers_count || 0,
        created_at: q.created_at,
      })),
    })
  } catch (err: any) {
    console.error('Fuqarolar admin API xatosi:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/citizens
 * Fuqaroni bloklash/ochish, balansini o'zgartirish, obuna tarifini belgilash
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { citizenId, action, blocked, balanceChange, subscriptionPlan, subscriptionExpiresAt, settings } = body
    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    // 1. Nastroykalarni saqlash
    if (action === 'save_settings' || settings) {
      try {
        await admin.from('platform_settings').upsert({
          key: 'citizen_settings',
          value: settings,
          updated_at: now,
        }, { onConflict: 'key' })
      } catch (e) {
        console.error('Fuqaro nastroykalarini saqlash xatosi:', e)
      }
      return NextResponse.json({ success: true, message: 'Fuqarolar nastroykasi saqlandi' })
    }

    if (!citizenId) {
      return NextResponse.json({ success: false, error: 'citizenId ko‘rsatilmadi' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: now }

    if (action === 'toggle_block' || blocked !== undefined) {
      updates.blocked = Boolean(blocked)
      updates.status = blocked ? 'blocked' : 'active'
    }

    if (subscriptionPlan) {
      updates.subscription_plan = subscriptionPlan
      if (subscriptionExpiresAt) {
        updates.subscription_expires_at = subscriptionExpiresAt
      } else {
        const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        updates.subscription_expires_at = exp
      }
    }

    if (balanceChange !== undefined && Number.isFinite(Number(balanceChange))) {
      const { data: userRecord } = await admin
        .from('registered_users')
        .select('balance')
        .eq('id', citizenId)
        .single()
      const current = userRecord?.balance || 0
      updates.balance = Math.max(0, current + Number(balanceChange))
    }

    const { data: updated, error } = await admin
      .from('registered_users')
      .update(updates)
      .eq('id', citizenId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, citizen: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
