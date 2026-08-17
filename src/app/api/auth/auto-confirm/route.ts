import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/auto-confirm
 *
 * Yangi ro'yxatdan o'tgan foydalanuvchining emailini SERVER TOMONIDAN
 * avtomatik tasdiqlaydi (Supabase `mailer_autoconfirm` o'chirilgan bo'lsa ham).
 *
 * NEGA KERAK: Supabase'ning standart SMTP'si ko'p hollarda tasdiqlash xatini
 * yetkazmaydi (spam/rate-limit). Buning o'rniga ro'yxatdan o'tish jarayonida
 * email kutmasdan hisobni darhol faollashtiramiz — foydalanuvchi birinchi
 * urinishdayoq tizimga kiradi.
 *
 * Xavfsizlik: userId UUID formatida bo'lishi shart (tasodifiy tanlab bo'lmaydi).
 * Faqat ro'yxatdan o'tish oqimida chaqiriladi (client signUp natijasidan).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = String(body?.userId || '').trim()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId kiritilishi shart' },
        { status: 400 }
      )
    }
    // UUID format tekshiruvi — faqat haqiqiy UUID qabul qilinadi
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'userId noto\'g\'ri formatda' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) {
      console.warn('[auto-confirm] error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ success: true, data: { id: data?.user?.id } })
  } catch (error: any) {
    console.warn('[auto-confirm] exception:', error?.message)
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 200 }
    )
  }
}
