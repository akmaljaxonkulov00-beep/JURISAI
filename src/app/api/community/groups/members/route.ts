import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  canModerateGroup,
  getServiceClient,
  requireAdmin,
  requireUser,
} from '@/lib/community-server'

// Guruh a'zolari. Identity faqat session'dan — memberId/actorId ishonilmaydi.
// Admin panel `admin=1` flag'i o'rniga server-side requireAdmin ishlaydi.

// GET /api/community/groups/members?groupId=... — guruh a'zolari ro'yxati
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const adminMode = searchParams.get('admin') === '1'

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Admin panel: haqiqiy admin session talab qilinadi
    if (adminMode) {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    } else {
      // A'zolar ro'yxati faqat guruh a'zolariga ko'rinadi
      const allowed = await canAccessGroup(supabase, groupId, auth.user.id)
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: "A'zolar ro'yxati faqat guruh a'zolariga ko'rinadi" },
          { status: 403 }
        )
      }
    }

    const { data: members, error } = await supabase
      .from('community_group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    // A'zolarning ism ma'lumotlarini registered_users dan olamiz (email ko'rsatilmaydi)
    const userIds = (members || []).map((m: { user_id?: string }) => m.user_id).filter(Boolean)
    const names: Record<string, { name?: string }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('registered_users')
        .select('id, full_name')
        .in('id', userIds)
      for (const u of users || []) {
        names[u.id] = { name: u.full_name || '' }
      }
    }

    const result = (members || []).map(
      (m: { user_id?: string; role?: string; joined_at?: string }) => ({
        user_id: m.user_id,
        role: m.role || 'member',
        joined_at: m.joined_at,
        name: names[m.user_id || '']?.name || '',
      })
    )

    return NextResponse.json({ success: true, data: result })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "A'zolar ro'yxatini yuklashda xatolik",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/community/groups/members?groupId=...&userId=... — a'zoni chiqarish
// Ruxsat: o'zini tark etish (leave) | yaratuvchi/moderator boshqasini chiqaradi | admin
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const userId = searchParams.get('userId')
    const actorId = auth.user.id
    const adminMode = searchParams.get('actorId') === 'admin'

    if (!groupId || !userId) {
      return NextResponse.json(
        { success: false, error: 'groupId va userId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // ── Ruxsat tekshiruvi ──
    if (adminMode) {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    } else if (userId !== actorId) {
      // Boshqasini chiqarish — faqat yaratuvchi/moderator
      const allowed = await canModerateGroup(supabase, groupId, actorId)
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: "A'zoni chiqarish uchun ruxsat yo'q" },
          { status: 403 }
        )
      }
      // Yaratuvchini chiqarib bo'lmaydi
      const { data: group } = await supabase
        .from('community_groups')
        .select('created_by')
        .eq('id', groupId)
        .single()
      if (group?.created_by?.toString() === userId) {
        return NextResponse.json(
          { success: false, error: "Guruh yaratuvchisini chiqarib bo'lmaydi" },
          { status: 403 }
        )
      }
    }

    // 1) Chiqarilayotgan a'zoning ismini olamiz (bildirishnoma uchun)
    let removedName = ''
    const { data: removedUser } = await supabase
      .from('registered_users')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle()
    removedName = removedUser?.full_name || removedUser?.email || ''

    // 2) A'zolikni o'chirish
    const { error: delErr } = await supabase
      .from('community_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (delErr) throw delErr

    // 2.5) Chiqarilgan a'zoga bildirishnoma
    try {
      const { data: group } = await supabase
        .from('community_groups')
        .select('name')
        .eq('id', groupId)
        .single()
      await supabase.from('community_group_notifications').insert({
        group_id: groupId,
        user_id: userId,
        type: 'removed',
        title: 'Guruhdan chiqarildingiz',
        message: `Siz "${group?.name || 'guruh'}" guruhidan chiqarildingiz`,
        actor_name: removedName || '',
      })
    } catch {}

    // 2.7) Moderatsiya jurnaliga yozamiz (o'zini tark etishda emas)
    if (userId !== actorId) {
      try {
        await supabase.from('community_moderator_actions').insert({
          group_id: groupId,
          moderator_id: actorId,
          moderator_name: '',
          action: 'member_removed',
          target_name: removedName || '',
        })
      } catch {}
    }

    // 3) member_count ni kamaytirish
    const { data: group } = await supabase
      .from('community_groups')
      .select('member_count')
      .eq('id', groupId)
      .single()
    const newCount = Math.max(0, (group?.member_count || 0) - 1)
    await supabase
      .from('community_groups')
      .update({ member_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', groupId)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "A'zoni chiqarishda xatolik" },
      { status: 500 }
    )
  }
}

// PATCH /api/community/groups/members
// Body: { groupId, userId, role } — moderator tayinlash (guruh yaratuvchisi yoki admin)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { groupId, userId, role, actorId } = body
    const adminMode = actorId === 'admin'

    if (!groupId || !userId || !['member', 'moderator'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'groupId, userId va role (member/moderator) kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const actorUserId = auth.user.id

    // ── Ruxsat: admin panel (actorId='admin') → server-side requireAdmin; aks holda yaratuvchi ──
    if (adminMode) {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    } else {
      const { data: group } = await supabase
        .from('community_groups')
        .select('created_by, name')
        .eq('id', groupId)
        .single()
      if (!group || group.created_by?.toString() !== actorUserId) {
        return NextResponse.json(
          { success: false, error: 'Faqat guruh yaratuvchisi moderator tayinlashi mumkin' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('community_group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Moderatsiya jurnali — moderator tayinlandi / olindi
    try {
      await supabase.from('community_moderator_actions').insert({
        group_id: groupId,
        moderator_id: actorUserId,
        moderator_name: '',
        action: 'moderator_set',
        target_name: userId,
      })
    } catch {}

    // A'zoga bildirishnoma
    try {
      const { data: group } = await supabase
        .from('community_groups')
        .select('name')
        .eq('id', groupId)
        .single()
      const isModerator = role === 'moderator'
      await supabase.from('community_group_notifications').insert({
        group_id: groupId,
        user_id: userId,
        type: isModerator ? 'moderator' : 'demoted',
        title: isModerator ? 'Siz moderator etib tayinlandingiz 🛡️' : 'Moderatorlik olindi',
        message: isModerator
          ? `"${group?.name || 'guruh'}" guruhida endi moderator siz — xabarlarni boshqarishingiz mumkin`
          : `"${group?.name || 'guruh'}" guruhida moderatorlik huquqi olindi`,
        actor_id: actorUserId,
        actor_name: '',
      })
    } catch {}

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Rolni yangilashda xatolik' },
      { status: 500 }
    )
  }
}

// Guruh a'zosi/yaratuvchisi tekshiruvi
async function canAccessGroup(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<boolean> {
  if (!userId) return false
  const { data: group } = await supabase
    .from('community_groups')
    .select('created_by')
    .eq('id', groupId)
    .single()
  if (group && group.created_by?.toString() === userId) return true
  const { data: member } = await supabase
    .from('community_group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!member
}
