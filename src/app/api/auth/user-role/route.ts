import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'
import { normalizeRole } from '@/lib/roles'
import { requireUser } from '@/lib/server-auth'

/**
 * GET /api/auth/user-role?email=...&userId=...
 *
 * Foydalanuvchining ishonchli rolini (ADMIN/USER) va premium ma'lumotlarini
 * registered_users jadvalidan qaytaradi. Google OAuth orqali kirgan
 * foydalanuvchilar uchun role user_metadata'da bo'lmasligi mumkin — shuning
 * uchun rol manbai sifatida Supabase database ishlatiladi.
 *
 * XAVFSIZLIK: haqiqiy session talab qilinadi va FAQAT session foydalanuvchisiga
 * tegishli ma'lumot qaytariladi (email == session email yoki id == session id).
 * Boshqa foydalanuvchining roli/obunasi so'rab bo'lmaydi.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const email = request.nextUrl.searchParams.get('email')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, error: 'email yoki userId kerak' },
        { status: 400 }
      )
    }

    // ── Session tekshiruvi: so'ralayotgan ma'lumot session userga tegishli bo'lishi shart ──
    const reqEmail = (email || '').toLowerCase().trim()
    const sessionEmail = auth.user.email.toLowerCase().trim()
    if (reqEmail && reqEmail !== sessionEmail) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    if (userId && userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    let supabase
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // 1) userId bo'yicha qidirish (registered_users.id == Supabase auth user id)
    let query = supabase
      .from('registered_users')
      .select('id, email, name, role, subscription_plan, subscription_expires_at')

    if (userId) {
      query = query.eq('id', userId)
    } else {
      query = query.eq('email', reqEmail)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.warn('[user-role] query error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 2) userId topilmasa — email bo'yicha fallback (id bog'lanishi buzilgan holatlar)
    let row = data
    if (!row && userId && email) {
      const fallback = await supabase
        .from('registered_users')
        .select('id, email, name, role, subscription_plan, subscription_expires_at')
        .eq('email', (email || '').toLowerCase())
        .maybeSingle()
      if (!fallback.error) row = fallback.data
    }

    if (!row) {
      return NextResponse.json({ success: true, data: null })
    }

    // Rol ichki formatga keltiriladi: ADMIN/SUPER_ADMIN/admin/super_admin → ADMIN
    return NextResponse.json({
      success: true,
      data: { ...row, role: normalizeRole(row.role) },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    console.warn('[user-role] error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
