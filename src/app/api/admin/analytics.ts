import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Get revenue analytics
    const { data: revenueData, error: revenueError } = await supabaseClient
      .from('subscriptions')
      .select(`
        id,
        created_at,
        current_period_start,
        current_period_end,
        subscription_plans (
          name,
          price,
          currency
        )
      `)
      .eq('status', 'ACTIVE')
      .gte('created_at', getDateRange(period));

    if (revenueError) {
      console.error('Revenue analytics error:', revenueError);
      return NextResponse.json(
        { error: 'Failed to fetch revenue data' },
        { status: 500 }
      );
    }

    // Get user analytics
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        created_at,
        last_login,
        subscriptions (
          id,
          status,
          current_period_end,
          subscription_plans (
            name,
            price
          )
        )
      `)
      .gte('created_at', getDateRange(period));

    if (userError) {
      console.error('User analytics error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Get AI usage analytics
    const { data: usageData, error: usageError } = await supabaseClient
      .from('usage_tracking')
      .select('*')
      .gte('created_at', getDateRange(period));

    if (usageError) {
      console.error('Usage analytics error:', usageError);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      );
    }

    // Process revenue analytics
    const revenueByDate = processRevenueData(revenueData || []);
    const revenueByPlan = processRevenueByPlan(revenueData || []);
    const revenueSummary = calculateRevenueSummary(revenueByDate);

    // Process user analytics
    const userGrowth = processUserGrowth(userData || []);
    const activeSubscriptions = processActiveSubscriptions(userData || []);
    const userSummary = calculateUserSummary(userData || []);

    // Process AI usage analytics
    const aiUsageOverTime = processAIUsageData(usageData || []);
    const mostUsedFeatures = processMostUsedFeatures(usageData || []);
    const aiUsageSummary = calculateAIUsageSummary(usageData || []);

    const analytics = {
      revenueAnalytics: {
        revenueData: revenueByDate,
        revenueByPlan,
        summary: revenueSummary
      },
      userAnalytics: {
        userGrowth,
        activeSubscriptions,
        summary: userSummary,
        lastUsers: (userData || []).slice(-10).map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          createdAt: user.created_at,
          subscription: user.subscriptions?.[0] ? {
            planName: user.subscriptions[0].subscription_plans?.[0]?.name || 'Unknown',
            status: user.subscriptions[0].status,
            currentPeriodEnd: user.subscriptions[0].current_period_end || ''
          } : null
        })),
        userRoles: processUserRoles(userData || [])
      },
      aiUsageAnalytics: {
        aiUsageOverTime,
        mostUsedFeatures,
        summary: aiUsageSummary,
        topUsers: processTopUsers(usageData || [])
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDateRange(period: string): string {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.setDate(now.getDate() - 1)).toISOString();
    case 'week':
      return new Date(now.setDate(now.getDate() - 7)).toISOString();
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
    default:
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
  }
}

function processRevenueData(data: any[]): any[] {
  const groupedByDate: { [key: string]: { revenue: number; count: number } } = {};
  
  data.forEach(sub => {
    const date = new Date(sub.created_at).toISOString().split('T')[0];
    const price = parseFloat(sub.subscription_plans?.price || '0');
    
    if (!groupedByDate[date]) {
      groupedByDate[date] = { revenue: 0, count: 0 };
    }
    groupedByDate[date].revenue += price;
    groupedByDate[date].count += 1;
  });

  return Object.entries(groupedByDate).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    transactionCount: data.count
  }));
}

function processRevenueByPlan(data: any[]): any[] {
  const groupedByPlan: { [key: string]: { count: number; revenue: number; price: number } } = {};
  
  data.forEach(sub => {
    const planName = sub.subscription_plans?.name || 'Unknown';
    const price = parseFloat(sub.subscription_plans?.price || '0');
    
    if (!groupedByPlan[planName]) {
      groupedByPlan[planName] = { count: 0, revenue: 0, price };
    }
    groupedByPlan[planName].count += 1;
    groupedByPlan[planName].revenue += price;
  });

  return Object.entries(groupedByPlan).map(([planName, data]) => ({
    planName,
    planPrice: data.price,
    subscriptionCount: data.count,
    totalRevenue: data.revenue
  }));
}

function calculateRevenueSummary(revenueData: any[]): any {
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTransactions = revenueData.reduce((sum, item) => sum + item.transactionCount, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayData = revenueData.find(item => item.date === today);
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weekData = revenueData.filter(item => item.date >= weekAgo);
  
  return {
    totalRevenue,
    totalTransactions,
    todayRevenue: todayData?.revenue || 0,
    todayTransactions: todayData?.transactionCount || 0,
    weekRevenue: weekData.reduce((sum, item) => sum + item.revenue, 0),
    weekTransactions: weekData.reduce((sum, item) => sum + item.transactionCount, 0),
    monthRevenue: totalRevenue,
    monthTransactions: totalTransactions
  };
}

function processUserGrowth(data: any[]): any[] {
  const groupedByDate: { [key: string]: number } = {};
  
  data.forEach(user => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    groupedByDate[date] = (groupedByDate[date] || 0) + 1;
  });

  return Object.entries(groupedByDate).map(([date, newUsers]) => ({
    date,
    newUsers
  }));
}

function processActiveSubscriptions(data: any[]): any[] {
  const groupedByPlan: { [key: string]: { count: number; price: number; users: Set<string> } } = {};
  
  data.forEach(user => {
    user.subscriptions?.forEach((sub: any) => {
      if (sub.status === 'ACTIVE') {
        const planName = sub.subscription_plans?.name || 'Unknown';
        const price = parseFloat(sub.subscription_plans?.price || '0');
        
        if (!groupedByPlan[planName]) {
          groupedByPlan[planName] = { count: 0, price, users: new Set() };
        }
        groupedByPlan[planName].count += 1;
        groupedByPlan[planName].users.add(user.id);
      }
    });
  });

  return Object.entries(groupedByPlan).map(([planName, data]) => ({
    planName,
    planPrice: data.price,
    activeSubscriptions: data.count,
    uniqueUsers: data.users.size
  }));
}

function calculateUserSummary(data: any[]): any {
  const totalUsers = data.length;
  const activeUsers = data.filter(user => user.status === 'ACTIVE').length;
  const today = new Date().toISOString().split('T')[0];
  const todayUsers = data.filter(user => new Date(user.created_at).toISOString().split('T')[0] === today).length;
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekUsers = data.filter(user => new Date(user.created_at) >= weekAgo).length;
  
  return {
    totalUsers,
    activeUsers,
    todayUsers,
    weekUsers,
    monthUsers: totalUsers
  };
}

function processUserRoles(data: any[]): any[] {
  const roles: { [key: string]: number } = {};
  
  data.forEach(user => {
    roles[user.role] = (roles[user.role] || 0) + 1;
  });

  return Object.entries(roles).map(([role, count]) => ({
    role,
    count
  }));
}

function processAIUsageData(data: any[]): any[] {
  const groupedByDate: { [key: string]: any } = {};
  
  data.forEach(usage => {
    const date = new Date(usage.created_at).toISOString().split('T')[0];
    
    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        legalChatRequests: 0,
        iracAnalysisRequests: 0,
        documentGenerationRequests: 0,
        lawSearchRequests: 0,
        totalRequests: 0
      };
    }
    
    groupedByDate[date].totalRequests += usage.quantity || 1;
    
    switch (usage.feature) {
      case 'legal-chat':
        groupedByDate[date].legalChatRequests += usage.quantity || 1;
        break;
      case 'irac-analysis':
        groupedByDate[date].iracAnalysisRequests += usage.quantity || 1;
        break;
      case 'document-generation':
        groupedByDate[date].documentGenerationRequests += usage.quantity || 1;
        break;
      case 'law-search':
        groupedByDate[date].lawSearchRequests += usage.quantity || 1;
        break;
    }
  });

  return Object.entries(groupedByDate).map(([date, data]) => ({
    date,
    ...data
  }));
}

function processMostUsedFeatures(data: any[]): any[] {
  const features: { [key: string]: { totalUsage: number; users: Set<string> } } = {};
  
  data.forEach(usage => {
    if (!features[usage.feature]) {
      features[usage.feature] = { totalUsage: 0, users: new Set() };
    }
    features[usage.feature].totalUsage += usage.quantity || 1;
    if (usage.user_id) {
      features[usage.feature].users.add(usage.user_id);
    }
  });

  return Object.entries(features)
    .map(([feature, data]) => ({
      feature,
      totalUsage: data.totalUsage,
      uniqueUsers: data.users.size
    }))
    .sort((a, b) => b.totalUsage - a.totalUsage);
}

function calculateAIUsageSummary(data: any[]): any {
  const totalAIUsage = data.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalRequests = totalAIUsage;
  
  const today = new Date().toISOString().split('T')[0];
  const todayData = data.filter(item => new Date(item.created_at).toISOString().split('T')[0] === today);
  const todayAIUsage = todayData.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekData = data.filter(item => new Date(item.created_at) >= weekAgo);
  const weekAIUsage = weekData.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  return {
    totalAIUsage,
    totalRequests,
    todayAIUsage,
    todayRequests: todayAIUsage,
    weekAIUsage,
    weekRequests: weekAIUsage,
    monthAIUsage: totalAIUsage,
    monthRequests: totalRequests
  };
}

function processTopUsers(data: any[]): any[] {
  const users: { [key: string]: { totalUsage: number; features: Set<string>; email: string; firstName: string; lastName: string } } = {};
  
  data.forEach(usage => {
    if (usage.user_id) {
      if (!users[usage.user_id]) {
        users[usage.user_id] = { 
          totalUsage: 0, 
          features: new Set(), 
          email: usage.metadata?.email || 'Unknown',
          firstName: usage.metadata?.firstName || 'Unknown',
          lastName: usage.metadata?.lastName || 'Unknown'
        };
      }
      users[usage.user_id].totalUsage += usage.quantity || 1;
      users[usage.user_id].features.add(usage.feature);
    }
  });

  return Object.entries(users)
    .map(([id, data]) => ({
      id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      totalAIUsage: data.totalUsage,
      featuresUsed: data.features.size
    }))
    .sort((a, b) => b.totalAIUsage - a.totalAIUsage)
    .slice(0, 10);
}
