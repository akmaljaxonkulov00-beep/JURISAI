import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'

/**
 * POST /api/auth/login
 * Real Supabase email+parol bilan kirish.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email va parol kiritilishi shart' }, { status: 400 })
    }

    const supabase = getSupabaseAuthClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      let message = 'Login xatosi'
      if (error.message.includes('Invalid login')) message = "Email yoki parol noto'g'ri"
      else if (error.message.includes('Email not confirmed')) message = 'Email tasdiqlanmagan'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session ? { access_token: data.session.access_token } : null,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
