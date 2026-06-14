import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, processedBy } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment details first
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError) throw fetchError;

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        processed_by: processedBy
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    // Update user subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    await supabase
      .from('users')
      .update({
        subscription_plan: payment.plan_id,
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('id', payment.user_id);

    // Add to subscription history
    await supabase
      .from('subscription_history')
      .insert({
        id: crypto.randomUUID(),
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        plan_name: payment.plan_name,
        plan_price: payment.plan_price,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: paymentId
      });

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      data
    });

  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
