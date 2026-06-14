import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Mock leaderboard data
    const mockLeaderboard = [
      {
        rank: 1,
        user_id: 'user_1',
        user_name: 'Ali Valiyev',
        avatar: null,
        total_score: 2850,
        simulations_count: 25,
        success_rate: 92,
        average_score: 85.5,
        current_streak: 5,
        best_score: 98,
        period_score: 450,
        achievements: ['high_scorer', 'consistent', 'expert']
      },
      {
        rank: 2,
        user_id: 'user_2',
        user_name: 'Dilnoza Karimova',
        avatar: null,
        total_score: 2720,
        simulations_count: 23,
        success_rate: 87,
        average_score: 83.2,
        current_streak: 3,
        best_score: 95,
        period_score: 420,
        achievements: ['consistent', 'strategic']
      },
      {
        rank: 3,
        user_id: 'user_3',
        user_name: 'Bekzod Toshmatov',
        avatar: null,
        total_score: 2680,
        simulations_count: 22,
        success_rate: 85,
        average_score: 82.0,
        current_streak: 2,
        best_score: 94,
        period_score: 380,
        achievements: ['persistent', 'improving']
      },
      {
        rank: 4,
        user_id: 'user_4',
        user_name: 'Gulnora Soliyeva',
        avatar: null,
        total_score: 2550,
        simulations_count: 20,
        success_rate: 80,
        average_score: 79.5,
        current_streak: 1,
        best_score: 92,
        period_score: 350,
        achievements: ['improving']
      },
      {
        rank: 5,
        user_id: 'user_5',
        user_name: 'Jasur Abdullayev',
        avatar: null,
        total_score: 2420,
        simulations_count: 19,
        success_rate: 78,
        average_score: 77.8,
        current_streak: 0,
        best_score: 91,
        period_score: 320,
        achievements: ['persistent']
      },
      {
        rank: 6,
        user_id: 'user_6',
        user_name: 'Nodira Azimova',
        avatar: null,
        total_score: 2380,
        simulations_count: 18,
        success_rate: 75,
        average_score: 76.4,
        current_streak: 0,
        best_score: 89,
        period_score: 310,
        achievements: ['dedicated']
      },
      {
        rank: 7,
        user_id: 'user_7',
        user_name: 'Rustam Umarov',
        avatar: null,
        total_score: 2250,
        simulations_count: 17,
        success_rate: 73,
        average_score: 75.0,
        current_streak: 0,
        best_score: 88,
        period_score: 290,
        achievements: []
      },
      {
        rank: 8,
        user_id: 'user_8',
        user_name: 'Malika Xaydarova',
        avatar: null,
        total_score: 2180,
        simulations_count: 16,
        success_rate: 70,
        average_score: 73.8,
        current_streak: 0,
        best_score: 87,
        period_score: 270,
        achievements: []
      },
      {
        rank: 9,
        user_id: 'user_9',
        user_name: 'Sardor Nazarov',
        avatar: null,
        total_score: 2100,
        simulations_count: 15,
        success_rate: 68,
        average_score: 72.0,
        current_streak: 0,
        best_score: 85,
        period_score: 250,
        achievements: []
      },
      {
        rank: 10,
        user_id: 'user_10',
        user_name: 'Zuhra Saidova',
        avatar: null,
        total_score: 2050,
        simulations_count: 14,
        success_rate: 65,
        average_score: 71.4,
        current_streak: 0,
        best_score: 84,
        period_score: 240,
        achievements: []
      }
    ];

    // Apply period filter (mock implementation)
    let filteredLeaderboard = mockLeaderboard;
    if (period === 'weekly') {
      filteredLeaderboard = mockLeaderboard.map(user => ({
        ...user,
        total_score: user.period_score
      }));
    } else if (period === 'monthly') {
      filteredLeaderboard = mockLeaderboard.map(user => ({
        ...user,
        total_score: Math.floor(user.period_score * 4.3) // Mock monthly calculation
      }));
    }

    // Apply limit
    const limitedLeaderboard = filteredLeaderboard.slice(0, limit);

    return NextResponse.json({
      leaderboard: limitedLeaderboard,
      period: period,
      total_participants: mockLeaderboard.length,
      user_rank: limitedLeaderboard.findIndex(u => u.user_id === 'demo-user') + 1 || null,
      summary: {
        top_score: limitedLeaderboard[0]?.total_score || 0,
        average_score: Math.round(limitedLeaderboard.reduce((sum, u) => sum + u.average_score, 0) / limitedLeaderboard.length),
        total_simulations: limitedLeaderboard.reduce((sum, u) => sum + u.simulations_count, 0)
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Court leaderboard get error:', error);
    return NextResponse.json(
      { error: 'Leaderboardni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
