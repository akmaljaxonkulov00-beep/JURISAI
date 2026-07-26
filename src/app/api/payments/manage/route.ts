import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, action, reason } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, error: 'paymentId and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' });
    }

    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      console.error('[Payment Manage] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError?.message || 'Payment not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      // Update payment status to approved
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          updated_at: now,
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('[Payment Manage] Update error:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // Update or create user profile with subscription
      const subscriptionPlan = payment.plan === 'pro' ? 'pro' : 'standart';
      const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();

      // Try to update registered_users table (add to existing balance)
      // First, get current balance
      let currentBalance = 0;
      try {
        const { data: existingUser } = await supabase
          .from('registered_users')
          .select('balance')
          .eq('id', payment.user_id || payment.user_email)
          .single();
        if (existingUser && existingUser.balance) {
          currentBalance = Number(existingUser.balance);
        }
      } catch {}
      
      const { error: profileError } = await supabase
        .from('registered_users')
        .upsert({
          id: payment.user_id || payment.user_email,
          email: payment.user_email,
          name: payment.user_name || '',
          subscription_plan: subscriptionPlan,
          subscription_expires_at: expiresAt,
          updated_at: now,
          balance: currentBalance + payment.amount,
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.warn('[Payment Manage] Profile upsert error:', profileError);
        // Non-fatal — Supabase table may not exist
      }

      // Log to usage_logs
      try {
        await supabase.from('usage_logs').insert({
          user_id: payment.user_email,
          email: payment.user_email,
          action: 'payment_approved',
          tokens: 0,
          created_at: now,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        data: {
          status: 'approved',
          plan: subscriptionPlan,
          expiresAt,
        },
      });
    } else {
      // REJECT
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          reject_reason: reason || '',
          updated_at: now,
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('[Payment Manage] Reject error:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: { status: 'rejected' } });
    }
  } catch (error: any) {
    console.error('[Payment Manage] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Payment management failed' },
      { status: 500 }
    );
  }
}
