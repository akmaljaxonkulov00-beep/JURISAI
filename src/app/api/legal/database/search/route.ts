import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { query, category, document_type, limit, offset, filters } = await request.json();

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Sorov kamida 3 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Mock legal documents database
    const mockLegalDocuments = [
      {
        id: 'doc_1',
        title: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
        type: 'code',
        category: 'civil',
        content: 'Fuqarolik kodeksi - fuqarolik-huquqiy munosabatlarni tartibga soluvchi asosiy qonun hujjati...',
        url: 'https://lex.uz/acts/-/text/1492387',
        relevance_score: 95,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'doc_2',
        title: 'O\'zbekiston Respublikasi Mehnat kodeksi',
        type: 'code',
        category: 'labor',
        content: 'Mehnat kodeksi - mehnat munosabatlarini tartibga soluvchi qonun hujjati...',
        url: 'https://lex.uz/acts/-/text/1493359',
        relevance_score: 92,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'doc_3',
        title: 'O\'zbekiston Respublikasi Oilaviy kodeksi',
        type: 'code',
        category: 'family',
        content: 'Oilaviy kodeksi - oilaviy munosabatlarni tartibga soluvchi qonun hujjati...',
        url: 'https://lex.uz/acts/-/text/1492386',
        relevance_score: 88,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'doc_4',
        title: 'O\'zbekiston Respublikasi Konstitutsiyasi',
        type: 'constitution',
        category: 'constitutional',
        content: 'Konstitutsiya - O\'zbekiston Respublikasining asosiy qonuni...',
        url: 'https://lex.uz/acts/-/text/1473577',
        relevance_score: 98,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'doc_5',
        title: 'O\'zbekiston Respublikasi Jinoyat kodeksi',
        type: 'code',
        category: 'criminal',
        content: 'Jinoyat kodeksi - jinoyatlar va jazo choralari to\'g\'risidagi qonun...',
        url: 'https://lex.uz/acts/-/text/1492390',
        relevance_score: 85,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Filter documents based on search criteria
    let filteredDocuments = mockLegalDocuments.filter(doc => {
      const matchesQuery = doc.title.toLowerCase().includes(query.toLowerCase()) ||
                          doc.content.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || doc.category === category;
      const matchesType = !document_type || doc.type === document_type;
      
      return matchesQuery && matchesCategory && matchesType;
    });

    // Sort by relevance score
    filteredDocuments.sort((a, b) => b.relevance_score - a.relevance_score);

    // Apply pagination
    const limitNum = limit || 20;
    const offsetNum = offset || 0;
    const startIndex = offsetNum;
    const endIndex = startIndex + limitNum;
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

    // Track usage
    await trackUsage('legal_database_search', { 
      query, 
      category, 
      document_type,
      results_count: paginatedDocuments.length 
    });

    return NextResponse.json({
      documents: paginatedDocuments,
      pagination: {
        total: filteredDocuments.length,
        limit: limitNum,
        offset: offsetNum,
        has_more: endIndex < filteredDocuments.length
      },
      search_metadata: {
        query: query,
        category: category,
        document_type: document_type,
        filters: filters || {},
        search_time: Math.random() * 100 + 50, // Mock search time
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Legal database search error:', error);
    return NextResponse.json(
      { error: 'Qonun hujjatlarini qidirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
