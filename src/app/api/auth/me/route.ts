import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/auth/me
 * Joriy Supabase session foydalanuvchisini qaytaradi.
 * Session bo'lmasa 401 (soxta/fake user qaytarilmaydi).
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Client token (Authorization header) orqali session aniqlanadi
    const authHeader = request.headers.get('authorization') || ''
    const accessToken = authHeader.replace(/^Bearer\s+/i, '')

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let user = null
    if (accessToken) {
      const { data } = await supabase.auth.getUser(accessToken)
      user = data?.user || null
    } else {
      // Cookie asosidagi session — server tomonida Supabase cookie'larini
      // o'qish uchun client yaratamiz
      const cookieClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { cookie: request.headers.get('cookie') || '' } },
      })
      const { data } = await cookieClient.auth.getSession()
      user = data?.session?.user || null
    }

    if (!user) {
      return NextResponse.json({ error: 'Authenticated user not found' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        role: user.user_metadata?.role || 'USER',
        avatar: user.user_metadata?.avatar || '',
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: "Foydalanuvchi ma'lumotlarini olishda xatolik" },
      { status: 500 }
    )
  }
}
