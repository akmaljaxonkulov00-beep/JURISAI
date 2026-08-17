import { NextRequest, NextResponse } from 'next/server'

interface PopularCategoryRow {
  code_id: string
  name: string
  description?: string | null
  article_count?: number | null
}

/**
 * GET /api/legal/database/popular
 *
 * Real ma'lumot: Supabase `categories` jadvalidagi barcha kodekslar,
 * har birining haqiqiy modda soni (article_count) bilan.
 * Mock "mashhur hujjatlar" yo'q.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        documents: [],
        total: 0,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let query = supabase.from('categories').select('*').order('code_id')
    if (category && category !== 'all') query = query.eq('code_id', category)

    const { data: categories, error } = await query
    if (error) throw error

    const documents = (categories || []).map((cat: PopularCategoryRow) => ({
      id: cat.code_id,
      title: cat.name,
      type: 'code',
      category: cat.code_id,
      popularity_score: 100,
      view_count: 0,
      download_count: 0,
      bookmark_count: 0,
      description: cat.description || '',
      article_count: cat.article_count || 0,
    }))

    return NextResponse.json({
      success: true,
      documents,
      total: documents.length,
      summary: {
        total_views: 0,
        total_downloads: 0,
        total_bookmarks: 0,
      },
      last_updated: new Date().toISOString(),
      source: 'supabase',
    })
  } catch (error) {
    console.error('Legal popular documents get error:', error)
    return NextResponse.json(
      { success: false, error: 'Mashhur hujjatlarni olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
