import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/register
 * Real Supabase ro'yxatdan o'tish + email avtomatik tasdiqlash.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, parol va ism talab qilinadi' }, { status: 400 })
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
      let message = "Ro'yxatdan o'tishda xatolik yuz berdi"
      if (error.message.includes('already registered')) {
        message = "Bu email allaqachon ro'yxatdan o'tgan"
      }
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (serviceKey && data?.user && !data.session) {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: "Muvaffaqiyatli ro'yxatdan o'tildi",
      user: data?.user ? { id: data.user.id, email: data.user.email, name } : null,
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: "Ro'yxatdan o'tishda xatolik yuz berdi" }, { status: 500 })
  }
}
