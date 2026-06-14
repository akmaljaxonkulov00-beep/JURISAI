import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario_type = searchParams.get('scenario_type');
    const difficulty_level = searchParams.get('difficulty_level');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock scenarios data
    const mockScenarios = [
      {
        id: 'scenario_1',
        title: 'Tijorat shartnomasi nizosi',
        scenario_type: 'civil',
        difficulty_level: 'medium',
        complexity: 'medium',
        description: 'Katta kompaniyalar o\'rtasida shartnoma nizosi',
        participants_count: 4,
        duration_minutes: 45,
        complexity_score: 6,
        key_issues: ['Shartnoma buzilishi', 'Zarar kompensatsiyasi', 'Shartnoma bekor qilish'],
        focus_areas: ['Fuqarolik huquqi', 'Shartnoma huquqi'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T14:30:00Z',
        usage_count: 156,
        rating: 4.5,
        status: 'active',
        tags: ['tijorat', 'shartnoma', 'nizo', 'kompensatsiya']
      },
      {
        id: 'scenario_2',
        title: 'Ish haqi to\'lanmaganligi',
        scenario_type: 'labor',
        difficulty_level: 'easy',
        complexity: 'low',
        description: 'Ish haqi vaqtni to\'lanmaganligi bois nizo',
        participants_count: 3,
        duration_minutes: 30,
        complexity_score: 3,
        key_issues: ['Ish haqi', 'Ish vaqti', 'Kompensatsiya'],
        focus_areas: ['Mehnat huquqi', 'Ish haqi'],
        created_at: '2024-01-14T09:00:00Z',
        updated_at: '2024-01-14T17:20:00Z',
        usage_count: 89,
        rating: 4.2,
        status: 'active',
        tags: ['mehnat', 'ish haqi', 'kompensatsiya', 'nizo']
      },
      {
        id: 'scenario_3',
        title: 'Oilaviy mulk bo\'linishi',
        scenario_type: 'family',
        difficulty_level: 'hard',
        complexity: 'high',
        description: 'Ajralish paytida umumiy mulkning bo\'linishi masalasi',
        participants_count: 4,
        duration_minutes: 60,
        complexity_score: 9,
        key_issues: ['Mulk bo\'linishi', 'Vosa huquqi', 'Farzandlar tarbiyasi'],
        focus_areas: ['Oilaviy huquq', 'Mulk huquqi'],
        created_at: '2024-01-13T11:00:00Z',
        updated_at: '2024-01-15T09:15:00Z',
        usage_count: 234,
        rating: 4.7,
        status: 'active',
        tags: ['oilaviy', 'mulk', 'vosa', 'ajralish']
      },
      {
        id: 'scenario_4',
        title: 'Mulkka tegishli jinoyat',
        scenario_type: 'criminal',
        difficulty_level: 'medium',
        complexity: 'medium',
        description: 'O\'g\'irlik jinoyati bo\'yicha tergov',
        participants_count: 4,
        duration_minutes: 50,
        complexity_score: 6,
        key_issues: ['O\'g\'irlik', 'Dalillar', 'Jazo miqdori'],
        focus_areas: ['Jinoyat huquqi', 'Tergov'],
        created_at: '2024-01-12T14:00:00Z',
        updated_at: '2024-01-12T18:45:00Z',
        usage_count: 178,
        rating: 4.4,
        status: 'active',
        tags: ['jinoyat', 'o\'g\'irlik', 'tergov', 'jazo']
      },
      {
        id: 'scenario_5',
        title: 'Ijaraga olish nizosi',
        scenario_type: 'property',
        difficulty_level: 'easy',
        complexity: 'low',
        description: 'Ijaraga olingan mulk bo\'yicha nizo',
        participants_count: 3,
        duration_minutes: 35,
        complexity_score: 4,
        key_issues: ['Ijaraga olish', 'Ijara to\'lovi', 'Mulkni qaytarish'],
        focus_areas: ['Mulk huquqi', 'Ijaraga olish'],
        created_at: '2024-01-11T16:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        usage_count: 123,
        rating: 4.1,
        status: 'active',
        tags: ['mulkiy', 'ijara', 'nizo', 'uy-joy']
      },
      {
        id: 'scenario_6',
        title: 'Intellektual mulk nizosi',
        scenario_type: 'intellectual',
        difficulty_level: 'hard',
        complexity: 'high',
        description: 'Mualliflik huquqlarini buzish bo\'yicha nizo',
        participants_count: 4,
        duration_minutes: 55,
        complexity_score: 8,
        key_issues: ['Mualliflik huquqi', 'Litsenziya', 'Zarar kompensatsiyasi'],
        focus_areas: ['Intellektual mulk huquqi', 'Mualliflik huquqi'],
        created_at: '2024-01-10T13:30:00Z',
        updated_at: '2024-01-15T08:45:00Z',
        usage_count: 67,
        rating: 4.6,
        status: 'active',
        tags: ['intellektual', 'mualliflik', 'litsenziya', 'nizo']
      },
      {
        id: 'scenario_7',
        title: 'Qarz majburiyatlari',
        scenario_type: 'financial',
        difficulty_level: 'medium',
        complexity: 'medium',
        description: 'Qarz majburiyatlarini buzish bo\'yicha nizo',
        participants_count: 3,
        duration_minutes: 40,
        complexity_score: 5,
        key_issues: ['Qarz', 'Foiz', 'Muddatlar'],
        focus_areas: ['Moliyaviy huquq', 'Qarz majburiyatlari'],
        created_at: '2024-01-09T10:15:00Z',
        updated_at: '2024-01-14T16:20:00Z',
        usage_count: 145,
        rating: 4.3,
        status: 'active',
        tags: ['moliyaviy', 'qarz', 'foiz', 'majburiyat']
      },
      {
        id: 'scenario_8',
        title: 'Transport vositasi nizosi',
        scenario_type: 'transport',
        difficulty_level: 'easy',
        complexity: 'low',
        description: 'Avtomobil sotib olish bo\'yicha nizo',
        participants_count: 3,
        duration_minutes: 25,
        complexity_score: 3,
        key_issues: ['Sotib olish shartnomasi', 'Mulk sifati', 'Garantiya'],
        focus_areas: ['Transport huquqi', 'Sotib olish'],
        created_at: '2024-01-08T15:45:00Z',
        updated_at: '2024-01-13T11:30:00Z',
        usage_count: 98,
        rating: 4.0,
        status: 'active',
        tags: ['transport', 'avtomobil', 'sotib olish', 'nizo']
      },
      {
        id: 'scenario_9',
        title: 'Atrof-muhit muhofazasi',
        scenario_type: 'environmental',
        difficulty_level: 'hard',
        complexity: 'high',
        description: 'Atrof-muhitga zarar yetkazish bo\'yicha nizo',
        participants_count: 5,
        duration_minutes: 70,
        complexity_score: 9,
        key_issues: ['Ekologik zarar', 'Kompenatsiya', 'Javobgarlik'],
        focus_areas: ['Atrof-muhit huquqi', 'Ekologiya'],
        created_at: '2024-01-07T12:00:00Z',
        updated_at: '2024-01-15T07:20:00Z',
        usage_count: 45,
        rating: 4.8,
        status: 'active',
        tags: ['ekologiya', 'atrof-muhit', 'zarar', 'kompensatsiya']
      },
      {
        id: 'scenario_10',
        title: 'Tibbiyot xizmati nizosi',
        scenario_type: 'medical',
        difficulty_level: 'medium',
        complexity: 'medium',
        description: 'Tibbiy xizmat sifati bo\'yicha nizo',
        participants_count: 4,
        duration_minutes: 45,
        complexity_score: 6,
        key_issues: ['Tibbiyot xizmati sifati', 'Zarar', 'Kompenatsiya'],
        focus_areas: ['Tibbiyot huquqi', 'Sifat'],
        created_at: '2024-01-06T09:30:00Z',
        updated_at: '2024-01-14T12:45:00Z',
        usage_count: 112,
        rating: 4.5,
        status: 'active',
        tags: ['tibbiyot', 'sifat', 'nizo', 'kompensatsiya']
      }
    ];

    // Filter scenarios
    let filteredScenarios = mockScenarios;
    if (scenario_type) {
      filteredScenarios = mockScenarios.filter(scenario => scenario.scenario_type === scenario_type);
    }
    if (difficulty_level) {
      filteredScenarios = filteredScenarios.filter(scenario => scenario.difficulty_level === difficulty_level);
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedScenarios = filteredScenarios.slice(startIndex, endIndex);

    return NextResponse.json({
      scenarios: paginatedScenarios,
      pagination: {
        total: filteredScenarios.length,
        limit: limit,
        offset: offset,
        has_more: endIndex < filteredScenarios.length
      },
      filters: {
        scenario_type: scenario_type,
        difficulty_level: difficulty_level
      },
      summary: {
        total_scenarios: filteredScenarios.length,
        average_rating: Math.round(filteredScenarios.reduce((sum, s) => sum + s.rating, 0) / filteredScenarios.length * 10) / 10,
        total_usage: filteredScenarios.reduce((sum, s) => sum + s.usage_count, 0),
        by_difficulty: {
          easy: filteredScenarios.filter(s => s.difficulty_level === 'easy').length,
          medium: filteredScenarios.filter(s => s.difficulty_level === 'medium').length,
          hard: filteredScenarios.filter(s => s.difficulty_level === 'hard').length
        },
        by_type: {
          civil: filteredScenarios.filter(s => s.scenario_type === 'civil').length,
          criminal: filteredScenarios.filter(s => s.scenario_type === 'criminal').length,
          family: filteredScenarios.filter(s => s.scenario_type === 'family').length,
          labor: filteredScenarios.filter(s => s.scenario_type === 'labor').length,
          property: filteredScenarios.filter(s => s.scenario_type === 'property').length,
          other: filteredScenarios.filter(s => !['civil', 'criminal', 'family', 'labor', 'property'].includes(s.scenario_type)).length
        }
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scenarios get error:', error);
    return NextResponse.json(
      { error: 'Senariylarni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
