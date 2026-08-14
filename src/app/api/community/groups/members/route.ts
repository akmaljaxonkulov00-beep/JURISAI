import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/community/groups/members?groupId=... — guruh a'zolari ro'yxati
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
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data: members, error } = await supabase
      .from('community_group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    // A'zolarning ism/email ma'lumotlarini registered_users dan olamiz
    const userIds = (members || []).map((m: any) => m.user_id).filter(Boolean)
    const names: Record<string, { name?: string; email?: string }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('registered_users')
        .select('id, full_name, email, avatar')
        .in('id', userIds)
      for (const u of users || []) {
        names[u.id] = { name: u.full_name || '', email: u.email || '' }
      }
    }

    const result = (members || []).map((m: any) => ({
      user_id: m.user_id,
      role: m.role || 'member',
      joined_at: m.joined_at,
      name: names[m.user_id]?.name || '',
      email: names[m.user_id]?.email || '',
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "A'zolar ro'yxatini yuklashda xatolik" },
      { status: 500 }
    )
  }
}

// DELETE /api/community/groups/members?groupId=...&userId=... — a'zoni chiqarish
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const userId = searchParams.get('userId')

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

    // 1) A'zolikni o'chirish
    const { error: delErr } = await supabase
      .from('community_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (delErr) throw delErr

    // 2) member_count ni kamaytirish
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "A'zoni chiqarishda xatolik" },
      { status: 500 }
    )
  }
}
