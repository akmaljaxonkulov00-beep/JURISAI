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

    // Get payments data from Supabase
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'approved')
      .gte('submitted_at', startDate.toISOString())
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    // Mock revenue data based on payments
    const revenueData = generateMockRevenueData(startDate, period, payments || []);
    const summary = generateMockSummary(payments || [], now);
    const revenueByPlan = generateMockRevenueByPlan(payments || []);

    return NextResponse.json({
      revenueData,
      summary,
      revenueByPlan,
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { error: 'Analitikani olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function generateMockRevenueData(startDate: Date, period: string, payments: any[]) {
  const data = [];
  const days = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayPayments = payments.filter(p => 
      p.submitted_at.startsWith(dateStr)
    );
    
    data.push({
      date: dateStr,
      revenue: dayPayments.reduce((sum, p) => sum + (p.plan_price || 0), 0),
      transactionCount: dayPayments.length
    });
  }
  
  return data;
}

function generateMockSummary(payments: any[], now: Date) {
  const todayStr = now.toISOString().split('T')[0];
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const todayPayments = payments.filter(p => p.submitted_at.startsWith(todayStr));
  const weekPayments = payments.filter(p => new Date(p.submitted_at) >= weekStart);
  const monthPayments = payments.filter(p => new Date(p.submitted_at) >= monthStart);
  
  return {
    totalRevenue: payments.reduce((sum, p) => sum + (p.plan_price || 0), 0),
    totalTransactions: payments.length,
    todayRevenue: todayPayments.reduce((sum, p) => sum + (p.plan_price || 0), 0),
    todayTransactions: todayPayments.length,
    weekRevenue: weekPayments.reduce((sum, p) => sum + (p.plan_price || 0), 0),
    weekTransactions: weekPayments.length,
    monthRevenue: monthPayments.reduce((sum, p) => sum + (p.plan_price || 0), 0),
    monthTransactions: monthPayments.length,
  };
}

function generateMockRevenueByPlan(payments: any[]) {
  const plans = ['basic', 'pro', 'premium'];
  const planPrices = { basic: 49000, pro: 99000, premium: 199000 };
  
  return plans.map(plan => {
    const planPayments = payments.filter(p => p.plan_id === plan);
    return {
      planName: plan.charAt(0).toUpperCase() + plan.slice(1),
      planPrice: planPrices[plan as keyof typeof planPrices],
      subscriptionCount: planPayments.length,
      totalRevenue: planPayments.reduce((sum, p) => sum + (p.plan_price || 0), 0)
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}
