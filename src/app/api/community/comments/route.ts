import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.postId || !body.content) {
      return NextResponse.json(
        { success: false, error: 'postId and content are required' },
        { status: 400 }
      )
    }

    const user = body.author || {
      id: 'anonymous',
      name: 'Mehmon',
      avatar: 'user',
      role: 'Foydalanuvchi',
      verified: false,
      reputation: 0,
    }

    const newComment = {
      id: body.id || 'cmt_' + Date.now(),
      postId: body.postId,
      author: user,
      content: body.content,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      replies: [],
      parentId: body.parentId || null,
    }

    try {
      const supabase = await getSupabase()
      if (supabase) {
        // 1) Izohni alohida jadvalga yozish
        const { error: cErr } = await supabase.from('community_comments').insert({
          id: newComment.id,
          post_id: newComment.postId,
          author: newComment.author,
          content: newComment.content,
          likes: 0,
          liked_by: [],
          replies: [],
          parent_id: newComment.parentId,
          created_at: newComment.createdAt,
        })

        // 2) Postning comments JSONB massiviga qo'shish (barcha qurilmalarda ko'rinishi uchun)
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

        if (!cErr) {
          return NextResponse.json({ success: true, data: newComment, source: 'supabase' })
        }
      }
    } catch {}

    return NextResponse.json({ success: true, data: newComment, source: 'api' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const postId = searchParams.get('postId')
    if (!id || !postId) {
      return NextResponse.json(
        { success: false, error: 'id and postId are required' },
        { status: 400 }
      )
    }

    try {
      const supabase = await getSupabase()
      if (supabase) {
        const { error } = await supabase.from('community_comments').delete().eq('id', id)

        // Post ichidan ham izohni olib tashlash
        const { data: post } = await supabase
          .from('community_posts')
          .select('comments')
          .eq('id', postId)
          .maybeSingle()
        if (post) {
          const removeRecursive = (comments: any[]): any[] =>
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

        if (!error) {
          return NextResponse.json({ success: true, source: 'supabase' })
        }
      }
    } catch {}

    return NextResponse.json({ success: true, source: 'api' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
