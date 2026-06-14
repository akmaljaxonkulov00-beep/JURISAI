import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getCurrentUser } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    // Try multiple authentication methods
    
    // Method 1: Authorization header
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '');
    
    // Method 2: Cookies
    const cookieToken = request.cookies.get('sb-access-token')?.value;
    
    // Method 3: Use getCurrentUser helper (server-side session)
    let user = null;
    let authError = null;
    
    if (headerToken) {
      // Try header token first
      const result = await supabaseServer.auth.getUser(headerToken);
      user = result.data.user;
      authError = result.error;
    } else if (cookieToken) {
      // Try cookie token
      const result = await supabaseServer.auth.getUser(cookieToken);
      user = result.data.user;
      authError = result.error;
    } else {
      // Try server-side session
      user = await getCurrentUser();
      authError = user ? null : new Error('No user session found');
    }
    
    if (authError || !user?.email) {
      console.log('Auth failed:', { authError: authError?.message, hasUser: !!user, hasEmail: !!user?.email });
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get user from database
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, first_name, last_name, role, status')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user analytics
    const { data: analyticsData, error: analyticsError } = await supabaseServer
      .from('user_analytics')
      .select('*')
      .eq('user_id', userData.id)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch user analytics' },
        { status: 500 }
      );
    }

    // Get user achievements
    const { data: achievementsData, error: achievementsError } = await supabaseServer
      .from('achievements')
      .select('*')
      .eq('user_id', userData.id)
      .order('unlocked_at', { ascending: false })
      .limit(10);

    if (achievementsError) {
      console.error('Achievements error:', achievementsError);
    }

    // Get IRAC cases
    const { data: iracData, error: iracError } = await supabaseServer
      .from('irac_cases')
      .select('id, title, status, total_score, created_at')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (iracError) {
      console.error('IRAC error:', iracError);
    }

    // Get usage tracking for recent activity
    const { data: usageData, error: usageError } = await supabaseServer
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userData.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (usageError) {
      console.error('Usage error:', usageError);
    }

    // Calculate real stats
    const totalXP = analyticsData?.reduce((sum: number, day: any) => sum + (day.irac_cases_completed * 10 + day.ai_requests * 5), 0) || 0;
    const completedCases = iracData?.filter((item: any) => item.status === 'COMPLETED').length || 0;
    const totalCases = iracData?.length || 0;
    const level = Math.floor(totalXP / 200) + 1; // 200 XP per level
    
    // Calculate weekly progress
    const weeklyXP = analyticsData?.slice(0, 7).reduce((sum: number, day: any) => sum + (day.irac_cases_completed * 10 + day.ai_requests * 5), 0) || 0;
    const weeklyProgress = Math.min(Math.round((weeklyXP / 500) * 100), 100); // 500 XP weekly goal

    // Process achievements
    const achievements = (achievementsData || []).map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description || '',
      icon: getAchievementIcon(achievement.achievement_type),
      unlockedAt: achievement.unlocked_at,
      rarity: achievement.rarity.toLowerCase()
    }));

    // Process recent activity
    const recentActivity = (usageData || []).map((usage: any) => ({
      id: usage.id,
      type: usage.feature.replace('-', '_'),
      title: getActivityTitle(usage.feature, usage.action),
      description: getActivityDescription(usage.feature, usage.action),
      timestamp: usage.created_at,
      xp: getActivityXP(usage.feature)
    }));

    const rank = getRankByLevel(level);

    const userStats = {
      xp: totalXP,
      level,
      completedCases,
      totalCases,
      weeklyProgress,
      rank,
      achievements,
      recentActivity
    };

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getAchievementIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'first_case': '🎯',
    'irac_master': '⚖️',
    'quick_thinker': '⚡',
    'legal_scholar': '🎓',
    'ai_expert': '🤖',
    'case_solver': '🏆',
    'research_master': '📚',
    'perfect_score': '💯'
  };
  return icons[type] || '🏅';
}

function getActivityTitle(feature: string, action: string): string {
  const titles: { [key: string]: string } = {
    'legal-chat': 'AI Legal Chat',
    'irac-analysis': 'IRAC Analysis',
    'document-generation': 'Document Generation',
    'law-search': 'Legal Research',
    'case-solver': 'Case Solving',
    'court-simulator': 'Court Simulation'
  };
  return titles[feature] || 'Activity';
}

function getActivityDescription(feature: string, action: string): string {
  const descriptions: { [key: string]: string } = {
    'legal-chat': 'Completed AI legal consultation',
    'irac-analysis': 'Analyzed legal case using IRAC method',
    'document-generation': 'Generated legal document',
    'law-search': 'Searched legal database',
    'case-solver': 'Solved legal case',
    'court-simulator': 'Participated in court simulation'
  };
  return descriptions[feature] || `Completed ${action} activity`;
}

function getActivityXP(feature: string): number {
  const xpValues: { [key: string]: number } = {
    'legal-chat': 5,
    'irac-analysis': 15,
    'document-generation': 10,
    'law-search': 3,
    'case-solver': 20,
    'court-simulator': 25
  };
  return xpValues[feature] || 5;
}

function getRankByLevel(level: number): string {
  if (level >= 50) return 'Legal Master';
  if (level >= 40) return 'Senior Expert';
  if (level >= 30) return 'Expert';
  if (level >= 20) return 'Advanced Practitioner';
  if (level >= 15) return 'Practitioner';
  if (level >= 10) return 'Intermediate';
  if (level >= 5) return 'Junior';
  return 'Beginner';
}
