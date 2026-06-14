import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

function getDemoAnalytics() {
  return {
    revenue: {
      total: 2500000,
      growth: 15.3,
      byMonth: [
        { month: 'Yan', revenue: 800000 },
        { month: 'Fev', revenue: 950000 },
        { month: 'Mar', revenue: 750000 },
      ]
    },
    users: {
      total: 1247,
      active: 892,
      growth: 23.5,
      byPlan: {
        free: 856,
        pro: 342,
        enterprise: 49
      }
    },
    usage: {
      totalRequests: 15678,
      averageDaily: 523,
      growth: 18.2,
      byFeature: {
        'ai-chat': 8923,
        'document-gen': 4567,
        'case-analysis': 2188
      }
    },
    systemHealth: {
      uptime: 99.9,
      responseTime: 234,
      errorRate: 0.02
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    // Always return demo data for now until database is fully set up
    return NextResponse.json(getDemoAnalytics());
  } catch (error) {
    console.error('Analytics API unexpected error:', error);
    return NextResponse.json(getDemoAnalytics());
  }
}
