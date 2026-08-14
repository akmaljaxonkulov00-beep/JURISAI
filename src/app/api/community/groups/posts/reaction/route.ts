import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// POST /api/community/groups/posts/reaction
// Body: { postId, userId, emoji }
// Reaksiyani yoqish/o'chirish (toggle). reactions = { "👍": ["user1", "user2"], ... }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId, emoji } = body

    if (!postId || !userId || !emoji) {
      return NextResponse.json(
        { success: false, error: 'postId, userId va emoji kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Reaksiyani yangilashda xatolik' },
      { status: 500 }
    )
  }
}
