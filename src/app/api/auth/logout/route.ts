import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/logout
 * Supabase sessionni bekor qiladi (token o'chiradi).
 * Cookie/session yo'q bo'lsa ham xavfsiz — muvaffaqiyat qaytaradi.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && anonKey) {
      const authHeader = request.headers.get('authorization') || ''
      const accessToken = authHeader.replace(/^Bearer\s+/i, '')

      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { cookie: request.headers.get('cookie') || '' } },
      })

      // Supabase admin API orqali sessiyani bekor qilish (refresh token revoke)
      const refreshToken = request.cookies.get('sb-refresh-token')?.value
      if (accessToken && refreshToken) {
        try {
          await supabase.auth.admin.signOut(accessToken)
        } catch {
          /* signOut xatosi e'tiborsiz */
        }
      } else if (accessToken) {
        try {
          await supabase.auth.admin.signOut(accessToken)
        } catch {
          /* signOut xatosi e'tiborsiz */
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Muvaffaqiyatli chiqildi' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Chiqishda xatolik yuz berdi' }, { status: 500 })
  }
}
