import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage } from '@/lib/errors'

/**
 * Full-text search API for legal articles.
 * Queries Supabase `articles` table with ILIKE for flexible searching.
 * Supports filtering by code_id, article number, and keyword search in content.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const codeId = searchParams.get('code_id') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query.trim() && !codeId) {
      return NextResponse.json({
        success: false,
        error: "Qidiruv so'zi (q) yoki kodeks (code_id) ko'rsatilishi kerak",
        articles: [],
        total: 0,
      })
    }

    // Dynamic import to avoid server-side bundling issues
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        articles: [],
        total: 0,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const startTime = Date.now()

    // Build query dynamically
    let dbQuery = supabase
      .from('articles')
      .select('*, categories!inner(name, code_id)', { count: 'exact' })

    // Filter by code_id
    if (codeId) {
      dbQuery = dbQuery.eq('categories.code_id', codeId)
    }

    // Full-text search on content, title, and article_number
    if (query.trim()) {
      const sanitized = query.trim().replace(/[%_']/g, '') // Remove SQL special chars
      // Try article_number match first (exact match on article number)
      if (/^\d+$/.test(sanitized)) {
        // Exact article number match
        dbQuery = dbQuery.or(
          `article_number.ilike.%${sanitized}%,title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`
        )
      } else {
        // Split into words for multi-word search
        const words = sanitized.split(/\s+/).filter(Boolean)
        if (words.length === 1) {
          dbQuery = dbQuery.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
        } else {
          // Multi-word: all words must match in content
          const conditions = words.map(w => `content.ilike.%${w}%`).join(',')
          dbQuery = dbQuery.or(conditions)
        }
      }
    }

    // Numeric sort: article_number_int first, fallback to article_number (text)
    let result = await dbQuery
      .order('article_number_int', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (
      result.error &&
      result.error.message &&
      result.error.message.includes('article_number_int')
    ) {
      result = await dbQuery
        .order('article_number', { ascending: true })
        .range(offset, offset + limit - 1)
    }

    const { data: articles, count, error } = result

    if (error) throw error

    const searchTime = Date.now() - startTime

    // Map to clean response format
    const mapped = (articles || []).map(
      (a: {
        id?: string
        code_id?: string
        article_number?: string
        title?: string
        content?: string
        chapter?: string
        section?: string
        penalties?: string
        cross_references?: string[]
        categories?: { name?: string }
      }) => ({
        id: a.id,
        code_id: a.code_id,
        code_name: a.categories?.name || '',
        article_number: a.article_number,
        title: a.title,
        content: query.trim()
          ? highlightText(a.content || '', query.trim())
          : (a.content || '').substring(0, 500),
        chapter: a.chapter,
        section: a.section,
        penalties: a.penalties,
        cross_references: a.cross_references || [],
      })
    )

    return NextResponse.json({
      success: true,
      articles: mapped,
      total: count || 0,
      query: query.trim(),
      code_id: codeId,
      search_time_ms: searchTime,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Legal articles search API error:', error)
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error) || 'Qidirishda xatolik yuz berdi',
      articles: [],
      total: 0,
    })
  }
}

/**
 * Simple text highlighting — wraps matched terms in mark tags.
 */
function highlightText(text: string, query: string): string {
  if (!text || !query) return (text || '').substring(0, 500)
  const words = query.trim().split(/\s+/).filter(Boolean)
  let result = text
  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }
  // Return first 800 chars with context around first match
  const matchIndex = result.search(/<mark>/i)
  if (matchIndex > 200) {
    const start = Math.max(0, matchIndex - 150)
    result = '...' + result.substring(start, start + 800)
  } else {
    result = result.substring(0, 800)
  }
  return result
}
