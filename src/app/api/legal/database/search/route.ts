import { NextRequest, NextResponse } from 'next/server'

interface ArticleSearchRow {
  code_id: string
  article_number: string
  title?: string | null
  content?: string | null
  penalties?: string | null
  cross_references?: string[] | null
  categories?: { id: string; code_id: string; name: string } | null
}

/**
 * POST /api/legal/database/search
 *
 * Qidiruv Supabase `articles` jadvalidan real ma'lumot bilan bajariladi.
 * 1) search_vector (tsvector + GIN) — apostrofni indeksda olib tashlagan
 * 2) ILIKE fallback — ustun/indeks bo'lmasa
 * Mock/hardcoded ma'lumot yo'q.
 */
export async function POST(request: NextRequest) {
  try {
    const { query, category, limit = 20, offset = 0 } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Qidiruv so'rovi kamida 2 belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        documents: [],
        total_count: 0,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const q = query.trim()
    const sanitized = q.replace(/[%_']/g, '')
    // Apostrof variantlari olib tashlanadi — tsvector ustuni ham shunday yaratilgan
    const strippedQ = sanitized.replace(/['‘’ʻ`]/g, '')
    const limitNum = Math.min(Number(limit) || 20, 100)
    const offsetNum = Number(offset) || 0

    let articles: ArticleSearchRow[] | null = null
    let count: number | null = null

    // ── 1) Tezkor indekslangan to'liq matn qidiruvi (search_vector + GIN) ──
    try {
      let tsQuery = supabase
        .from('articles')
        .select('*, categories!inner(id, code_id, name)', { count: 'exact' })
        .textSearch('search_vector', strippedQ || q, { config: 'simple', type: 'plain' })
      if (category && category !== 'all') tsQuery = tsQuery.eq('categories.code_id', category)

      const res = await tsQuery
        .order('article_number_int', { ascending: true, nullsFirst: false })
        .range(offsetNum, offsetNum + limitNum - 1)
      if (res.error) throw res.error
      articles = res.data
      count = res.count
    } catch {
      articles = null
      count = null
    }

    // ── 2) ILIKE fallback ──
    if (!articles || articles.length === 0) {
      let dbQuery = supabase
        .from('articles')
        .select('*, categories!inner(id, code_id, name)', { count: 'exact' })
      if (category && category !== 'all') dbQuery = dbQuery.eq('categories.code_id', category)

      if (/^\d+$/.test(sanitized)) {
        dbQuery = dbQuery.or(
          `article_number.ilike.%${sanitized}%,title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`
        )
      } else {
        const words = strippedQ.split(/\s+/).filter(Boolean)
        if (words.length <= 1) {
          // Apostrofsiz ham, apostrofli ham urinib ko'riladi
          const variants = [strippedQ, sanitized].filter(Boolean)
          dbQuery = dbQuery.or(
            variants.map(v => `title.ilike.%${v}%`).join(',') +
              ',' +
              variants.map(v => `content.ilike.%${v}%`).join(',')
          )
        } else {
          const conditions = words.map(w => `content.ilike.%${w}%`).join(',')
          dbQuery = dbQuery.or(conditions)
        }
      }

      const res = await dbQuery
        .order('article_number_int', { ascending: true, nullsFirst: false })
        .range(offsetNum, offsetNum + limitNum - 1)
      if (res.error) throw res.error
      articles = res.data
      count = res.count
    }

    const documents = (articles || []).map((a: ArticleSearchRow) => ({
      id: `${a.categories?.code_id || a.code_id || 'unknown'}_${a.article_number}`,
      title: `${a.categories?.name || ''} ${a.article_number}-modda: ${a.title || ''}`,
      type: 'code',
      category: a.categories?.code_id || a.code_id || 'unknown',
      description:
        (a.content || '').substring(0, 200) + (a.content && a.content.length > 200 ? '...' : ''),
      content: a.content || '',
      article_number: a.article_number,
      code_name: a.categories?.name || "Noma'lum kodeks",
      penalties: a.penalties || '',
      references:
        Array.isArray(a.cross_references) && a.cross_references.length > 0
          ? a.cross_references
          : [],
      status: 'active' as const,
    }))

    return NextResponse.json({
      success: true,
      documents,
      total_count: count || documents.length,
      pagination: {
        total: count || documents.length,
        limit: limitNum,
        offset: offsetNum,
        has_more: (count || 0) > offsetNum + documents.length,
      },
      query: q,
      source: 'supabase',
    })
  } catch (error) {
    console.error('Legal database search error:', error)
    return NextResponse.json(
      { success: false, error: 'Qonun hujjatlarini qidirishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
