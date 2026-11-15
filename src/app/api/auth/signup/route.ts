import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { resolvePlatformRole, type PlatformRole } from '@/lib/roles'

/**
 * POST /api/auth/signup
 *
 * Real Supabase ro'yxatdan o'tish va rollarni ajratish:
 * - citizen: Fuqaro
 * - student: Umumiy talaba
 * - advocate: Litsenziyali advokat (litsenziya ma'lumotlari majburiy)
 * - law_student: Advokat bo'lmoqchi bo'lgan talaba (MAXSUS PAROL majburiy)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      role: requestedRole,
      licenseNumber,
      barAssociation,
      specialties,
      phone,
      city,
      specialCode,
      university,
    } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ism, email va parol kiritilishi shart' }, { status: 400 })
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanPhone = (phone || '').trim()
    const cleanCity = (city || '').trim()

    let validatedRole: PlatformRole = resolvePlatformRole(requestedRole)
    if (validatedRole === 'admin') {
      validatedRole = 'student' // Admin faqat tizim ichida beriladi
    }

    const admin = getSupabaseAdmin()

    // ── 0. Bitta email bilan faqat 1 ta rolga kirish tekshiruvi ──
    const { data: existingUser } = await admin
      .from('registered_users')
      .select('id, email, role')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        {
          error: `Ushbu email (${cleanEmail}) allaqachon ro‘yxatdan o‘tgan. Bitta email bilan bir nechta rolga a'zo bo‘lish mumkin emas. Mavjud hisobingiz bilan tizimga kiring.`,
        },
        { status: 409 }
      )
    }

    // Telefon raqami barcha rollar uchun majburiy
    if (!cleanPhone || cleanPhone.length < 7) {
      return NextResponse.json(
        { error: 'Aniq telefon raqamingizni kiriting (masalan: +998 90 123 45 67)' },
        { status: 400 }
      )
    }

    // ── 1. FUQARO UCHUN TEKSHIRUV: Shahar/Viloyat majburiy ──
    if (validatedRole === 'citizen') {
      if (!cleanCity) {
        return NextResponse.json(
          { error: 'Fuqaro sifatida ro‘yxatdan o‘tish uchun shahar yoki viloyatingizni kiritishingiz shart.' },
          { status: 400 }
        )
      }
    }

    // ── 2. TA'LIM TALABASI UCHUN TEKSHIRUV (OTM majburiy emas, ixtiyoriy) ──
    // Talaba OTM kiritmasdan ham ro'yxatdan o'ta oladi.

    // ── 3. ADVOKAT UCHUN TEKSHIRUV: Litsenziya ma'lumotlari majburiy ──
    if (validatedRole === 'advocate') {
      if (!licenseNumber?.trim() || !barAssociation?.trim()) {
        return NextResponse.json(
          {
            error:
              'Advokat sifatida ro‘yxatdan o‘tish uchun Litsenziya raqami va Advokatlar palatasi bo‘linmasi kiritilishi shart.',
          },
          { status: 400 }
        )
      }
      if (!cleanCity) {
        return NextResponse.json(
          { error: 'Advokat faoliyat ko‘rsatadigan shahar/viloyat kiritilishi shart.' },
          { status: 400 }
        )
      }
    }

    // ── 4. ADVOKAT BO‘LMOQCHI BO‘LGAN TALABA (YOSH ADVOKAT): Maxsus parol va OTM majburiy ──
    let inviteRecord: any = null
    if (validatedRole === 'law_student') {
      if (!university?.trim()) {
        return NextResponse.json(
          { error: 'Yuridik fakultet yoki OTM nomini kiriting.' },
          { status: 400 }
        )
      }
      const cleanCode = (specialCode || '').trim().toUpperCase()
      if (!cleanCode) {
        return NextResponse.json(
          {
            error:
              'Advokat bo‘lmoqchi bo‘lgan talabalar (Yosh advokatlar) faqat maxsus taklifnoma paroli orqali ro‘yxatdan o‘tishlari mumkin. Iltimos, maxsus parolni kiriting.',
          },
          { status: 400 }
        )
      }

      // Maxsus parolni bazadan yoki master kodlar ro'yxatidan tekshiramiz
      const { data: inv } = await admin
        .from('law_student_invitations')
        .select('*')
        .eq('invite_code', cleanCode)
        .maybeSingle()

      const MASTER_CODES = ['YOSH-ADVOKAT', 'YOSH-ADVOKAT-2026', 'NOMZOD-2026', 'ADVOKAT-NOMZOD', 'STAD-2026']
      if (inv && inv.status !== 'claimed') {
        inviteRecord = inv
      } else if (MASTER_CODES.includes(cleanCode)) {
        inviteRecord = { university: university || 'TDYU', faculty: body.faculty || 'Yurisprudensiya', study_year: body.studyYear || 3 }
      } else {
        return NextResponse.json(
          {
            error:
              'Kiritilgan maxsus taklifnoma paroli noto‘g‘ri yoki allaqachon ishlatilgan. Tekshirib qayta kiriting.',
          },
          { status: 400 }
        )
      }
    }

    const supabase = getSupabaseAuthClient()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          full_name: name,
          role: validatedRole,
          platform_role: validatedRole,
          subscription_plan: 'free',
        },
      },
    })

    if (error) {
      let message = 'Signup failed'
      const code = error.message || ''
      if (code.includes('already registered')) message = "Bu email allaqachon ro'yxatdan o'tgan"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (!data?.user) {
      return NextResponse.json({ error: 'Foydalanuvchi yaratilmadi' }, { status: 500 })
    }

    const userId = data.user.id
    const now = new Date().toISOString()

    // Emailni avtomatik tasdiqlash
    try {
      if (!data.session) {
        await admin.auth.admin.updateUserById(userId, { email_confirm: true }).catch(() => {})
      }

      // 1. registered_users jadvaliga aniq rolni yozish
      await admin.from('registered_users').upsert({
        id: userId,
        email: cleanEmail,
        name: name,
        full_name: name,
        role: validatedRole,
        phone: phone || null,
        city: city || (validatedRole === 'advocate' ? 'Toshkent' : 'Toshkent'),
        is_active: true,
        status: 'active',
        created_at: now,
        updated_at: now,
      })

      // 2. Agar ADVOKAT bo'lsa — advocate_profiles ga litsenziya ma'lumotlarini saqlash
      if (validatedRole === 'advocate') {
        const specs = specialties
          ? Array.isArray(specialties)
            ? specialties
            : String(specialties).split(',').map((s: string) => s.trim())
          : ['Fuqarolik huquqi', 'Biznes huquqi']

        await admin.from('advocate_profiles').upsert({
          id: userId,
          user_id: userId,
          full_name: name,
          email: cleanEmail,
          phone: phone || '',
          license_number: licenseNumber.trim(),
          bar_association: barAssociation.trim(),
          specialties: specs,
          location_city: city || 'Toshkent',
          experience_years: 3,
          hourly_rate: 200000,
          verification_status: 'approved',
          verified_at: now,
          rating: 5.0,
          review_count: 0,
          created_at: now,
          updated_at: now,
        })
      }

      // 3. Agar ADVOKAT BO‘LMOQCHI TALABA (Yosh advokat) bo'lsa — law_student_profiles va student_wallets ochish
      if (validatedRole === 'law_student') {
        await admin.from('law_student_profiles').upsert({
          id: userId,
          user_id: userId,
          full_name: name,
          email: cleanEmail,
          phone: phone || '',
          university: university || inviteRecord?.university || 'TDYU',
          faculty: inviteRecord?.faculty || 'Yurisprudensiya',
          study_year: inviteRecord?.study_year || 3,
          student_id_number: inviteRecord?.student_id_code || 'NOMZOD-' + Math.floor(100000 + Math.random() * 900000),
          verification_status: 'approved',
          created_at: now,
          updated_at: now,
        })

        await admin.from('student_wallets').upsert({
          student_id: userId,
          balance: 0,
          total_earned: 0,
          created_at: now,
          updated_at: now,
        })

        if (inviteRecord?.id) {
          await admin
            .from('law_student_invitations')
            .update({ status: 'claimed', claimed_by_user_id: userId, claimed_at: now })
            .eq('id', inviteRecord.id)
        }
      }
    } catch (saveErr) {
      console.warn('[signup] profile save error:', saveErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Muvaffaqiyatli ro‘yxatdan o‘tdingiz',
        user: { id: userId, email: cleanEmail, role: validatedRole },
        needsEmailConfirmation: !data.session,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}
