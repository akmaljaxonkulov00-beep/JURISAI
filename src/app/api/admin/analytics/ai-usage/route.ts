import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // daily
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get usage tracking data from Supabase
    const { data: usageData, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .in('feature', ['legal_chat', 'irac_analysis', 'document_generation', 'law_search'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get users data for top users
    const { data: users } = await supabase
      .from('users')
      .select('*');

    // Generate mock analytics data
    const aiUsageOverTime = generateMockAIUsageOverTime(startDate, usageData || []);
    const mostUsedFeatures = generateMockMostUsedFeatures(usageData || []);
    const topUsers = generateMockTopUsers(usageData || [], users || []);
    const summary = generateMockAISummary(usageData || [], now);

    return NextResponse.json({
      aiUsageOverTime,
      mostUsedFeatures,
      topUsers,
      summary,
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI usage analytics error:', error);
    return NextResponse.json(
      { error: 'Analitikani olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function generateMockAIUsageOverTime(startDate: Date, usageData: any[]) {
  const data = [];
  const days = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayUsage = usageData.filter(u => 
      u.created_at.startsWith(dateStr)
    );
    
    data.push({
      date: dateStr,
      legalChatRequests: dayUsage.filter(u => u.feature === 'legal_chat').length,
      iracAnalysisRequests: dayUsage.filter(u => u.feature === 'irac_analysis').length,
      documentGenerationRequests: dayUsage.filter(u => u.feature === 'document_generation').length,
      lawSearchRequests: dayUsage.filter(u => u.feature === 'law_search').length,
      totalRequests: dayUsage.length
    });
  }
  
  return data;
}

function generateMockMostUsedFeatures(usageData: any[]) {
  const features = ['legal_chat', 'irac_analysis', 'document_generation', 'law_search'];
  
  return features.map(feature => {
    const featureUsage = usageData.filter(u => u.feature === feature);
    return {
      feature,
      totalUsage: featureUsage.length,
      uniqueUsers: new Set(featureUsage.map(u => u.user_id)).size
    };
  }).sort((a, b) => b.totalUsage - a.totalUsage);
}

function generateMockTopUsers(usageData: any[], users: any[]) {
  const userUsageMap = new Map();
  
  usageData.forEach(usage => {
    if (!userUsageMap.has(usage.user_id)) {
      userUsageMap.set(usage.user_id, {
        totalUsage: 0,
        features: new Set()
      });
    }
    userUsageMap.get(usage.user_id).totalUsage++;
    userUsageMap.get(usage.user_id).features.add(usage.feature);
  });
  
  return Array.from(userUsageMap.entries())
    .map(([userId, data]) => {
      const user = users.find(u => u.id === userId);
      return {
        id: userId,
        email: user?.email || 'unknown@example.com',
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ')[1] || '',
        totalAIUsage: data.totalUsage,
        featuresUsed: data.features.size
      };
    })
    .sort((a, b) => b.totalAIUsage - a.totalAIUsage)
    .slice(0, 10);
}

function generateMockAISummary(usageData: any[], now: Date) {
  const todayStr = now.toISOString().split('T')[0];
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const todayUsage = usageData.filter(u => u.created_at.startsWith(todayStr));
  const weekUsage = usageData.filter(u => new Date(u.created_at) >= weekStart);
  const monthUsage = usageData.filter(u => new Date(u.created_at) >= monthStart);
  
  return {
    totalAIUsage: usageData.length,
    totalRequests: usageData.length,
    todayAIUsage: todayUsage.length,
    todayRequests: todayUsage.length,
    weekAIUsage: weekUsage.length,
    weekRequests: weekUsage.length,
    monthAIUsage: monthUsage.length,
    monthRequests: monthUsage.length,
  };
}
