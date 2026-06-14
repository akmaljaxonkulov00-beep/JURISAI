import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock history data
    const mockHistory = [
      {
        id: '1',
        simulation_id: 'sim_12345',
        scenario_title: 'Tijorat nizosi',
        case_type: 'civil',
        difficulty_level: 'medium',
        score: 85,
        outcome: 'victory',
        status: 'completed',
        completed_at: '2024-01-15T10:30:00Z',
        duration: 1800, // 30 minutes
        user_role: 'plaintiff'
      },
      {
        id: '2',
        simulation_id: 'sim_12346',
        scenario_title: 'Ish huquqi nizosi',
        case_type: 'labor',
        difficulty_level: 'hard',
        score: 72,
        outcome: 'partial_victory',
        status: 'completed',
        completed_at: '2024-01-14T14:20:00Z',
        duration: 2400, // 40 minutes
        user_role: 'defendant'
      },
      {
        id: '3',
        simulation_id: 'sim_12347',
        scenario_title: 'Oilaviy nizo',
        case_type: 'family',
        difficulty_level: 'easy',
        score: 91,
        outcome: 'victory',
        status: 'completed',
        completed_at: '2024-01-13T16:45:00Z',
        duration: 1500, // 25 minutes
        user_role: 'plaintiff'
      },
      {
        id: '4',
        simulation_id: 'sim_12348',
        scenario_title: 'Mulk nizosi',
        case_type: 'property',
        difficulty_level: 'medium',
        score: 78,
        outcome: 'defeat',
        status: 'completed',
        completed_at: '2024-01-12T11:15:00Z',
        duration: 2100, // 35 minutes
        user_role: 'defendant'
      },
      {
        id: '5',
        simulation_id: 'sim_12349',
        scenario_title: 'Shartnoma nizosi',
        case_type: 'contract',
        difficulty_level: 'hard',
        score: 88,
        outcome: 'victory',
        status: 'completed',
        completed_at: '2024-01-11T09:30:00Z',
        duration: 2700, // 45 minutes
        user_role: 'plaintiff'
      }
    ];

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedHistory = mockHistory.slice(startIndex, endIndex);

    return NextResponse.json({
      simulations: paginatedHistory,
      pagination: {
        total: mockHistory.length,
        limit: limit,
        offset: offset,
        has_more: endIndex < mockHistory.length
      },
      summary: {
        total_simulations: mockHistory.length,
        average_score: Math.round(mockHistory.reduce((sum, sim) => sum + sim.score, 0) / mockHistory.length),
        victories: mockHistory.filter(sim => sim.outcome === 'victory').length,
        defeats: mockHistory.filter(sim => sim.outcome === 'defeat').length,
        partial_victories: mockHistory.filter(sim => sim.outcome === 'partial_victory').length
      }
    });

  } catch (error) {
    console.error('Court simulation history get error:', error);
    return NextResponse.json(
      { error: 'Simulyatsiya tarixini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
