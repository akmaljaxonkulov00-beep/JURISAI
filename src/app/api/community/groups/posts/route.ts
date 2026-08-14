import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/community/groups/posts?groupId=...
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

    const { data, error } = await supabase
      .from('community_group_posts')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Postlarni yuklashda xatolik' },
      { status: 500 }
    )
  }
}

// POST /api/community/groups/posts  { groupId, userId, userName, content, parentId? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, userId, userName, content, parentId } = body

    if (!groupId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'groupId va content kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('community_group_posts')
      .insert({
        group_id: groupId,
        user_id: userId || '',
        user_name: userName || 'Foydalanuvchi',
        content: content.slice(0, 2000),
        parent_id: parentId || null,
        reactions: {},
      })
      .select()
      .single()

    if (error) throw error

    // Faqat asosiy (javob bo'lmagan) xabarlar post_count ga hisoblanadi
    if (!parentId) {
      try {
        const { data: grp } = await supabase
          .from('community_groups')
          .select('post_count')
          .eq('id', groupId)
          .single()
        await supabase
          .from('community_groups')
          .update({ post_count: (grp?.post_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', groupId)
      } catch {}
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Post yozishda xatolik' },
      { status: 500 }
    )
  }
}

// DELETE /api/community/groups/posts?postId=...&actorId=...
// Post muallifi, guruh yaratuvchisi yoki moderator o'chira oladi.
// Javoblar (parent_id) CASCADE bo'yicha birga o'chadi.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const actorId = searchParams.get('actorId') || ''

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { data: post, error: postErr } = await supabase
      .from('community_group_posts')
      .select('*')
      .eq('id', postId)
      .single()
    if (postErr || !post) throw postErr || new Error('Post topilmadi')

    // Ruxsat: muallif | guruh yaratuvchisi | moderator
    const isAuthor = actorId && post.user_id === actorId
    if (!isAuthor) {
      const { data: group } = await supabase
        .from('community_groups')
        .select('created_by')
        .eq('id', post.group_id)
        .single()
      const isCreator = actorId && group?.created_by?.toString() === actorId

      let isModerator = false
      if (actorId) {
        const { data: member } = await supabase
          .from('community_group_members')
          .select('role')
          .eq('group_id', post.group_id)
          .eq('user_id', actorId)
          .maybeSingle()
        isModerator = !!member && ['moderator', 'admin'].includes(member.role)
      }

      if (!isCreator && !isModerator) {
        return NextResponse.json(
          { success: false, error: "Xabarni o'chirish uchun ruxsat yo'q" },
          { status: 403 }
        )
      }
    }

    const { error: delErr } = await supabase
      .from('community_group_posts')
      .delete()
      .eq('id', postId)
    if (delErr) throw delErr

    // Asosiy xabar o'chirilsa post_count ni kamaytiramiz
    if (!post.parent_id) {
      try {
        const { data: grp } = await supabase
          .from('community_groups')
          .select('post_count')
          .eq('id', post.group_id)
          .single()
        await supabase
          .from('community_groups')
          .update({
            post_count: Math.max(0, (grp?.post_count || 0) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.group_id)
      } catch {}
    }

    return NextResponse.json({ success: true, deleted: postId })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Xabarni o'chirishda xatolik" },
      { status: 500 }
    )
  }
}
