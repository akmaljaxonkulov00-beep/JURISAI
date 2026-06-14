import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import legalData from '@/data/legal-database.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const query = searchParams.get('query');

    switch (action) {
      case 'categories':
        return NextResponse.json({ categories: legalData.categories });
      
      case 'popular':
        return NextResponse.json({ documents: legalData.popularDocuments });
      
      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query required' }, { status: 400 });
        }
        return await searchLegalDatabase(query);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Legal database API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function searchLegalDatabase(query: string) {
  try {
    // First, search in existing data
    const existingResults = legalData.popularDocuments.filter(doc =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase()) ||
      doc.category.toLowerCase().includes(query.toLowerCase())
    );

    // If we have results, return them
    if (existingResults.length > 0) {
      return NextResponse.json({
        articles: existingResults,
        total: existingResults.length,
        query,
        search_time: 0.05,
        suggestions: ['Fuqarolik kodeksi', 'Mehnat kodeksi', 'Oila kodeksi']
      });
    }

    // If no results, use AI to generate relevant legal information
    const aiResponse = await aiClient.chatMessage(
      `O'zbekiston qonunchiligida "${query}" mavzusi bo'yicha qisqacha ma'lumot bering. Qaysi kodeks va moddalar tegishli?`,
      'Huquqiy ma\'lumot bazasi'
    );

    const aiArticle = {
      id: 'ai_' + Date.now(),
      title: `${query} - AI natija`,
      category: 'Umumiy',
      description: aiResponse.text.substring(0, 200),
      content: aiResponse.text,
      article_number: 'AI',
      last_updated: new Date().toISOString(),
      relevance_score: 90,
      view_count: 1
    };

    return NextResponse.json({
      articles: [aiArticle],
      total: 1,
      query,
      search_time: 0.8,
      suggestions: ['Qonun kodekslari', 'Moddalar', 'Huquqiy ma\'lumotlar'],
      ai_generated: true
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Qidiruv xatosi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, articleId } = await request.json();

    if (action === 'bookmark') {
      // Save to localStorage on client side
      return NextResponse.json({
        success: true,
        message: 'Xatcho\'pga qo\'shildi'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
