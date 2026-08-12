import { NextRequest, NextResponse } from 'next/server'
import { ALL_LEGAL_CODES, getLegalCodeById, CODE_DISPLAY_NAMES } from '@/data/legal-codes'
import type { LegalCode } from '@/data/legal-codes'

/**
 * GET /api/legal/codes
 *
 * Returns all legal codes with their articles.
 * PRIORITY 1: Supabase (production database with full imported data)
 * PRIORITY 2: Hardcoded data from src/data/legal-codes.ts (always available)
 *
 * Query params:
 *   ?code_id=criminal_code  — filter by specific code
 *   ?search=o%27g%27irlik   — search within articles
 *   ?limit=10&offset=0       — pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codeId = searchParams.get('code_id') || ''
    const searchQuery = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 5000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // ── Try Supabase first (production data) ──
    let fromSupabase = false
    let codes: any[] = []

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('your-supabase-url')) {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        // ── Fetch categories ──
        let catQuery = supabase.from('categories').select('*')
        if (codeId) catQuery = catQuery.eq('code_id', codeId)
        catQuery = catQuery.order('code_id')

        const { data: categories, error: catError } = await catQuery
        if (!catError && categories && categories.length > 0) {
          // ── Fetch articles — paginated per code (REST caps at 1000 rows/request) ──
          const codeIds = (categories as any[]).map((c: any) => c.code_id)
          const PAGE = 1000

          const fetchAll = async (orderColumn: 'article_number_int' | 'article_number') => {
            const all: any[] = []
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

          let articles: any[]
          try {
            articles = await fetchAll('article_number_int')
          } catch {
            articles = await fetchAll('article_number')
          }

          // Map to response format
          const mappedCodes = categories.map((cat: any) => {
            const catArticles = (articles || [])
              .filter((a: any) => a.code_id === cat.code_id)
              // Numeric safety sort (article_number_int may be null in legacy rows)
              .sort((a: any, b: any) => {
                const na = parseInt(a.article_number, 10) || 0
                const nb = parseInt(b.article_number, 10) || 0
                return na - nb
              })
              .map((a: any) => ({
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

          if (mappedCodes.length > 0 && mappedCodes.some((c: any) => c.articles.length > 0)) {
            codes = mappedCodes
            fromSupabase = true
          }
        }
      }
    } catch {
      // Supabase failed — will use fallback below
    }

    // ── Fallback to hardcoded data from legal-codes.ts ──
    if (!fromSupabase || codes.length === 0) {
      let fallbackCodes = ALL_LEGAL_CODES

      if (codeId) {
        const code = getLegalCodeById(codeId)
        fallbackCodes = code ? [code] : []
      }

      codes = fallbackCodes.map((c: LegalCode) => {
        let articles = c.articles

        // Apply search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          articles = articles.filter(
            a =>
              a.number.toLowerCase().includes(q) ||
              a.title.toLowerCase().includes(q) ||
              a.content.toLowerCase().includes(q)
          )
        }

        return {
          id: c.id,
          name: CODE_DISPLAY_NAMES[c.id] || c.name,
          shortName: CODE_DISPLAY_NAMES[c.id] || c.name,
          description: c.description,
          totalArticles: articles.length,
          effectiveDate: c.effectiveDate,
          articles: articles.map(a => ({
            number: a.number,
            title: a.title,
            content: a.content,
            category: a.category || 'Umumiy',
            penalties: a.penalties || undefined,
            references: a.references || undefined,
          })),
        }
      })

      // Apply code_id filter for fallback (already done above, but cover all cases)
      if (codeId) {
        codes = codes.filter(c => c.id === codeId)
      }
    }

    const totalArticles = codes.reduce((sum: number, c: any) => sum + c.articles.length, 0)

    const res = NextResponse.json({
      success: true,
      codes,
      total_codes: codes.length,
      total_articles: totalArticles,
      source: fromSupabase ? 'supabase' : 'fallback',
      limit,
      offset,
      has_more: totalArticles >= limit,
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch (error: any) {
    console.error('[Legal Codes API] Error:', error)
    const res = NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch legal codes',
      codes: [],
      total_codes: 0,
      total_articles: 0,
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  }
}
