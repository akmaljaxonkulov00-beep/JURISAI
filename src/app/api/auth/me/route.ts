import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'

/**
 * GET /api/auth/me
 * Joriy Supabase session foydalanuvchisini qaytaradi.
 * Session bo'lmasa 401 (soxta/fake user qaytarilmaydi).
 */
export async function GET(request: NextRequest) {
  try {
    // Client token (Authorization header) orqali session aniqlanadi
    const authHeader = request.headers.get('authorization') || ''
    const accessToken = authHeader.replace(/^Bearer\s+/i, '')

    const supabase = getSupabaseAuthClient()

    let user = null
    if (accessToken) {
      const { data } = await supabase.auth.getUser(accessToken)
      user = data?.user || null
    } else {
      // Cookie asosidagi session
      const { data } = await supabase.auth.getSession()
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
