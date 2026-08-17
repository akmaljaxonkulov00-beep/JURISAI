import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/login
 * Real Supabase email/parol bilan kirish.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email va parol talab qilinadi' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      let message = "Email yoki parol noto'g'ri"
      if (error.message.includes('Email not confirmed')) {
        message = 'Email tasdiqlanmagan'
      }
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: 'Muvaffaqiyatli login qilindi',
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'USER',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
          }
        : null,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login qilishda xatolik yuz berdi' }, { status: 500 })
  }
}
