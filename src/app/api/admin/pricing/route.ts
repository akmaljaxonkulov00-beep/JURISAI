import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plans } = body;

    if (!plans || !Array.isArray(plans)) {
      return NextResponse.json({ success: false, error: 'Plans array is required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' });
    }

    // Delete existing plans and re-insert
    const { error: deleteError } = await supabase
      .from('pricing_plans')
      .delete()
      .neq('id', 'nonexistent'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('[Admin Pricing] Delete error:', deleteError);
    }

    // Insert updated plans
    const plansToInsert = plans.map((plan: any, idx: number) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features || [],
      case_limit: plan.caseLimit || plan.case_limit || -1,
      sort_order: idx,
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('pricing_plans')
      .upsert(plansToInsert, { onConflict: 'id' });

    if (insertError) {
      console.error('[Admin Pricing] Insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { count: plans.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
