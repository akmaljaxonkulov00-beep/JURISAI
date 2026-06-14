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

    // Get users data from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get all users for summary stats
    const { data: allUsers } = await supabase
      .from('users')
      .select('*');

    // Generate mock analytics data
    const userGrowth = generateMockUserGrowth(startDate, users || []);
    const activeSubscriptions = generateMockActiveSubscriptions();
    const summary = generateMockUserSummary(allUsers || [], now);
    const lastUsers = generateMockLastUsers(allUsers || []);
    const userRoles = generateMockUserRoles(allUsers || []);

    return NextResponse.json({
      userGrowth,
      activeSubscriptions,
      summary,
      lastUsers,
      userRoles,
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('User analytics error:', error);
    return NextResponse.json(
      { error: 'Analitikani olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function generateMockUserGrowth(startDate: Date, users: any[]) {
  const data = [];
  const days = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayUsers = users.filter(u => 
      u.created_at.startsWith(dateStr)
    );
    
    data.push({
      date: dateStr,
      newUsers: dayUsers.length
    });
  }
  
  return data;
}

function generateMockActiveSubscriptions() {
  const plans = [
    { name: 'Basic', price: 49000, activeSubscriptions: 45, uniqueUsers: 45 },
    { name: 'Pro', price: 99000, activeSubscriptions: 28, uniqueUsers: 28 },
    { name: 'Premium', price: 199000, activeSubscriptions: 12, uniqueUsers: 12 }
  ];
  
  return plans.map(plan => ({
    planName: plan.name,
    planPrice: plan.price,
    activeSubscriptions: plan.activeSubscriptions,
    uniqueUsers: plan.uniqueUsers
  }));
}

function generateMockUserSummary(users: any[], now: Date) {
  const todayStr = now.toISOString().split('T')[0];
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const todayUsers = users.filter(u => u.created_at.startsWith(todayStr));
  const weekUsers = users.filter(u => new Date(u.created_at) >= weekStart);
  const monthUsers = users.filter(u => new Date(u.created_at) >= monthStart);
  const activeUsers = users.filter(u => u.subscription_expires_at && new Date(u.subscription_expires_at) > now);
  
  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    todayUsers: todayUsers.length,
    weekUsers: weekUsers.length,
    monthUsers: monthUsers.length,
  };
}

function generateMockLastUsers(users: any[]) {
  return users
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ')[1] || '',
      role: user.role,
      status: 'ACTIVE',
      createdAt: user.created_at,
      subscription: user.subscription_plan ? {
        planName: user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1),
        status: user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date() ? 'ACTIVE' : 'EXPIRED',
        currentPeriodEnd: user.subscription_expires_at
      } : null,
    }));
}

function generateMockUserRoles(users: any[]) {
  const roles = ['USER', 'ADMIN'];
  return roles.map(role => ({
    role,
    count: users.filter(u => u.role === role).length
  }));
}
