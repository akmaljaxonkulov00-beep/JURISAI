import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/auth/user-role?email=...&userId=...
 *
 * Foydalanuvchining ishonchli rolini (ADMIN/USER) va premium ma'lumotlarini
 * registered_users jadvalidan qaytaradi. Google OAuth orqali kirgan
 * foydalanuvchilar uchun role user_metadata'da bo'lmasligi mumkin — shuning
 * uchun rol manbai sifatida Supabase database ishlatiladi.
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, error: 'email yoki userId kerak' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let query = supabase
      .from('registered_users')
      .select('id, email, name, role, subscription_plan, subscription_expires_at')

    if (userId) {
      query = query.eq('id', userId)
    } else {
      query = query.eq('email', (email || '').toLowerCase())
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.warn('[user-role] query error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.warn('[user-role] error:', error?.message)
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}
