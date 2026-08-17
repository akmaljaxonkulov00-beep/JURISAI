import { NextRequest, NextResponse } from 'next/server'

interface CategoryRow {
  code_id: string
  name: string
  description?: string | null
}

interface ArticleRow {
  code_id: string
  article_number: string
  title?: string | null
  content?: string | null
  chapter?: string | null
  penalties?: string | null
  cross_references?: string[] | null
  references?: string[] | null
}

/**
 * GET /api/legal/codes
 *
 * YAGONA MANBA: Supabase (`categories` + `articles` jadvallari).
 * Hardcoded/fallback ma'lumot YO'Q — baza mavjud bo'lmasa bo'sh natija qaytadi.
 *
 * Query params:
 *   ?code_id=criminal_code  — filter by specific code
 *   ?search=...             — search within articles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codeId = searchParams.get('code_id') || ''
    const searchQuery = searchParams.get('search') || ''

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-supabase-url')) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        codes: [],
        total_codes: 0,
        total_articles: 0,
        source: 'none',
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ── Categories ──
    let catQuery = supabase.from('categories').select('*')
    if (codeId) catQuery = catQuery.eq('code_id', codeId)
    catQuery = catQuery.order('code_id')

    const { data: categories, error: catError } = await catQuery
    if (catError) throw catError
    if (!categories || categories.length === 0) {
      return NextResponse.json({
        success: true,
        codes: [],
        total_codes: 0,
        total_articles: 0,
        source: 'supabase',
        message: 'Kategoriyalar mavjud emas',
      })
    }

    // ── Articles — har bir kodeks uchun paginated (REST 1000 satr/so'rov limiti) ──
    const codeIds = (categories as Array<{ code_id: string }>).map(c => c.code_id)
    const PAGE = 1000

    const fetchAll = async (orderColumn: 'article_number_int' | 'article_number') => {
      const all: Array<Record<string, unknown>> = []
      for (const cid of codeIds) {
        let artQuery = supabase.from('articles').select('*').eq('code_id', cid)

        if (searchQuery) {
          const q = searchQuery.trim()
          if (/^\d+$/.test(q)) {
            artQuery = artQuery.or(
              `article_number.ilike.%${q}%,title.ilike.%${q}%,content.ilike.%${q}%`
            )
          } else {
            artQuery = artQuery.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          }
        }

        let from = 0
        for (;;) {
          const { data, error } = await artQuery
            .order(orderColumn, { ascending: true, nullsFirst: false })
            .range(from, from + PAGE - 1)
          if (error) throw error
          all.push(...(data || []))
          if (!data || data.length < PAGE) break
          from += PAGE
        }
      }
      return all
    }

    let articles: Array<Record<string, unknown>>
    try {
      articles = await fetchAll('article_number_int')
    } catch {
      articles = await fetchAll('article_number')
    }

    // ── Response format ──
    const mappedCodes = (categories as CategoryRow[]).map(cat => {
      const catArticles = (articles as unknown as ArticleRow[])
        .filter(a => a.code_id === cat.code_id)
        .sort((a, b) => {
          const na = parseInt(a.article_number, 10) || 0
          const nb = parseInt(b.article_number, 10) || 0
          return na - nb
        })
        .map((a: ArticleRow) => ({
          number: a.article_number,
          title: a.title || '',
          content: a.content || '',
          category: a.chapter || 'Umumiy',
          penalties: a.penalties || undefined,
          references:
            Array.isArray(a.cross_references) && a.cross_references.length > 0
              ? a.cross_references
              : Array.isArray(a.references) && a.references.length > 0
                ? a.references
                : undefined,
        }))

      return {
        id: cat.code_id,
        name: cat.name,
        shortName: cat.name,
        description: cat.description || '',
        totalArticles: catArticles.length,
        effectiveDate: '01.01.2024',
        articles: catArticles,
      }
    })

    const totalArticles = mappedCodes.reduce(
      (sum: number, c: { articles: unknown[] }) => sum + c.articles.length,
      0
    )

    const res = NextResponse.json({
      success: true,
      codes: mappedCodes,
      total_codes: mappedCodes.length,
      total_articles: totalArticles,
      source: 'supabase',
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch (error) {
    console.error('[Legal Codes API] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch legal codes'
    const res = NextResponse.json({
      success: false,
      error: message,
      codes: [],
      total_codes: 0,
      total_articles: 0,
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  }
}
