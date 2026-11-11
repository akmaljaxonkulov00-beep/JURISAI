import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loginIdentifier, inviteToken, tempPassword, newPassword, email, fullName } = body
    const cleanLogin = (loginIdentifier || inviteToken || '').trim()

    if (!cleanLogin || !tempPassword?.trim() || !newPassword?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Maxsus login/taklifnoma kodi, vaqtinchalik parol va yangi parol kiritilishi shart' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi lozim' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const hash = crypto.createHash('sha256').update(tempPassword.trim()).digest('hex')

    // 1. Taklifnomani topish va tekshirish (login_identifier yoki id bo'yicha)
    let invQuery = admin
      .from('law_student_invitations')
      .select('*')

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanLogin)
    if (isUuid) {
      invQuery = invQuery.or(`login_identifier.eq.${cleanLogin},id.eq.${cleanLogin}`)
    } else {
      invQuery = invQuery.eq('login_identifier', cleanLogin)
    }

    const { data: inv, error: invErr } = await invQuery.maybeSingle()

    if (invErr || !inv) {
      return NextResponse.json(
        { success: false, error: 'Bunday maxsus loginli taklifnoma topilmadi' },
        { status: 404 }
      )
    }

    if (inv.is_used || inv.status === 'used') {
      return NextResponse.json(
        { success: false, error: 'Ushbu taklifnoma bir martalik bo‘lib, allaqachon ishlatilgan' },
        { status: 410 } // Gone
      )
    }

    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Taklifnomaning amal qilish muddati tugagan' },
        { status: 410 }
      )
    }

    if (inv.temp_password_hash !== hash) {
      return NextResponse.json(
        { success: false, error: 'Vaqtinchalik parol noto‘g‘ri' },
        { status: 401 }
      )
    }

    // 2. Supabase Auth da haqiqiy foydalanuvchi hisobini yaratish / yangilash
    const userEmail = email?.trim() || inv.email || `${cleanLogin.toLowerCase()}@student.juristiv.uz`

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: userEmail,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        name: inv.student_name,
        full_name: inv.student_name,
        role: 'LAW_STUDENT',
        university: inv.university,
        student_id: inv.student_id_code,
      },
    })

    let userId: string

    if (authErr) {
      // Agar email mavjud bo'lsa, parolini yangilashga urinib ko'ramiz
      const { data: existingUser } = await admin
        .from('registered_users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle()

      if (existingUser) {
        userId = existingUser.id
        await admin.auth.admin.updateUserById(userId, { password: newPassword })
      } else {
        return NextResponse.json(
          { success: false, error: 'Foydalanuvchi hisobini yaratib bo‘lmadi: ' + authErr.message },
          { status: 500 }
        )
      }
    } else {
      userId = authData.user.id
    }

    const now = new Date().toISOString()

    // 3. registered_users jadvalida rolni LAW_STUDENT deb belgilash
    await admin.from('registered_users').upsert({
      id: userId,
      email: userEmail,
      name: inv.student_name,
      full_name: inv.student_name,
      role: 'LAW_STUDENT',
      must_change_password: false,
      updated_at: now,
    })

    // 4. law_student_profiles yaratish
    await admin.from('law_student_profiles').upsert({
      user_id: userId,
      full_name: inv.student_name,
      university: inv.university,
      faculty: inv.faculty,
      study_year: inv.study_year,
      student_id_number: inv.student_id_code,
      level: 'beginner',
      reputation_score: 50,
      status: 'active',
      updated_at: now,
    })

    // 5. student_wallets ochish
    await admin.from('student_wallets').upsert({
      student_id: userId,
      balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      updated_at: now,
    })

    // 6. Taklifnomani 'used' holatiga o'tkazish
    await admin
      .from('law_student_invitations')
      .update({
        is_used: true,
        status: 'used',
        used_at: now,
        used_by_user_id: userId,
        updated_at: now,
      })
      .eq('id', inv.id)

    return NextResponse.json({
      success: true,
      message: 'Tabriklaymiz! Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz va parolingiz o‘rnatildi.',
      data: {
        userId,
        email: userEmail,
        studentName: inv.student_name,
        role: 'LAW_STUDENT',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
