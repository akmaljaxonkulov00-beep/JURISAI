import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/community/groups/actions?groupId=...&moderatorId=...
// Moderatsiya jurnali — faqat guruh yaratuvchisi/moderatori ko'ra oladi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const moderatorId = searchParams.get('moderatorId') || ''

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) return NextResponse.json({ success: true, data: [] })

    // Faqat yaratuvchi/moderator
    const { data: group } = await supabase
      .from('community_groups')
      .select('created_by')
      .eq('id', groupId)
      .single()
    const isCreator = group?.created_by?.toString() === moderatorId
    let isModerator = false
    if (!isCreator && moderatorId) {
      const { data: member } = await supabase
        .from('community_group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', moderatorId)
        .maybeSingle()
      isModerator = !!member && ['moderator', 'admin'].includes(member.role)
    }
    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { success: false, error: "Jurnalni faqat yaratuvchi/moderator ko'ra oladi" },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('community_moderator_actions')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Jurnalni yuklashda xatolik" },
      { status: 500 }
    )
  }
}
