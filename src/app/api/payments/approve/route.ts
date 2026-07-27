import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/approve
 * 
 * Admin tomonidan to'lovni tasdiqlash.
 * payment_requests jadvalidagi statusni 'approved' ga o'zgartiradi
 * va foydalanuvchi balansiga summani qo'shadi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try payment_requests first (table from admin migration)
    let payment: any = null;
    const { data: prData } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (prData) {
      payment = prData;
      // Update status in payment_requests
      await supabase
        .from('payment_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      // Update user balance in registered_users
      if (payment.user_id) {
        // Fetch current balance first
        const { data: userData } = await supabase
          .from('registered_users')
          .select('balance')
          .eq('id', payment.user_id)
          .maybeSingle();
        
        const currentBalance = Number(userData?.balance || 0);
        const newBalance = currentBalance + Number(payment.amount || 0);
        
        await supabase
          .from('registered_users')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.user_id);
      }

      return NextResponse.json({
        success: true,
        message: 'To\'lov tasdiqlandi',
        payment: payment,
      });
    }

    // Fallback: try 'payments' table (legacy)
    const { data: legacyPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (legacyPayment) {
      await supabase
        .from('payments')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      // Update user subscription in users table
      if (legacyPayment.user_id) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await supabase
          .from('users')
          .update({
            subscription_plan: legacyPayment.plan || legacyPayment.plan_id,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq('id', legacyPayment.user_id);
      }

      return NextResponse.json({
        success: true,
        message: 'To\'lov tasdiqlandi',
        payment: legacyPayment,
      });
    }

    return NextResponse.json(
      { success: false, error: 'To\'lov topilmadi' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'To\'lovni tasdiqlashda xatolik' },
      { status: 500 }
    );
  }
}
