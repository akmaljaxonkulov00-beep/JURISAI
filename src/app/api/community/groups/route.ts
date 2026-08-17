import { NextRequest, NextResponse } from 'next/server'
import { errorMessage, getServiceClient, requireAdmin, requireUser } from '@/lib/community-server'

interface GroupLite {
  id: string
  member_count?: number
  [key: string]: unknown
}

/**
 * Jamiyat guruhlari — umumiy endpoint.
 *
 * XAVFSIZLIK:
 * - GET — ommaviy guruhlar hammaga ko'rinadi; maxfiy guruhlar FAQAT
 *   session'dagi foydalanuvchining o'z a'zoligiga qarab qaytadi
 *   (query'dagi memberId ishonilmaydi — boshqa userning maxfiy guruhlari ko'rinmaydi).
 * - POST/PUT/PATCH/DELETE — identity faqat tasdiqlangan session'dan.
 *   `admin: true` body flag'i o'rniga server-side requireAdmin ishlaydi.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const search = (searchParams.get('search') || '').trim()
    const privacy = searchParams.get('privacy') || 'all'

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Maxfiy guruhlar uchun identity faqat session'dan (ixtiyoriy auth)
    const auth = await requireUser(request)
    const memberId = auth.ok ? auth.user.id : ''

    // 1) Ommaviy guruhlar — hamma ko'radi
    let query = supabase.from('community_groups').select('*').eq('is_private', false)

    if (id) {
      query = query.eq('id', id)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (privacy === 'public') {
      query = query.eq('join_approval', false)
    } else if (privacy === 'approval') {
      query = query.eq('join_approval', true)
    }

    const { data: publicGroups, error: pubErr } = await query
      .order('member_count', { ascending: false })
      .limit(50)
    if (pubErr) throw pubErr

    const groups: GroupLite[] = [...(publicGroups || [])] as GroupLite[]

    // 2) Maxfiy guruhlar — faqat session userning O'Z a'zoliklari
    if (memberId) {
      try {
        const { data: memberships } = await supabase
          .from('community_group_members')
          .select('group_id')
          .eq('user_id', memberId)

        const ids = (memberships || [])
          .map((m: { group_id?: string }) => m.group_id)
          .filter(Boolean)
        if (ids.length > 0) {
          const { data: privateGroups } = await supabase
            .from('community_groups')
            .select('*')
            .in('id', ids)
            .eq('is_private', true)
            .order('member_count', { ascending: false })
            .limit(50)
          groups.push(...(privateGroups || []))
        }
      } catch {
        /* a'zolik so'rovi xatosi — faqat ommaviy guruhlar qaytadi */
      }
    }

    // 3) Birlashtirilgan ro'yxat (duplikat yo'q)
    const seen = new Set<string>()
    const merged = groups
      .filter(g => {
        if (seen.has(g.id)) return false
        seen.add(g.id)
        return true
      })
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))

    return NextResponse.json({ success: true, data: merged })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, 'Guruhlarni yuklashda xatolik') },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { name, description, icon, category, is_private, join_approval } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Guruh nomi kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Yaratuvchi — faqat session user (body'dagi userId ishonilmaydi)
    const creatorId = auth.user.id

    const insertPayload: Record<string, unknown> = {
      name,
      description: description || '',
      icon: icon || '👥',
      category: category || 'Umumiy',
      is_private: !!is_private,
      created_by: creatorId,
      member_count: 0,
      post_count: 0,
    }
    if (typeof join_approval === 'boolean') {
      insertPayload.join_approval = join_approval
    }

    const { data, error } = await supabase
      .from('community_groups')
      .insert(insertPayload)
      .select()
      .single()

    // Kolonna yo'q (migratsiya run qilinmagan) — join_approvalsiz qayta urinamiz
    if (error && /column|join_approval/i.test(error.message) && 'join_approval' in insertPayload) {
      delete insertPayload.join_approval
      const retry = await supabase.from('community_groups').insert(insertPayload).select().single()
      if (retry.error) throw retry.error
      return NextResponse.json({ success: true, data: retry.data })
    }

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, 'Guruh yaratishda xatolik') },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, admin, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Guruh ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const actorId = auth.user.id

    // ── Ruxsat: admin flag'i body'dan EMAS — server-side requireAdmin ──
    let isAdminActor = false
    if (admin === true || admin === '1') {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
      isAdminActor = true
    }

    if (!isAdminActor) {
      const { data: existing } = await supabase
        .from('community_groups')
        .select('created_by')
        .eq('id', id)
        .single()
      if (!existing || existing.created_by?.toString() !== actorId) {
        return NextResponse.json(
          { success: false, error: "Guruhni faqat yaratuvchisi o'zgartira oladi" },
          { status: 403 }
        )
      }
    }

    const updatePayload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    if (typeof updates.member_count !== 'undefined') {
      delete updatePayload.member_count
    }
    // invite_code ni to'g'ridan-to'g'ri yozishga yo'l qo'yma (faqat trigger/admin generatsiya qiladi)
    if (typeof updatePayload.invite_code !== 'undefined') {
      delete updatePayload.invite_code
    }
    // Kodni qayta yaratish: invite_code = NULL qilinsa, DB trigger avtomatik yangi kod generatsiya qiladi
    if (updates.regenerate_code === true) {
      delete updatePayload.regenerate_code
      updatePayload.invite_code = null
    }

    // ── Yaratuvchi huquqini o'tkazish (transfer_to) ──
    if (updates.transfer_to) {
      if (isAdminActor) {
        delete updatePayload.transfer_to
      } else {
        const newOwnerId = String(updates.transfer_to)
        const { data: ownerMembership } = await supabase
          .from('community_group_members')
          .select('id')
          .eq('group_id', id)
          .eq('user_id', actorId)
          .maybeSingle()
        if (ownerMembership) {
          await supabase
            .from('community_group_members')
            .update({ role: 'moderator', updated_at: new Date().toISOString() })
            .eq('id', ownerMembership.id)
        }
        await supabase
          .from('community_group_members')
          .upsert(
            {
              group_id: id,
              user_id: newOwnerId,
              role: 'creator',
              joined_at: new Date().toISOString(),
            },
            { onConflict: 'group_id,user_id' }
          )
        updatePayload.created_by = newOwnerId
        delete updatePayload.transfer_to
      }
    }

    const { data, error } = await supabase
      .from('community_groups')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, 'Guruhni yangilashda xatolik') },
      { status: 500 }
    )
  }
}

// PATCH — member_count ni nisbiy o'zgartirish (delta: +1 / -1)
// Identity faqat session'dan — foydalanuvchi faqat O'Z a'zoligini qo'shadi/olib tashlaydi.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, delta } = body

    if (!id || typeof delta !== 'number') {
      return NextResponse.json(
        { success: false, error: 'id va delta kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const userId = auth.user.id

    // 1) Guruh holatini o'qish (a'zolik + maxfiylik tekshiruvi uchun)
    const { data: current, error: curErr } = await supabase
      .from('community_groups')
      .select('member_count, is_private, created_by')
      .eq('id', id)
      .single()
    if (curErr) throw curErr

    // Maxfiy guruhga to'g'ridan-to'g'ri qo'shilish taqiqlanadi — taklif kodi kerak
    if (delta > 0 && current?.is_private && current.created_by?.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: "Maxfiy guruhga taklif kodi orqali qo'shilishingiz mumkin" },
        { status: 403 }
      )
    }

    // 2) A'zolikni DB'da saqlash (faqat session user uchun)
    if (delta > 0) {
      await supabase
        .from('community_group_members')
        .upsert(
          { group_id: id, user_id: userId, role: 'member', joined_at: new Date().toISOString() },
          { onConflict: 'group_id,user_id', ignoreDuplicates: true }
        )
    } else {
      await supabase
        .from('community_group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', userId)
    }

    // 3) member_count ni nisbiy yangilash
    const newCount = Math.max(0, (current?.member_count || 0) + delta)

    const { data, error } = await supabase
      .from('community_groups')
      .update({ member_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, "A'zolar sonini yangilashda xatolik") },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const adminMode = searchParams.get('admin') === '1'

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Guruh ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // ── Ruxsat: admin=1 query flag'i o'rniga server-side requireAdmin ──
    if (adminMode) {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    } else {
      const userId = auth.user.id
      const { data: existing } = await supabase
        .from('community_groups')
        .select('created_by')
        .eq('id', id)
        .single()
      if (!existing || existing.created_by?.toString() !== userId) {
        return NextResponse.json(
          { success: false, error: "Guruhni faqat yaratuvchisi o'chira oladi" },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase.from('community_groups').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, "Guruhni o'chirishda xatolik") },
      { status: 500 }
    )
  }
}
