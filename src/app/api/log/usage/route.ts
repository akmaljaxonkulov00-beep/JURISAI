import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, tokens, action, metadata } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      // Supabase not configured - silently skip logging
      return NextResponse.json({ success: true, note: 'Supabase not configured' });
    }

    const { error } = await supabase.from('usage_logs').insert({
      user_id: userId || email,
      email,
      name: name || '',
      tokens: tokens || 1,
      action: action || 'unknown',
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Usage log insert error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Usage logging API error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Logging failed' }, { status: 500 });
  }
}
