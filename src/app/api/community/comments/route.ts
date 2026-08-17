import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserProfile, requireAdmin, requireUser } from '@/lib/community-server'

// Jamiyat izohlari. Author faqat session'dan — body.author ishonilmaydi.
// DELETE — faqat izoh muallifi yoki admin.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    if (!body.postId || !body.content) {
      return NextResponse.json(
        { success: false, error: 'postId and content are required' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Author — FAQAT session'dan
    const profile = await getUserProfile(supabase, auth.user.id)
    const author = {
      id: auth.user.id,
      name: profile?.full_name || profile?.email || 'Foydalanuvchi',
      avatar: profile?.avatar || 'user',
      role: profile?.role || 'Foydalanuvchi',
      verified: false,
      reputation: 0,
    }

    const newComment = {
      postId: body.postId,
      author,
      content: body.content,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      replies: [],
      parentId: body.parentId || null,
    }

    // 1) Izohni alohida jadvalga yozish
    const { error: cErr } = await supabase.from('community_comments').insert({
      post_id: newComment.postId,
      author: newComment.author,
      content: newComment.content,
      likes: 0,
      liked_by: [],
      replies: [],
      parent_id: newComment.parentId,
      created_at: newComment.createdAt,
    })
    if (cErr) throw cErr

    // 2) Postning comments JSONB massiviga qo'shish (barcha qurilmalarda ko'rinishi uchun)
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('comments')
        .eq('id', newComment.postId)
        .maybeSingle()

      if (post) {
        const existing = Array.isArray(post.comments) ? post.comments : []
        await supabase
          .from('community_posts')
          .update({
            comments: [...existing, newComment],
            updated_at: new Date().toISOString(),
          })
          .eq('id', newComment.postId)
      }
    } catch {}

    return NextResponse.json({ success: true, data: newComment, source: 'supabase' })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const postId = searchParams.get('postId')
    if (!id || !postId) {
      return NextResponse.json(
        { success: false, error: 'id and postId are required' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Ruxsat: izoh muallifi yoki admin
    const { data: comment, error: commentErr } = await supabase
      .from('community_comments')
      .select('author')
      .eq('id', id)
      .maybeSingle()
    if (commentErr) throw commentErr

    const isAuthor = !!comment && comment.author?.id === auth.user.id
    if (!isAuthor) {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    }

    const { error } = await supabase.from('community_comments').delete().eq('id', id)
    if (error) throw error

    // Post ichidan ham izohni olib tashlash
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('comments')
        .eq('id', postId)
        .maybeSingle()
      if (post) {
        interface CommentNode {
          id?: string
          replies?: CommentNode[]
        }
        const removeRecursive = (comments: CommentNode[]): CommentNode[] =>
          comments
            .filter(c => c.id !== id)
            .map(c => ({ ...c, replies: removeRecursive(c.replies || []) }))
        await supabase
          .from('community_posts')
          .update({
            comments: removeRecursive(Array.isArray(post.comments) ? post.comments : []),
            updated_at: new Date().toISOString(),
          })
          .eq('id', postId)
      }
    } catch {}

    return NextResponse.json({ success: true, source: 'supabase' })
  } catch {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
