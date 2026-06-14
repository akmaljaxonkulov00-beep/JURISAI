import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    // Mock popular documents
    const mockPopularDocuments = [
      {
        id: 'doc_1',
        title: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
        type: 'code',
        category: 'civil',
        popularity_score: 98,
        view_count: 15420,
        download_count: 3280,
        bookmark_count: 892,
        description: 'Fuqarolik-huquqiy munosabatlarni tartibga soluvchi asosiy qonun hujjati',
        url: 'https://lex.uz/acts/-/text/1492387',
        last_accessed: '2024-01-15T14:30:00Z'
      },
      {
        id: 'doc_2',
        title: 'O\'zbekiston Respublikasi Mehnat kodeksi',
        type: 'code',
        category: 'labor',
        popularity_score: 95,
        view_count: 12350,
        download_count: 2890,
        bookmark_count: 756,
        description: 'Mehnat munosabatlarini tartibga soluvchi qonun hujjati',
        url: 'https://lex.uz/acts/-/text/1493359',
        last_accessed: '2024-01-15T13:45:00Z'
      },
      {
        id: 'doc_3',
        title: 'O\'zbekiston Respublikasi Konstitutsiyasi',
        type: 'constitution',
        category: 'constitutional',
        popularity_score: 92,
        view_count: 11280,
        download_count: 2650,
        bookmark_count: 698,
        description: 'O\'zbekiston Respublikasining asosiy qonuni',
        url: 'https://lex.uz/acts/-/text/1473577',
        last_accessed: '2024-01-15T12:20:00Z'
      },
      {
        id: 'doc_4',
        title: 'O\'zbekiston Respublikasi Oilaviy kodeksi',
        type: 'code',
        category: 'family',
        popularity_score: 88,
        view_count: 9870,
        download_count: 2340,
        bookmark_count: 612,
        description: 'Oilaviy munosabatlarni tartibga soluvchi qonun hujjati',
        url: 'https://lex.uz/acts/-/text/1492386',
        last_accessed: '2024-01-15T11:15:00Z'
      },
      {
        id: 'doc_5',
        title: 'O\'zbekiston Respublikasi Jinoyat kodeksi',
        type: 'code',
        category: 'criminal',
        popularity_score: 85,
        view_count: 8960,
        download_count: 2100,
        bookmark_count: 589,
        description: 'Jinoyatlar va jazo choralari to\'g\'risidagi qonun',
        url: 'https://lex.uz/acts/-/text/1492390',
        last_accessed: '2024-01-15T10:30:00Z'
      },
      {
        id: 'doc_6',
        title: 'O\'zbekiston Respublikasi Yer kodeksi',
        type: 'code',
        category: 'land',
        popularity_score: 82,
        view_count: 7650,
        download_count: 1890,
        bookmark_count: 523,
        description: 'Yer munosabatlarini tartibga soluvchi qonun hujjati',
        url: 'https://lex.uz/acts/-/text/1492362',
        last_accessed: '2024-01-15T09:45:00Z'
      },
      {
        id: 'doc_7',
        title: 'O\'zbekiston Respublikasi Soliq kodeksi',
        type: 'code',
        category: 'tax',
        popularity_score: 78,
        view_count: 6890,
        download_count: 1650,
        bookmark_count: 467,
        description: 'Soliq munosabatlarini tartibga soluvchi qonun hujjati',
        url: 'https://lex.uz/acts/-/text/1492449',
        last_accessed: '2024-01-15T08:20:00Z'
      },
      {
        id: 'doc_8',
        title: 'O\'zbekiston Respublikasi "Litsenziyalash to\'g\'risida" qonuni',
        type: 'law',
        category: 'administrative',
        popularity_score: 75,
        view_count: 6230,
        download_count: 1480,
        bookmark_count: 412,
        description: 'Litsenziyalash tartibini belgilovchi qonun',
        url: 'https://lex.uz/acts/-/text/1492585',
        last_accessed: '2024-01-14T17:30:00Z'
      },
      {
        id: 'doc_9',
        title: 'O\'zbekiston Respublikasi "Nizolarni hal etish to\'g\'risida" qonuni',
        type: 'law',
        category: 'procedural',
        popularity_score: 72,
        view_count: 5870,
        download_count: 1320,
        bookmark_count: 389,
        description: 'Nizolarni hal etish tartibini belgilovchi qonun',
        url: 'https://lex.uz/acts/-/text/1492448',
        last_accessed: '2024-01-14T16:15:00Z'
      },
      {
        id: 'doc_10',
        title: 'O\'zbekiston Respublikasi "Bank faoliyati to\'g\'risida" qonuni',
        type: 'law',
        category: 'financial',
        popularity_score: 70,
        view_count: 5420,
        download_count: 1180,
        bookmark_count: 356,
        description: 'Bank faoliyatini tartibga soluvchi qonun',
        url: 'https://lex.uz/acts/-/text/1492414',
        last_accessed: '2024-01-14T15:00:00Z'
      }
    ];

    // Filter by category if provided
    let filteredDocuments = mockPopularDocuments;
    if (category) {
      filteredDocuments = mockPopularDocuments.filter(doc => doc.category === category);
    }

    // Apply limit
    const limitedDocuments = filteredDocuments.slice(0, limit);

    return NextResponse.json({
      documents: limitedDocuments,
      pagination: {
        total: filteredDocuments.length,
        limit: limit,
        has_more: filteredDocuments.length > limit
      },
      filters: {
        category: category
      },
      summary: {
        total_views: limitedDocuments.reduce((sum, doc) => sum + doc.view_count, 0),
        total_downloads: limitedDocuments.reduce((sum, doc) => sum + doc.download_count, 0),
        total_bookmarks: limitedDocuments.reduce((sum, doc) => sum + doc.bookmark_count, 0)
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Legal popular documents get error:', error);
    return NextResponse.json(
      { error: 'Mashhur hujjatlarni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
