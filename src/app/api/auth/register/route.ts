import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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

    const supabase = getSupabaseAuthClient()

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

    if (data?.user && !data.session) {
      try {
        const admin = getSupabaseAdmin()
        await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true }).catch(() => {})
      } catch {}
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
