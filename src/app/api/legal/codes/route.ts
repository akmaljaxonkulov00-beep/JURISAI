import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/legal/codes
 * 
 * Returns all legal codes with their articles from Supabase.
 * Uses service_role key to bypass RLS and ensure reliable access.
 * 
 * Query params:
 *   ?code_id=criminal_code  — filter by specific code
 *   ?search=o%27g%27irlik   — search within articles
 *   ?limit=10&offset=0       — pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('code_id') || '';
    const searchQuery = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 5000);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      const res = NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        codes: [],
        total_codes: 0,
        total_articles: 0,
      });
      res.headers.set('Cache-Control', 'no-store, max-age=0');
      return res;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Fetch categories ──
    let catQuery = supabase.from('categories').select('*');
    if (codeId) catQuery = catQuery.eq('code_id', codeId);
    catQuery = catQuery.order('code_id');

    const { data: categories, error: catError } = await catQuery;
    if (catError) throw catError;

    if (!categories || categories.length === 0) {
      const res = NextResponse.json({
        success: true,
        codes: [],
        total_codes: 0,
        total_articles: 0,
        message: 'categories table is empty. Please run the import script or SQL migration first.',
      });
      res.headers.set('Cache-Control', 'no-store, max-age=0');
      return res;
    }

    // ── 2. Fetch articles for requested categories ──
    let artQuery = supabase
      .from('articles')
      .select('*');

    if (codeId) {
      artQuery = artQuery.eq('code_id', codeId);
    } else {
      const codeIds = categories.map((c: any) => c.code_id);
      artQuery = artQuery.in('code_id', codeIds);
    }

    if (searchQuery) {
      const q = searchQuery.trim().replace(/[%_']/g, '');
      if (/^\d+$/.test(q)) {
        artQuery = artQuery.or(
          `article_number.ilike.%${q}%,title.ilike.%${q}%,content.ilike.%${q}%`
        );
      } else {
        artQuery = artQuery.or(
          `title.ilike.%${q}%,content.ilike.%${q}%`
        );
      }
    }

    const { data: articles, error: artError, count } = await artQuery
      .order('article_number', { ascending: true })
      .range(offset, offset + limit - 1);

    if (artError) throw artError;

    // ── 3. Map to response format ──
    const codes = categories.map((cat: any) => {
      const catArticles = (articles || [])
        .filter((a: any) => a.code_id === cat.code_id)
        .map((a: any) => ({
          number: a.article_number,
          title: a.title || '',
          content: a.content || '',
          category: a.chapter || 'Umumiy',
          penalties: a.penalties || undefined,
          references: Array.isArray(a.cross_references) && a.cross_references.length > 0
            ? a.cross_references
            : (Array.isArray(a.references) && a.references.length > 0 ? a.references : undefined),
        }));

      const codeName = cat.name || '';

      return {
        id: cat.code_id,
        name: codeName,
        shortName: codeName,
        description: cat.description || '',
        totalArticles: catArticles.length || cat.article_count || 0,
        effectiveDate: '01.01.2024',
        articles: catArticles,
      };
    });

    const totalArticles = codes.reduce((sum: number, c: any) => sum + c.articles.length, 0);

    const res = NextResponse.json({
      success: true,
      codes,
      total_codes: codes.length,
      total_articles: totalArticles,
      source: 'supabase',
      limit,
      offset,
      has_more: totalArticles >= limit,
    });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (error: any) {
    console.error('[Legal Codes API] Error:', error);
    const res = NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch legal codes',
      codes: [],
      total_codes: 0,
      total_articles: 0,
    });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }
}
