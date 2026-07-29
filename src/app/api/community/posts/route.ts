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

// Supabase-ready: swap localStorage calls with supabase queries when DB is ready
export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        return NextResponse.json({ success: true, data, source: 'supabase' })
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
      id: 'post_' + Date.now(),
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
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { error } = await supabase.from('community_posts').insert([newPost])
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
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
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
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
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
