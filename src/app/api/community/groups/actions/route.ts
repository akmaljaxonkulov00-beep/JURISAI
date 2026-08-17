import { NextRequest, NextResponse } from 'next/server'
import { errorMessage, getServiceClient, requireUser } from '@/lib/community-server'

// GET /api/community/groups/actions?groupId=...
// Moderatsiya jurnali — faqat guruh yaratuvchisi/moderatori ko'ra oladi.
// Identity faqat session'dan — query'dagi moderatorId ishonilmaydi.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const moderatorId = auth.user.id

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) return NextResponse.json({ success: true, data: [] })

    // Faqat yaratuvchi/moderator
    const { data: group } = await supabase
      .from('community_groups')
      .select('created_by')
      .eq('id', groupId)
      .single()
    const isCreator = group?.created_by?.toString() === moderatorId
    let isModerator = false
    if (!isCreator) {
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
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, 'Jurnalni yuklashda xatolik') },
      { status: 500 }
    )
  }
}
