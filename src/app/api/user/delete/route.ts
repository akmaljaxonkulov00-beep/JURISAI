import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/user/delete
 *
 * Foydalanuvchi FAQAT O'Z hisobini o'chira oladi — identity tasdiqlangan
 * session'dan olinadi. Client yuborgan userId/email/authToken ishonilmaydi.
 *
 * (Admin boshqa foydalanuvchini o'chirishi — /api/admin/users DELETE orqali,
 * u requireAdmin bilan himoyalangan.)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // ── Bog'liq ma'lumotlarni o'chirish (faqat o'z id bilan) ──
    try {
      await supabase.from('registered_users').delete().eq('id', userId)
    } catch {}
    try {
      await supabase.from('payment_requests').delete().eq('user_id', userId)
    } catch {}
    try {
      await supabase.from('user_notifications').delete().eq('user_id', userId)
    } catch {}
    try {
      await supabase.from('community_group_members').delete().eq('user_id', userId)
    } catch {}
    try {
      await supabase.from('community_group_posts').delete().eq('user_id', userId)
    } catch {}
    try {
      await supabase.from('usage_logs').delete().eq('user_id', userId)
    } catch {}

    // ── Supabase Auth'dan o'chirish ──
    let authDeleted = false
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      authDeleted = !error
    } catch {
      authDeleted = false
    }

    return NextResponse.json({
      success: true,
      message: "Hisob muvaffaqiyatli o'chirildi",
      authDeleted,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Hisobni o'chirishda xatolik yuz berdi"
    console.error('Account deletion error:', e)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
