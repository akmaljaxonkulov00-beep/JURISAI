import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/community/groups/requests?groupId=... — guruhga yuborilgan so'rovlar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) return NextResponse.json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('community_group_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "So'rovlarni yuklashda xatolik" },
      { status: 500 }
    )
  }
}

// POST — foydalanuvchi guruhga qo'shilish so'rovini yuboradi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, userId, userName, userEmail } = body

    if (!groupId || !userId) {
      return NextResponse.json(
        { success: false, error: 'groupId va userId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('community_group_join_requests')
      .upsert(
        {
          group_id: groupId,
          user_id: userId,
          user_name: userName || '',
          user_email: userEmail || '',
          status: 'pending',
          created_at: new Date().toISOString(),
          decided_at: null,
        },
        { onConflict: 'group_id,user_id' }
      )
      .select()
      .single()

    if (error) throw error

    // Guruh yaratuvchisiga bildirishnoma — yangi qo'shilish so'rovi
    try {
      const { data: group } = await supabase
        .from('community_groups')
        .select('created_by, name')
        .eq('id', groupId)
        .single()
      if (group?.created_by) {
        await supabase.from('community_group_notifications').insert({
          group_id: groupId,
          user_id: group.created_by.toString(),
          type: 'join_request',
          title: "Yangi qo'shilish so'rovi",
          message: `${userName || userEmail || 'Foydalanuvchi'} "${group.name}" guruhiga qo'shilish so'rovini yubordi`,
          actor_id: userId,
          actor_name: userName || userEmail || '',
        })
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data,
      message: "Qo'shilish so'rovingiz yuborildi. Guruh yaratuvchisi tasdiqlashini kuting.",
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "So'rov yuborishda xatolik" },
      { status: 500 }
    )
  }
}

// PATCH — tasdiqlash / rad etish (guruh yaratuvchisi yoki admin)
// Body: { id: requestId, status: 'approved' | 'rejected' }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'id va status (approved/rejected) kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // 1) So'rovni topish
    const { data: req, error: reqErr } = await supabase
      .from('community_group_join_requests')
      .select('*')
      .eq('id', id)
      .single()
    if (reqErr || !req) throw reqErr || new Error("So'rov topilmadi")

    if (req.status === 'approved' && status === 'approved') {
      return NextResponse.json({ success: true, data: req, message: 'Allaqachon tasdiqlangan' })
    }

    // 2) Tasdiqlansa — a'zo qilib qo'shamiz
    if (status === 'approved') {
      await supabase.from('community_group_members').upsert(
        {
          group_id: req.group_id,
          user_id: req.user_id,
          role: 'member',
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'group_id,user_id', ignoreDuplicates: true }
      )
      const { data: group } = await supabase
        .from('community_groups')
        .select('member_count')
        .eq('id', req.group_id)
        .single()
      await supabase
        .from('community_groups')
        .update({
          member_count: (group?.member_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.group_id)
    }

    // 3) So'rov holatini yangilash
    const { data, error } = await supabase
      .from('community_group_join_requests')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // So'rovchiga bildirishnoma — tasdiqlandi / rad etildi
    try {
      const { data: group } = await supabase
        .from('community_groups')
        .select('name')
        .eq('id', req.group_id)
        .single()
      const approved = status === 'approved'
      await supabase.from('community_group_notifications').insert({
        group_id: req.group_id,
        user_id: req.user_id,
        type: approved ? 'approved' : 'rejected',
        title: approved ? 'Qo\'shilish so\'rovingiz tasdiqlandi ✅' : 'Qo\'shilish so\'rovingiz rad etildi',
        message: approved
          ? `Siz "${group?.name || 'guruh'}" guruhiga qabul qilindingiz — endi muhokamada qatnashishingiz mumkin`
          : `"${group?.name || 'guruh'}" guruhiga qo\'shilish so\'rovingiz rad etildi`,
      })
    } catch {}

    return NextResponse.json({
      success: true,
      data,
      message:
        status === 'approved'
          ? "So'rov tasdiqlandi — foydalanuvchi a'zo bo'ldi"
          : "So'rov rad etildi",
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "So'rovni yangilashda xatolik" },
      { status: 500 }
    )
  }
}
