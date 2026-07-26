import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' });
    }

    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Pricing Public] Error:', error);
      return NextResponse.json({ success: false, error: error.message });
    }

    // Transform snake_case to camelCase
    const plans = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      features: p.features || [],
      caseLimit: p.case_limit || p.caseLimit || -1,
    }));

    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
