import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/legal/search
 *
 * Qidiruv Supabase `articles` jadvalidan real ma'lumot bilan bajariladi
 * (statik legal-codes.ts ma'lumoti ishlatilmaydi).
 * Modda raqami, nomi va matni bo'yicha qidiradi, kodeks bo'yicha filtrlaydi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, category = 'all', type = 'all', limit = 20 } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Qidiruv so'rovi kamida 2 belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }

    const startTime = Date.now()

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
    const sanitized = q.replace(/[%_']/g, '') // SQL special chars ni tozalash
    // Apostrof variantlarini olib tashlash — tsvector ustuni ham xuddi shunday
    // yaratilgan (O'g'irlik ~ Ogirlik bitta token bo'lib qoladi)
    const strippedQ = sanitized.replace(/['‘’ʻ`]/g, '')

    let articles: any[] | null = null
    let count: number | null = null

    // ── 1) Tezkor indekslangan to'liq matn qidiruvi (search_vector + GIN) ──
    //    Ustun/indeks hali yaratilmagan bo'lsa xato qaytadi → ILIKE ga tushamiz.
    try {
      let tsQuery = supabase
        .from('articles')
        .select('*, categories!inner(id, code_id, name)', { count: 'exact' })
        .textSearch('search_vector', strippedQ || q, { config: 'simple', type: 'plain' })

      if (category !== 'all') {
        tsQuery = tsQuery.eq('categories.code_id', category)
      }

      const res = await tsQuery
        .order('article_number_int', { ascending: true, nullsFirst: false })
        .limit(Math.min(limit, 100))

      if (res.error) throw res.error
      articles = res.data
      count = res.count
    } catch {
      // search_vector ustuni mavjud emas yoki boshqa xato — ILIKE fallback
      articles = null
      count = null
    }

    // ── 2) ILIKE fallback (ustun/indeks yo'q bo'lsa yoki tsvector natija bermasa) ──
    if (!articles || articles.length === 0) {
      let dbQuery = supabase
        .from('articles')
        .select('*, categories!inner(id, code_id, name)', { count: 'exact' })

      if (category !== 'all') {
        dbQuery = dbQuery.eq('categories.code_id', category)
      }

      // Modda raqami / nomi / matni bo'yicha qidiruv
      if (/^\d+$/.test(sanitized)) {
        dbQuery = dbQuery.or(
          `article_number.ilike.%${sanitized}%,title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`
        )
      } else {
        const words = sanitized.split(/\s+/).filter(Boolean)
        if (words.length === 1) {
          dbQuery = dbQuery.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
        } else {
          const conditions = words.map(w => `content.ilike.%${w}%`).join(',')
          dbQuery = dbQuery.or(conditions)
        }
      }

      const res = await dbQuery
        .order('article_number_int', { ascending: true, nullsFirst: false })
        .limit(Math.min(limit, 100))
      if (res.error) throw res.error
      articles = res.data
      count = res.count
    }

    const documents = (articles || []).map((a: any) => ({
      id: `${a.categories?.code_id || a.code_id || 'unknown'}_${a.article_number}`,
      title: `${a.categories?.name || ''} ${a.article_number}-modda: ${a.title || ''}`,
      type: 'code',
      category: a.categories?.code_id || a.code_id || 'unknown',
      description:
        (a.content || '').substring(0, 200) + (a.content && a.content.length > 200 ? '...' : ''),
      content: a.content || '',
      article_number: a.article_number,
      code_name: a.categories?.name || "Noma'lum kodeks",
      code_short: a.categories?.name || '',
      penalties: a.penalties || '',
      references:
        Array.isArray(a.cross_references) && a.cross_references.length > 0
          ? a.cross_references
          : Array.isArray(a.references) && a.references.length > 0
            ? a.references
            : [],
      publication_date: '',
      effective_date: '',
      status: 'active' as const,
      keywords: [a.chapter || '', a.title || '', ...(a.cross_references || [])],
      related_documents:
        Array.isArray(a.cross_references) && a.cross_references.length > 0
          ? a.cross_references
          : [],
      citations: 0,
      last_updated: new Date().toISOString(),
    }))

    const searchTime = Date.now() - startTime

    return NextResponse.json({
      documents,
      total_count: count || 0,
      search_time: searchTime,
      query: q,
      success: true,
      source: 'supabase',
    })
  } catch (error: any) {
    console.error('Legal Search API Error:', error)
    return NextResponse.json(
      {
        error: 'Qidirishda xatolik yuz berdi',
        message: error.message || "Noma'lum xatolik",
        success: false,
      },
      { status: 500 }
    )
  }
}
