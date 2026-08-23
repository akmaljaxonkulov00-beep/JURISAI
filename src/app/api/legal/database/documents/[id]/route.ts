import { NextRequest, NextResponse } from 'next/server'

interface ArticleDetailRow {
  article_number: string
  title?: string | null
  content?: string | null
  chapter?: string | null
  section?: string | null
  penalties?: string | null
  cross_references?: string[] | null
  updated_at?: string | null
  categories?: { id: string; code_id: string; name: string } | null
}

/**
 * GET /api/legal/database/documents/:id
 *
 * Real ma'lumot: Supabase `articles` + `categories` jadvalidan moddani qaytaradi.
 * id formati: `{code_id}_{article_number}` (masalan criminal_code_169).
 * Topilmasa 404. Mock/hardcoded matn yo'q.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Document ID talab qilinadi' }, { status: 400 })
    }

    // id: {code_id}_{article_number}
    const underscore = id.lastIndexOf('_')
    if (underscore <= 0 || underscore === id.length - 1) {
      return NextResponse.json({ error: "Noto'g'ri document ID formati" }, { status: 400 })
    }
    const codeId = id.slice(0, underscore)
    const articleNumber = id.slice(underscore + 1)

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('articles')
      .select('*, categories!inner(id, code_id, name)')
      .eq('code_id', codeId)
      .eq('article_number', articleNumber)
      .maybeSingle()
    const article = data as ArticleDetailRow | null

    if (error) throw error
    if (!article) {
      return NextResponse.json(
        { error: `Modda topilmadi: ${codeId} ${articleNumber}-modda` },
        { status: 404 }
      )
    }

    const category = article.categories
    const references =
      Array.isArray(article.cross_references) && article.cross_references.length > 0
        ? article.cross_references
        : []

    return NextResponse.json({
      id,
      title: `${category?.name || ''} ${article.article_number}-modda: ${article.title || ''}`,
      type: 'code',
      category: category?.code_id || codeId,
      content: article.content || '',
      article_number: article.article_number,
      code_name: category?.name || "Noma'lum kodeks",
      chapter: article.chapter || '',
      section: article.section || '',
      penalties: article.penalties || '',
      references,
      status: 'active' as const,
      last_updated: article.updated_at || new Date().toISOString(),
      source: 'supabase',
    })
  } catch (error) {
    console.error('Legal document get error:', error)
    return NextResponse.json(
      { error: 'Qonun hujjatini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
