import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Mock user statistics
    const mockUserStats = {
      total_simulations: 15,
      completed_simulations: 12,
      average_score: 85,
      highest_score: 95,
      lowest_score: 72,
      success_rate: 80,
      total_time_spent: 450, // minutes
      average_duration: 30, // minutes per simulation
      favorite_case_type: 'civil',
      performance_by_difficulty: {
        easy: { count: 4, avg_score: 92, success_rate: 100 },
        medium: { count: 8, avg_score: 87, success_rate: 75 },
        hard: { count: 3, avg_score: 76, success_rate: 67 }
      },
      performance_by_case_type: {
        civil: { count: 6, avg_score: 88, success_rate: 83 },
        labor: { count: 3, avg_score: 82, success_rate: 67 },
        family: { count: 2, avg_score: 90, success_rate: 100 },
        property: { count: 1, avg_score: 78, success_rate: 0 }
      },
      recent_performance: [
        { date: '2024-01-15', score: 85, outcome: 'victory', case_type: 'civil' },
        { date: '2024-01-14', score: 72, outcome: 'partial_victory', case_type: 'labor' },
        { date: '2024-01-13', score: 91, outcome: 'victory', case_type: 'family' },
        { date: '2024-01-12', score: 78, outcome: 'defeat', case_type: 'property' },
        { date: '2024-01-11', score: 88, outcome: 'victory', case_type: 'contract' }
      ],
      achievements: [
        {
          id: 'first_victory',
          title: 'Birinchi G\'alaba',
          description: 'Birinchi simulyatsiyada g\'alaba qozondingiz',
          earned_at: '2024-01-11T09:30:00Z'
        },
        {
          id: 'high_scorer',
          title: 'Yuqori Ball',
          description: '90 balldan yuqori natija oldingiz',
          earned_at: '2024-01-13T16:45:00Z'
        },
        {
          id: 'consistent',
          title: 'Barqarorlik',
          description: '3 ta simulyatsiyada ketma-ket g\'alaba qozondingiz',
          earned_at: '2024-01-15T10:30:00Z'
        }
      ],
      improvement_areas: [
        'Dalillarni samaraliroq taqdim etish',
        'Qonun hujjatlariga chuqurroq murojaat qilish',
        'Vaqt boshqaruvini yaxshilash'
      ],
      next_milestones: [
        { target: 20, current: 15, description: '20 ta simulyatsiyani tugatish' },
        { target: 90, current: 85, description: 'O\'rtacha 90 ballga erishish' },
        { target: 100, current: 80, description: '100% muvaffaqiyatga erishish' }
      ]
    };

    return NextResponse.json(mockUserStats);

  } catch (error) {
    console.error('Court statistics get error:', error);
    return NextResponse.json(
      { error: 'Statistikani olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
