import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/signup
 *
 * Real Supabase ro'yxatdan o'tish. Email tasdiqlash yoqilgan bo'lsa ham
 * emailni SERVER TOMONIDAN avtomatik tasdiqlaydi (service role key) —
 * shunda foydalanuvchi email xatini kutmasdan darhol kirishi mumkin.
 *
 * Body: { name, email, password }
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ism, email va parol kiritilishi shart' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name, role: 'USER', subscription_plan: 'free' },
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

    // Emailni avtomatik tasdiqlash (service role key bilan)
    if (serviceKey && !data.session) {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true }).catch(() => {})
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: { id: data.user.id, email: data.user.email },
        needsEmailConfirmation: !data.session && !serviceKey,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
