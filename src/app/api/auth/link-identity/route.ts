import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/link-identity
 *
 * Google OAuth orqali kirganda Supabase avtomatik linking ishlamasa (masalan
 * auth.identities bo'sh bo'lgan eski userlar), bir xil email bilan IKKINCHI
 * auth user yaratilishi mumkin. Bu endpoint shunday duplicate'larni aniqlab,
 * ularni bitta akkauntga birlashtiradi:
 *
 *   1) email bo'yicha mavjud (canonical) auth user topiladi
 *   2) yangi (duplicate) userning identity'larini canonical user'ga ko'chiradi
 *   3) registered_users ni birlashtiradi (ADMIN rol saqlanadi)
 *   4) duplicate auth userni o'chiradi
 *
 * Body: { email: string, userId: string }   — userId = hozirgi session user
 *
 * Javob:
 *   { success: true, merged: boolean, keepUserId?: string }
 *   merged=true bo'lsa session user o'chirilgan — client qayta kirishni so'rashi
 *   kerak (cookie tozalanadi, /signin?linked=1 ga yuboriladi).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body?.email || '').toLowerCase().trim()
    const currentUserId = body?.userId as string | undefined

    if (!email || !currentUserId) {
      return NextResponse.json({ success: false, error: 'email va userId kerak' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ── 1) Shu email bilan boshqa auth user bormi? ──
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (usersError) throw usersError

    const candidates = users.users.filter(
      u => u.email && u.email.toLowerCase() === email && u.id !== currentUserId
    )
    if (candidates.length === 0) {
      // Duplicate yo'q — hech narsa qilish shart emas
      return NextResponse.json({ success: true, merged: false })
    }

    // ── 2) Canonical (saqlanadigan) userni tanlash ──
    // Avval registered_users da mavjud bo'lganini (rol/premium bilan), aks
    // holda eng eski yaratilganini saqlaymiz.
    const { data: regRows } = await supabase
      .from('registered_users')
      .select('id')
      .in(
        'id',
        candidates.map(c => c.id)
      )
    const regIds = new Set((regRows || []).map((r: any) => r.id))

    const keep =
      candidates.find(c => regIds.has(c.id)) ||
      [...candidates].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))[0]

    if (!keep) {
      return NextResponse.json({ success: true, merged: false })
    }

    // ── 3) Birlashtirish — SQL funksiya (migration 20250803) ──
    const { data: mergedId, error: mergeError } = await supabase.rpc('merge_duplicate_users', {
      p_keep_id: keep.id,
      p_remove_id: currentUserId,
    })

    if (mergeError) {
      console.warn('[link-identity] merge failed:', mergeError.message)
      return NextResponse.json(
        { success: false, error: mergeError.message, merged: false },
        { status: 200 }
      )
    }

    console.log(
      `[link-identity] Merged ${currentUserId} (${email}) into ${mergedId || keep.id}`
    )

    return NextResponse.json({
      success: true,
      merged: true,
      keepUserId: mergedId || keep.id,
    })
  } catch (error: any) {
    console.warn('[link-identity] error:', error?.message)
    return NextResponse.json({ success: false, error: error?.message || 'Xatolik' }, { status: 500 })
  }
}
