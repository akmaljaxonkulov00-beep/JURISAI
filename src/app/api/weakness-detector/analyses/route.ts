import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const argument_type = searchParams.get('argument_type');

    // Mock weakness analyses data
    const mockAnalyses = [
      {
        id: 'analysis_1',
        argument_text: 'Mazkur shartnoma buzilgani uchun tovon to\'lash talab qilinadi. Bu aniq adolatsizlik va to\'g\'ri emas.',
        argument_type: 'legal',
        context: 'Sud jarayoni',
        target_audience: 'Sudya',
        analysis_depth: 'standard',
        overall_score: 72,
        confidence_level: 88,
        weakness_count: 3,
        strength_count: 2,
        analyzed_at: '2024-01-15T10:30:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Qonun hujjatlariga havolalar qo\'shing',
          'Mantiqiy bog\'lanishlarni mustahkamlang',
          'Rasmiy uslubni qo\'llang'
        ],
        tags: ['mantiqiy xatolik', 'dalillar yetishmasligi', 'hissiy ifoda']
      },
      {
        id: 'analysis_2',
        argument_text: 'Ish haqi 3 oy davomida to\'lanmaganligi sababli, kompensatsiya talab qilinadi. Mehnat kodeksiga ko\'ra, bu majburiyatni buzish hisoblanadi.',
        argument_type: 'labor',
        context: 'Mehnat nizosi',
        target_audience: 'Ish beruvchi',
        analysis_depth: 'detailed',
        overall_score: 85,
        confidence_level: 92,
        weakness_count: 2,
        strength_count: 4,
        analyzed_at: '2024-01-14T14:20:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Hisoblash jadvalini qo\'shing',
          'Qo\'shimcha dalillar keltiring'
        ],
        tags: ['hisoblash', 'dalillar', 'mehnat huquqi']
      },
      {
        id: 'analysis_3',
        argument_text: 'Oilaviy mulk bo\'linishi munosabati bilan farzandlar manfaati birinchi o\'rinda turishi kerak. Vosa huquqi asosida, onaning farzandlarni o\'zi bilan qolishi ma\'qul.',
        argument_type: 'family',
        context: 'Oilaviy nizo',
        target_audience: 'Sudya',
        analysis_depth: 'standard',
        overall_score: 78,
        confidence_level: 85,
        weakness_count: 2,
        strength_count: 3,
        analyzed_at: '2024-01-13T16:45:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Mulkning qimmatini baholash',
          'Otaning huquqlarini hisobga olish'
        ],
        tags: ['vosa huquqi', 'mulk bo\'linishi', 'farzandlar manfaati']
      },
      {
        id: 'analysis_4',
        argument_text: 'Ayblanuvchi tomonidan o\'g\'irlik sodir etilgani isbotlangan. Jinoyat kodeksining 169-moddasiga ko\'ra, bu og\'ir jinoyat hisoblanadi.',
        argument_type: 'criminal',
        context: 'Jinoyat ishi',
        target_audience: 'Sudya',
        analysis_depth: 'detailed',
        overall_score: 88,
        confidence_level: 95,
        weakness_count: 1,
        strength_count: 5,
        analyzed_at: '2024-01-12T11:15:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Dalillarning to\'liqligini ko\'rsating',
          'Jazo miqdorini asoslang'
        ],
        tags: ['o\'g\'irlik', 'jinoyat tarkibi', 'dalillar']
      },
      {
        id: 'analysis_5',
        argument_text: 'Ijaraga olingan uyning holati yomonlashgani sababli, ijara to\'lovini kamaytirish talab qilinadi. Shartnomaning 8-bandiga ko\'ra, ijara beruvchi mulk holatini saqlashi lozim.',
        argument_type: 'property',
        context: 'Ijaraga olish nizosi',
        target_audience: 'Ijaraga beruvchi',
        analysis_depth: 'standard',
        overall_score: 75,
        confidence_level: 82,
        weakness_count: 3,
        strength_count: 2,
        analyzed_at: '2024-01-11T09:30:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Mulk holatini hujjatlashtiring',
          'Ekspert xulosasini keltiring',
          'Shartnoma shartlarini batafsil ko\'rsating'
        ],
        tags: ['ijara', 'mulkdagi nuqsonlar', 'kompensatsiya']
      },
      {
        id: 'analysis_6',
        argument_text: 'Qarz shartnomasiga ko\'ra, qarzni 2024 yil 1-martgacha qaytarish kerak edi. Muddatning o\'tishi sababli, kechikish uchun foizlar hisoblanadi.',
        argument_type: 'financial',
        context: 'Qarz nizosi',
        target_audience: 'Qarzdor',
        analysis_depth: 'detailed',
        overall_score: 82,
        confidence_level: 89,
        weakness_count: 2,
        strength_count: 4,
        analyzed_at: '2024-01-10T13:20:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Foizlar miqdorini hisoblang',
          'Qonuniy asoslarni ko\'rsating'
        ],
        tags: ['qarz', 'foizlar', 'muddatlar']
      },
      {
        id: 'analysis_7',
        argument_text: 'Mualliflik huquqlarini buzish holati aniqlangan. Asar muallifning ruxsatisiz foydalanilgan, bu intellektual mulk huquqining buzilishidir.',
        argument_type: 'intellectual',
        context: 'Mualliflik huquqi',
        target_audience: 'Sudya',
        analysis_depth: 'standard',
        overall_score: 90,
        confidence_level: 94,
        weakness_count: 1,
        strength_count: 5,
        analyzed_at: '2024-01-09T15:45:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Zarar miqdorini hisoblang',
          'Mualliflik guvohnomasini ko\'rsating'
        ],
        tags: ['mualliflik huquqi', 'intellektual mulk', 'zarar']
      },
      {
        id: 'analysis_8',
        argument_text: 'Transport vositasi yo\'l-transport hodisasi natijasida shikastlangan. Suvayib haydovchining to\'liq javobgarligi belgilanishi kerak.',
        argument_type: 'transport',
        context: 'Yo\'l-transport hodisasi',
        target_audience: 'Sug\'urta kompaniyasi',
        analysis_depth: 'detailed',
        overall_score: 76,
        confidence_level: 83,
        weakness_count: 3,
        strength_count: 2,
        analyzed_at: '2024-01-08T08:15:00Z',
        status: 'completed',
        improvement_suggestions: [
          'Hodisa xulosasini qo\'shing',
          'Shikastlanish miqdorini belgilang',
          'Qonuniy javobgarlik asoslarini ko\'rsating'
        ],
        tags: ['transport', 'hodisa', 'javobgarlik']
      }
    ];

    // Filter analyses by argument_type if provided
    let filteredAnalyses = mockAnalyses;
    if (argument_type) {
      filteredAnalyses = mockAnalyses.filter(analysis => analysis.argument_type === argument_type);
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedAnalyses = filteredAnalyses.slice(startIndex, endIndex);

    return NextResponse.json({
      analyses: paginatedAnalyses,
      pagination: {
        total: filteredAnalyses.length,
        limit: limit,
        offset: offset,
        has_more: endIndex < filteredAnalyses.length
      },
      filters: {
        argument_type: argument_type
      },
      summary: {
        total_analyses: filteredAnalyses.length,
        average_score: Math.round(filteredAnalyses.reduce((sum, a) => sum + a.overall_score, 0) / filteredAnalyses.length),
        average_confidence: Math.round(filteredAnalyses.reduce((sum, a) => sum + a.confidence_level, 0) / filteredAnalyses.length),
        by_argument_type: {
          legal: filteredAnalyses.filter(a => a.argument_type === 'legal').length,
          labor: filteredAnalyses.filter(a => a.argument_type === 'labor').length,
          family: filteredAnalyses.filter(a => a.argument_type === 'family').length,
          criminal: filteredAnalyses.filter(a => a.argument_type === 'criminal').length,
          property: filteredAnalyses.filter(a => a.argument_type === 'property').length,
          other: filteredAnalyses.filter(a => !['legal', 'labor', 'family', 'criminal', 'property'].includes(a.argument_type)).length
        },
        by_score_range: {
          excellent: filteredAnalyses.filter(a => a.overall_score >= 90).length,
          good: filteredAnalyses.filter(a => a.overall_score >= 80 && a.overall_score < 90).length,
          fair: filteredAnalyses.filter(a => a.overall_score >= 70 && a.overall_score < 80).length,
          poor: filteredAnalyses.filter(a => a.overall_score < 70).length
        }
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weakness analyses get error:', error);
    return NextResponse.json(
      { error: 'Tahlillarni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
