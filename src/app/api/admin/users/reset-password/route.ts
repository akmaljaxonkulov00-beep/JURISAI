import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * POST /api/admin/users/reset-password
 *
 * Admin istalgan foydalanuvchining parolini qayta o'rnatadi.
 * Supabase service role key bilan auth.users paroli to'g'ridan-to'g'ri
 * yangilanadi — email talab qilinmaydi, user xabardor bo'lishi shart emas
 * (agar kerak bo'lsa bildirishnoma alohida yuboriladi).
 *
 * Body: { userId: string, email?: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const userId = String(body?.userId || '').trim()
    const email = String(body?.email || '').trim()
    const password = String(body?.password || '')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId kiritilishi shart' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Parol kamida 6 belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })

    await logAdminAction({
      admin: auth.user,
      action: 'user_password_reset',
      targetType: 'user',
      targetId: userId,
      targetEmail: email || data?.user?.email || '',
      details: { userId },
      success: !error,
    })

    if (error) {
      console.warn('[reset-password] error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      message: `Parol muvaffaqiyatli o'rnatildi (${data?.user?.email || email || userId.slice(0, 8)})`,
    })
  } catch (error) {
    console.warn('[reset-password] exception:', error)
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
