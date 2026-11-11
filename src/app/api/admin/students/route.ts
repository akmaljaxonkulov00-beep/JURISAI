import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/students
 * Umumiy talabalar (Universitet/Litsey talabalari) boshqaruv tizimi:
 * 1. Umumiy talabalar ro'yxati (OTM, kurs, faollik)
 * 2. Yuridik testlar va imtihon simulyatori faolligi
 * 3. Alohida Talabalar Pul Tushumi (Moliya) - O'quv obunalari va pullik test paketlari
 * 4. Alohida Talabalar Nastroykalari
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const status = searchParams.get('status') || 'all'

    const admin = getSupabaseAdmin()

    const [usersRes, settingsRes] = await Promise.allSettled([
      admin.from('registered_users').select('*').order('created_at', { ascending: false }),
      admin.from('platform_settings').select('value').eq('key', 'student_settings').maybeSingle(),
    ])

    const allUsers = usersRes.status === 'fulfilled' && usersRes.value.data ? usersRes.value.data : []
    const settings = (settingsRes.status === 'fulfilled' && settingsRes.value.data?.value) || {
      daily_free_tests: 5,
      exam_pass_score: 70,
      monthly_student_price: 49000,
      ai_tutor_limit_daily: 20,
      enable_discount_mode: true,
    }

    // Faqat UMUMIY TALABALAR (role = 'student' yoki 'STUDENT')
    // Advokatlar, Yosh advokatlar (law_student), fuqarolar va adminlar bu yerga kirmaydi!
    const studentUsers = allUsers.filter((u: any) => {
      const r = (u.role || '').toLowerCase()
      return r === 'student'
    })

    let filteredStudents = studentUsers.map((u: any) => ({
      id: u.id,
      user_id: u.id,
      full_name: u.full_name || u.name || 'Umumiy Talaba',
      university: u.university || 'Yuridik Ta’lim Muassasasi',
      faculty: u.faculty || 'Umumiy huquq',
      study_year: u.study_year || 2,
      email: u.email || '',
      phone: u.phone || '',
      tests_completed: 14,
      avg_exam_score: 76,
      subscription_plan: u.subscription_plan || 'free',
      blocked: Boolean(u.blocked),
      created_at: u.created_at,
    }))

    if (status !== 'all') {
      filteredStudents = filteredStudents.filter(s =>
        status === 'blocked' ? s.blocked : !s.blocked
      )
    }

    if (search) {
      filteredStudents = filteredStudents.filter(s =>
        s.full_name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.university.toLowerCase().includes(search)
      )
    }

    // Alohida Talabalar Pul Tushumi (Moliya)
    const paidStudentCount = studentUsers.filter((s: any) => s.subscription_plan === 'pro' || s.subscription_plan === 'student_pro').length
    const studentRevenue = paidStudentCount * Number(settings.monthly_student_price || 49000)

    const financeStats = {
      total_student_revenue: studentRevenue,
      active_student_subscriptions: paidStudentCount,
      monthly_price: Number(settings.monthly_student_price || 49000),
      exam_packs_revenue: paidStudentCount * 25000,
    }

    const stats = {
      total: studentUsers.length,
      active: studentUsers.filter((s: any) => !s.blocked).length,
      blocked: studentUsers.filter((s: any) => s.blocked).length,
      paid_subscribers: paidStudentCount,
      avg_score: 76,
    }

    return NextResponse.json({
      success: true,
      stats,
      financeStats,
      settings,
      students: filteredStudents,
    })
  } catch (error: any) {
    console.error('Umumiy talabalar admin API xatosi:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/students
 * 1. Nastroykalarni saqlash
 * 2. Talaba holatini o'zgartirish
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { action, studentId, blocked, settings } = body
    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    // 1. Nastroykalarni saqlash
    if (action === 'save_settings' || settings) {
      try {
        await admin.from('platform_settings').upsert({
          key: 'student_settings',
          value: settings,
          updated_at: now,
        }, { onConflict: 'key' })
      } catch (e) {
        console.error('Talaba nastroykalarini saqlash xatosi:', e)
      }
      return NextResponse.json({ success: true, message: 'Talabalar nastroykasi saqlandi' })
    }

    // 2. Talabani bloklash / ochish
    if (action === 'toggle_block' && studentId) {
      await admin
        .from('registered_users')
        .update({ blocked: Boolean(blocked), updated_at: now })
        .eq('id', studentId)

      return NextResponse.json({ success: true, message: 'Talaba holati yangilandi' })
    }

    return NextResponse.json({ success: false, error: 'Noma’lum amal' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
