import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/server-auth'

/**
 * POST /api/auth/sync-user
 *
 * Foydalanuvchi profil ma'lumotlarini registered_users jadvaliga sinxronlaydi.
 *
 * XAVFSIZLIK:
 *   - identity (id/email) FAQAT tasdiqlangan Supabase session'dan olinadi —
 *     client tomonidan yuborilgan `id`, `email` ishonilmaydi.
 *   - `role` va `subscription_plan` HECH QACHON client'dan qabul qilinmaydi.
 *     Rol jadvaldagi mavjud qiymat saqlanadi; yangi userlar har doim 'USER'
 *     va 'free' bilan yaratiladi. Admin bo'lish faqat server/admin orqali mumkin.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const sessionUserId = auth.user.id
    const sessionEmail = auth.user.email

    const body = await request.json().catch(() => ({}))
    // Profil maydonlari (faqat ko'rsatish uchun) — xavfsiz, lekin rolni
    // o'zgartira olmaydi.
    const clientName = String(body?.name || body?.full_name || '').trim()
    const provider = String(body?.provider || 'email').trim()
    const phone = body?.phone ? String(body.phone) : undefined
    const avatar = body?.avatar ? String(body.avatar) : undefined

    const admin = getSupabaseAdmin()

    // ── Mavjud yozuv — rol/subscription faqat shu yerdan olinadi ──
    const { data: existing } = await admin
      .from('registered_users')
      .select('id, role, subscription_plan, subscription_expires_at, name')
      .eq('id', sessionUserId)
      .maybeSingle()

    const resolvedName = clientName || existing?.name || sessionEmail.split('@')[0] || ''

    const now = new Date().toISOString()
    const safePayload: Record<string, unknown> = {
      email: sessionEmail,
      name: resolvedName,
      full_name: resolvedName,
      provider,
      last_login: now,
    }
    if (phone) safePayload.phone = phone
    if (avatar) safePayload.avatar = avatar

    if (existing) {
      // Mavjud user: rol va subscription O'ZGARMAYDI (client ularni yubora olmaydi)
      const { error: updateError } = await admin
        .from('registered_users')
        .update(safePayload)
        .eq('id', sessionUserId)
      if (updateError) {
        console.warn('[sync-user] update error:', updateError.message)
        return NextResponse.json({ success: false, error: updateError.message }, { status: 200 })
      }
      const { data: updated } = await admin
        .from('registered_users')
        .select('*')
        .eq('id', sessionUserId)
        .single()
      return NextResponse.json({ success: true, data: updated })
    }

    // ── Yangi user: har doim USER + free ──
    const insertPayload: Record<string, unknown> = {
      ...safePayload,
      id: sessionUserId,
      role: 'USER',
      subscription_plan: 'free',
      created_at: now,
      last_login: now,
    }
    let insertResult = await admin.from('registered_users').insert(insertPayload)

    // `phone` ustuni bo'lmagan eski baza uchun chidamli urinish
    if (insertResult.error && /column.*phone|phone.*column/i.test(insertResult.error.message)) {
      const noPhone = { ...insertPayload }
      delete noPhone.phone
      insertResult = await admin.from('registered_users').insert(noPhone)
    }

    if (insertResult.error && insertResult.error.code !== '23505') {
      console.warn('[sync-user] insert error:', insertResult.error.message)
      return NextResponse.json(
        { success: false, error: insertResult.error.message },
        { status: 200 }
      )
    }

    const { data: created } = await admin
      .from('registered_users')
      .select('*')
      .eq('id', sessionUserId)
      .maybeSingle()

    return NextResponse.json({ success: true, data: created })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    console.warn('[sync-user] error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
