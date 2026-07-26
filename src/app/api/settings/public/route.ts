import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      // Fallback: return empty — frontend will use localStorage fallback
      return NextResponse.json({ success: true, data: null, source: 'fallback' });
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('payment_card_number, payment_details, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Public settings load error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Map snake_case to camelCase for frontend
    const mapped = data ? {
      paymentCardNumber: data.payment_card_number || '',
      paymentDetails: data.payment_details || '',
      updatedAt: data.updated_at,
    } : null;

    return NextResponse.json({ success: true, data: mapped, source: 'supabase' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
