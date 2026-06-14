import { NextRequest, NextResponse } from 'next/server';
import { ALL_LEGAL_CODES, searchLegalArticles, getLegalCodeById } from '@/data/legal-codes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category = 'all', type = 'all', limit = 20 } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Qidiruv so\'rovi kamida 2 belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Search in all legal codes
    let results = searchLegalArticles(query.trim());

    // Filter by category if specified
    if (category !== 'all') {
      const code = getLegalCodeById(category);
      if (code) {
        results = results.filter(article => {
          // Check if article belongs to this code
          return code.articles.some(a => a.number === article.number && a.title === article.title);
        });
      }
    }

    // Format results as documents
    const documents = results.slice(0, limit).map((article, index) => {
      // Find which code this article belongs to
      let codeInfo = ALL_LEGAL_CODES.find(code => 
        code.articles.some(a => a.number === article.number && a.title === article.title)
      );

      return {
        id: `${codeInfo?.id || 'unknown'}_${article.number}`,
        title: `${codeInfo?.shortName || ''} ${article.number}-modda: ${article.title}`,
        type: 'code',
        category: codeInfo?.id || 'unknown',
        description: article.content.substring(0, 200) + '...',
        content: article.content,
        article_number: article.number,
        code_name: codeInfo?.name || 'Noma\'lum kodeks',
        code_short: codeInfo?.shortName || '',
        penalties: article.penalties || '',
        references: article.references || [],
        publication_date: codeInfo?.effectiveDate || '',
        effective_date: codeInfo?.effectiveDate || '',
        status: 'active' as const,
        keywords: [article.category || '', article.title, ...(article.references || [])],
        related_documents: article.references || [],
        citations: 0,
        last_updated: new Date().toISOString()
      };
    });

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      documents,
      total_count: results.length,
      search_time: searchTime,
      query: query.trim(),
      success: true
    });

  } catch (error: any) {
    console.error('Legal Search API Error:', error);
    return NextResponse.json(
      { 
        error: 'Qidirishda xatolik yuz berdi',
        message: error.message || 'Noma\'lum xatolik',
        success: false
      },
      { status: 500 }
    );
  }
}
