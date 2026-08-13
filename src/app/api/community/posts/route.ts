import { NextRequest, NextResponse } from 'next/server'

interface CommunityPost {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    role: string
    verified: boolean
    reputation: number
  }
  content: string
  category: string
  tags: string[]
  likes: number
  dislikes: number
  likedBy: string[]
  dislikedBy: string[]
  comments: any[]
  views: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

// ── Supabase snake_case <-> frontend camelCase mapping ──────────────
const toSnake = (p: CommunityPost) => ({
  id: p.id,
  author: p.author,
  content: p.content,
  category: p.category,
  tags: p.tags,
  likes: p.likes,
  dislikes: p.dislikes,
  liked_by: p.likedBy,
  disliked_by: p.dislikedBy,
  comments: p.comments,
  views: p.views,
  is_pinned: p.isPinned,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
})

const toCamel = (r: any): CommunityPost => ({
  id: r.id,
  author: r.author || {},
  content: r.content || '',
  category: r.category || 'discussion',
  tags: Array.isArray(r.tags) ? r.tags : [],
  likes: r.likes || 0,
  dislikes: r.dislikes || 0,
  likedBy: Array.isArray(r.liked_by) ? r.liked_by : [],
  dislikedBy: Array.isArray(r.disliked_by) ? r.disliked_by : [],
  comments: Array.isArray(r.comments) ? r.comments : [],
  views: r.views || 0,
  isPinned: !!r.is_pinned,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET() {
  try {
    const supabase = await getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error && data) {
        return NextResponse.json({
          success: true,
          data: data.map(toCamel),
          source: 'supabase',
        })
      }
    }
  } catch (e) {
    // Supabase not configured — return empty
  }

  return NextResponse.json({ success: true, data: [], source: 'empty' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate
    if (!body.content || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Content and category are required' },
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

    const newPost: CommunityPost = {
      id: body.id || 'post_' + Date.now(),
      author: user,
      content: body.content,
      category: body.category,
      tags: body.tags || [],
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      comments: [],
      views: 0,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Try Supabase first
    try {
      const supabase = await getSupabase()
      if (supabase) {
        const { error } = await supabase.from('community_posts').insert([toSnake(newPost)])
        if (!error) {
          return NextResponse.json({ success: true, data: newPost, source: 'supabase' })
        }
      }
    } catch {}

    return NextResponse.json({ success: true, data: newPost, source: 'api' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    try {
      const supabase = await getSupabase()
      if (supabase) {
        const { error } = await supabase
          .from('community_posts')
          .update({
            content: body.content,
            tags: body.tags,
            category: body.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.id)
        if (!error) {
          return NextResponse.json({ success: true, data: { id: body.id }, source: 'supabase' })
        }
      }
    } catch {}

    return NextResponse.json({ success: true, data: { id: body.id }, source: 'api' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    try {
      const supabase = await getSupabase()
      if (supabase) {
        const { error } = await supabase.from('community_posts').delete().eq('id', id)
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
