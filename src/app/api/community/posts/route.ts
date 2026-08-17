import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserProfile, requireAdmin, requireUser } from '@/lib/community-server'

// Jamiyat lentasi (feed). GET — hamma ko'radi; POST — session user;
// PUT — kontent faqat muallif, pin faqat admin; DELETE — muallif yoki admin.
interface FeedRow {
  id?: string
  author?: {
    id?: string
    name?: string
    avatar?: string
    role?: string
    verified?: boolean
    reputation?: number
  }
  content?: string
  category?: string
  tags?: string[]
  likes?: number
  dislikes?: number
  liked_by?: string[]
  disliked_by?: string[]
  comments?: unknown[]
  views?: number
  is_pinned?: boolean
  created_at?: string
  updated_at?: string
}

const toCamel = (r: FeedRow) => ({
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

export async function GET() {
  try {
    const supabase = await getServiceClient()
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
  } catch {
    // Supabase not configured — return empty
  }

  return NextResponse.json({ success: true, data: [], source: 'empty' })
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()

    // Validate
    if (!body.content || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Content and category are required' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Author — FAQAT session'dan (body.author ishonilmaydi — impersonatsiya bloklanadi)
    const profile = await getUserProfile(supabase, auth.user.id)
    const author = {
      id: auth.user.id,
      name: profile?.full_name || profile?.email || 'Foydalanuvchi',
      avatar: profile?.avatar || 'user',
      role: profile?.role || 'Foydalanuvchi',
      verified: false,
      reputation: 0,
    }

    const newPost = {
      author,
      content: body.content,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      likes: 0,
      dislikes: 0,
      liked_by: [],
      disliked_by: [],
      comments: [],
      views: 0,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert([newPost])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: toCamel(data), source: 'supabase' })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Joriy postni o'qib, ruxsatni aniqlaymiz
    const { data: existing, error: existingErr } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', body.id)
      .maybeSingle()
    if (existingErr) throw existingErr

    // Kontent tahrirlash — faqat muallif
    const isAuthor = !!existing && existing.author?.id === auth.user.id
    if (
      (typeof body.content === 'string' ||
        Array.isArray(body.tags) ||
        typeof body.category === 'string') &&
      !isAuthor
    ) {
      return NextResponse.json(
        { success: false, error: 'Faqat post muallifi kontentni tahrirlay oladi' },
        { status: 403 }
      )
    }

    // Pin — faqat admin
    if (typeof body.isPinned === 'boolean') {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (typeof body.content === 'string') updatePayload.content = body.content
    if (Array.isArray(body.tags)) updatePayload.tags = body.tags
    if (typeof body.category === 'string') updatePayload.category = body.category
    if (typeof body.likes === 'number') updatePayload.likes = body.likes
    if (typeof body.dislikes === 'number') updatePayload.dislikes = body.dislikes
    if (Array.isArray(body.likedBy)) updatePayload.liked_by = body.likedBy
    if (Array.isArray(body.dislikedBy)) updatePayload.disliked_by = body.dislikedBy
    if (Array.isArray(body.comments)) updatePayload.comments = body.comments
    if (typeof body.views === 'number') updatePayload.views = body.views
    if (typeof body.isPinned === 'boolean') updatePayload.is_pinned = body.isPinned

    const { error } = await supabase.from('community_posts').update(updatePayload).eq('id', body.id)
    if (error) throw error

    return NextResponse.json({ success: true, data: { id: body.id }, source: 'supabase' })
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
    if (!id) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Ruxsat: muallif yoki admin
    const { data: existing, error: existingErr } = await supabase
      .from('community_posts')
      .select('author')
      .eq('id', id)
      .maybeSingle()
    if (existingErr) throw existingErr

    const isAuthor = !!existing && existing.author?.id === auth.user.id
    if (!isAuthor) {
      const adm = await requireAdmin(request)
      if (!adm.ok) return adm.response
    }

    const { error } = await supabase.from('community_posts').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true, source: 'supabase' })
  } catch {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
