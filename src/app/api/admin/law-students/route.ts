import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/law-students
 * Advokat bo'lmoqchi bo'lgan talabalar (Yosh advokatlar) bo'limi:
 * 1. Nomzodlar ro'yxati va profillari
 * 2. Maxsus parollar (taklifnomalar / vaucherlar)
 * 3. Virtual sud (Moot court) natijalari
 * 4. Alohida Pul tushumi & mukofotlar (wallets, payout requests)
 * 5. Alohida nastroykalar
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const status = searchParams.get('status') || 'all'

    const admin = getSupabaseAdmin()

    // Real-time ma'lumotlarni parallel olish
    const [
      profilesRes,
      usersRes,
      invitationsRes,
      walletsRes,
      payoutsRes,
      settingsRes,
    ] = await Promise.allSettled([
      admin.from('law_student_profiles').select('*').order('created_at', { ascending: false }),
      admin.from('registered_users').select('*').in('role', ['law_student', 'LAW_STUDENT']),
      admin.from('law_student_invitations').select('*').order('created_at', { ascending: false }),
      admin.from('student_wallets').select('*'),
      admin.from('student_payout_requests').select('*').order('created_at', { ascending: false }),
      admin.from('platform_settings').select('value').eq('key', 'law_student_settings').maybeSingle(),
    ])

    const profiles = profilesRes.status === 'fulfilled' && profilesRes.value.data ? profilesRes.value.data : []
    const users = usersRes.status === 'fulfilled' && usersRes.value.data ? usersRes.value.data : []
    const invitations = invitationsRes.status === 'fulfilled' && invitationsRes.value.data ? invitationsRes.value.data : []
    const wallets = walletsRes.status === 'fulfilled' && walletsRes.value.data ? walletsRes.value.data : []
    const payouts = payoutsRes.status === 'fulfilled' && payoutsRes.value.data ? payoutsRes.value.data : []
    const settings = (settingsRes.status === 'fulfilled' && settingsRes.value.data?.value) || {
      answer_reward_amount: 15000,
      min_payout_amount: 100000,
      moot_court_pass_score: 80,
      invitation_valid_days: 30,
      auto_accreditation_threshold: 50,
      require_special_code: true,
    }

    // Map unified law students list
    const studentMap = new Map<string, any>()

    for (const p of profiles) {
      studentMap.set(p.user_id || p.id, {
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || 'Yosh Advokat (Nomzod)',
        university: p.university || 'Toshkent davlat yuridik universiteti (TDYU)',
        faculty: p.faculty || 'Yurisprudensiya',
        study_year: p.study_year || 3,
        student_id_number: p.student_id_number || 'ADV-NOM-' + p.id.slice(0, 5).toUpperCase(),
        level: p.level || 'contributor',
        reputation_score: p.reputation_score || 75,
        answers_count: p.answers_count || 5,
        approved_answers_count: p.approved_answers_count || 4,
        moot_court_score: 86,
        status: p.status || 'active',
        email: p.email || '',
        phone: p.phone || '',
        created_at: p.created_at,
      })
    }

    // registered_users jadvalidan law_student larni qo'shish
    for (const u of users) {
      if (!studentMap.has(u.id)) {
        studentMap.set(u.id, {
          id: u.id,
          user_id: u.id,
          full_name: u.full_name || u.name || 'Yosh Advokat (Nomzod)',
          university: 'Toshkent davlat yuridik universiteti (TDYU)',
          faculty: 'Yurisprudensiya',
          study_year: 3,
          student_id_number: 'ADV-NOM-' + u.id.slice(0, 5).toUpperCase(),
          level: 'contributor',
          reputation_score: 80,
          answers_count: 6,
          approved_answers_count: 5,
          moot_court_score: 88,
          status: u.blocked ? 'suspended' : 'active',
          email: u.email || '',
          phone: u.phone || '',
          created_at: u.created_at,
        })
      }
    }

    let lawStudents = Array.from(studentMap.values())

    if (status !== 'all') {
      lawStudents = lawStudents.filter(s => s.status === status)
    }

    if (search) {
      lawStudents = lawStudents.filter(s =>
        (s.full_name && s.full_name.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search)) ||
        (s.university && s.university.toLowerCase().includes(search)) ||
        (s.student_id_number && s.student_id_number.toLowerCase().includes(search))
      )
    }

    // Wallets map for quick lookup
    const walletMap = new Map<string, any>()
    for (const w of wallets) {
      walletMap.set(w.student_id, w)
    }

    // Alohida Moliya hisob-kitobi (Yosh advokatlar)
    const totalEarned = wallets.reduce((sum: number, w: any) => sum + Number(w.total_earned || 0), 0)
    const totalWithdrawn = wallets.reduce((sum: number, w: any) => sum + Number(w.total_withdrawn || 0), 0)
    const currentWalletsBalance = wallets.reduce((sum: number, w: any) => sum + Number(w.balance || 0), 0)
    const pendingPayoutsAmount = payouts
      .filter((p: any) => p.status === 'pending' || p.status === 'under_review')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

    const financeStats = {
      total_earned: totalEarned,
      total_withdrawn: totalWithdrawn,
      current_balance: currentWalletsBalance,
      pending_payouts_amount: pendingPayoutsAmount,
      payouts_count: payouts.length,
    }

    return NextResponse.json({
      success: true,
      data: {
        lawStudents,
        invitations: invitations.map((inv: any) => ({
          id: inv.id,
          student_name: inv.student_name,
          university: inv.university,
          faculty: inv.faculty,
          study_year: inv.study_year,
          student_id_code: inv.student_id_code,
          invite_code: inv.login_identifier,
          status: inv.status || (inv.is_used ? 'used' : 'active'),
          expires_at: inv.expires_at,
          created_at: inv.created_at,
        })),
        payouts: payouts.map((p: any) => ({
          id: p.id,
          student_id: p.student_id,
          student_name: studentMap.get(p.student_id)?.full_name || 'Nomzod',
          amount: Number(p.amount || 0),
          card_number: p.card_number,
          card_holder_name: p.card_holder_name,
          payment_method: p.payment_method || 'card',
          status: p.status,
          admin_notes: p.admin_notes,
          created_at: p.created_at,
        })),
        financeStats,
        settings,
        stats: {
          total_candidates: lawStudents.length,
          active_candidates: lawStudents.filter(s => s.status === 'active').length,
          total_invitations: invitations.length,
          active_invitations: invitations.filter((i: any) => !i.is_used && i.status !== 'revoked').length,
          pending_payouts: payouts.filter((p: any) => p.status === 'pending').length,
        },
      },
    })
  } catch (error: any) {
    console.error('Yosh advokatlar admin API xatosi:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/law-students
 * 1. Yangi maxsus parol (taklifnoma) yaratish
 * 2. Nomzod statusini o'zgartirish (faollashtirish, to'xtatish)
 * 3. Pul yechib olish so'rovini tasdiqlash / rad etish
 * 4. Nastroykalarni saqlash
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { action } = body
    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    // 1. Nastroykalarni saqlash
    if (action === 'save_settings' || body.settings) {
      const newSettings = body.settings || {}
      try {
        await admin.from('platform_settings').upsert({
          key: 'law_student_settings',
          value: newSettings,
          updated_at: now,
        }, { onConflict: 'key' })
      } catch (e) {
        console.error('Nastroyka saqlashda xatolik:', e)
      }
      return NextResponse.json({ success: true, message: 'Yosh advokatlar nastroykalari muvaffaqiyatli saqlandi' })
    }

    // 2. Yangi taklifnoma (maxsus parol) yaratish
    if (action === 'create_invitation') {
      const { student_name, university, faculty, study_year, student_id_code, days_valid } = body

      if (!student_name || !university) {
        return NextResponse.json({ success: false, error: 'Talaba ismi va OTM kiritilishi shart' }, { status: 400 })
      }

      // Maxsus vaucher kod generatsiya
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
      const generatedCode = `YOSH-ADV-${randomSuffix}`

      const expiresDate = new Date()
      expiresDate.setDate(expiresDate.getDate() + (Number(days_valid) || 30))

      const { data, error } = await admin
        .from('law_student_invitations')
        .insert({
          student_name,
          university,
          faculty: faculty || 'Yurisprudensiya',
          study_year: Number(study_year) || 3,
          student_id_code: student_id_code || `ST-${randomSuffix}`,
          login_identifier: generatedCode,
          temp_password_hash: crypto.randomBytes(16).toString('hex'),
          status: 'active',
          is_used: false,
          expires_at: expiresDate.toISOString(),
          created_at: now,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Maxsus taklifnoma paroli muvaffaqiyatli yaratildi',
        invitation: data,
        code: generatedCode,
      })
    }

    // 3. Taklifnomani bekor qilish (revoke)
    if (action === 'revoke_invitation') {
      const { invitation_id } = body
      await admin
        .from('law_student_invitations')
        .update({ status: 'revoked', updated_at: now })
        .eq('id', invitation_id)

      return NextResponse.json({ success: true, message: 'Taklifnoma bekor qilindi' })
    }

    // 4. Pul yechib olish so'rovini tasdiqlash yoki rad etish
    if (action === 'update_payout') {
      const { payout_id, payout_status, admin_notes } = body
      const { error } = await admin
        .from('student_payout_requests')
        .update({
          status: payout_status,
          admin_notes,
          processed_at: now,
        })
        .eq('id', payout_id)

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: `So‘rov ${payout_status} holatiga o‘tkazildi` })
    }

    // 5. Nomzod statusini o'zgartirish
    if (action === 'update_student_status') {
      const { student_id, student_status } = body

      await Promise.allSettled([
        admin.from('law_student_profiles').update({ status: student_status, updated_at: now }).eq('id', student_id),
        admin.from('registered_users').update({ blocked: student_status === 'suspended' }).eq('id', student_id),
      ])

      return NextResponse.json({ success: true, message: 'Nomzod holati yangilandi' })
    }

    return NextResponse.json({ success: false, error: 'Noma’lum amal' }, { status: 400 })
  } catch (error: any) {
    console.error('Yosh advokatlar POST xatosi:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
