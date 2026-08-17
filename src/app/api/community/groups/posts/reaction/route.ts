import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireUser } from '@/lib/community-server'

// POST /api/community/groups/posts/reaction
// Body: { postId, emoji } — userId faqat session'dan.
// Reaksiyani yoqish/o'chirish (toggle). reactions = { "👍": ["user1", "user2"], ... }
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { postId, emoji } = body

    if (!postId || !emoji) {
      return NextResponse.json(
        { success: false, error: 'postId va emoji kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const userId = auth.user.id

    const { data: post, error: postErr } = await supabase
      .from('community_group_posts')
      .select('reactions, group_id')
      .eq('id', postId)
      .single()
    if (postErr || !post) throw postErr || new Error('Post topilmadi')

    // Faqat guruh a'zolari reaksiya bera oladi
    const { data: group } = await supabase
      .from('community_groups')
      .select('created_by')
      .eq('id', post.group_id)
      .single()
    const isCreator = group?.created_by?.toString() === userId
    const { data: member } = await supabase
      .from('community_group_members')
      .select('id')
      .eq('group_id', post.group_id)
      .eq('user_id', userId)
      .maybeSingle()
    if (!isCreator && !member) {
      return NextResponse.json(
        { success: false, error: "Faqat guruh a'zolari reaksiya bera oladi" },
        { status: 403 }
      )
    }

    const reactions: Record<string, string[]> =
      (post.reactions as Record<string, string[]> | null) || {}

    const list: string[] = Array.isArray(reactions[emoji]) ? reactions[emoji] : []
    const idx = list.indexOf(userId)
    const next = [...list]
    if (idx >= 0) next.splice(idx, 1)
    else next.push(userId)

    const updatedReactions: Record<string, string[]> = { ...reactions, [emoji]: next }
    if (next.length === 0) delete updatedReactions[emoji]

    const { data, error } = await supabase
      .from('community_group_posts')
      .update({ reactions: updatedReactions })
      .eq('id', postId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Reaksiyani yangilashda xatolik',
      },
      { status: 500 }
    )
  }
}
