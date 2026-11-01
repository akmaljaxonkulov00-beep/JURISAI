import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { resolvePlatformRole, type PlatformRole } from '@/lib/roles'

/**
 * POST /api/auth/signup
 *
 * Real Supabase ro'yxatdan o'tish. Email tasdiqlash yoqilgan bo'lsa ham
 * emailni SERVER TOMONIDAN avtomatik tasdiqlaydi (service role key) —
 * shunda foydalanuvchi email xatini kutmasdan darhol kirishi mumkin.
 *
 * Body: { name, email, password, role?: 'citizen' | 'law_student' | 'advocate' | 'student' }
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role: requestedRole } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ism, email va parol kiritilishi shart' }, { status: 400 })
    }

    // Role xavfsizligi: hech kim o'zini admin sifatida ro'yxatdan o'tkaza olmaydi
    let validatedRole: PlatformRole = resolvePlatformRole(requestedRole)
    if (validatedRole === 'admin') {
      validatedRole = 'student' // Admin faqat tizim ichida beriladi
    }

    const supabase = getSupabaseAuthClient()

    const { data, error } = await supabase.auth.signUp({
      email,
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

    // Emailni avtomatik tasdiqlash (service role key bilan) va registered_users jadvalini sinxronlash
    try {
      const admin = getSupabaseAdmin()
      if (!data.session) {
        await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true }).catch(() => {})
      }

      // registered_users jadvaliga to'g'ri rolni yozish
      await admin.from('registered_users').upsert({
        id: data.user.id,
        email: data.user.email,
        name: name,
        full_name: name,
        role: validatedRole,
        is_active: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch {}

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: { id: data.user.id, email: data.user.email, role: validatedRole },
        needsEmailConfirmation: !data.session,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
