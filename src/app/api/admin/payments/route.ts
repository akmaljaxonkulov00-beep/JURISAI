import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Payments API
 * Handles payment approval/rejection and listing
 */

async function getSupabaseAdmin() {
  // Dynamic import to avoid build issues
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected
    
    if (!supabase) {
      // Fallback: return from localStorage-based storage
      return NextResponse.json({
        success: true,
        payments: [],
        source: 'fallback',
        message: 'Supabase mavjud emas',
      });
    }

    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // Try alternative table names
      const altQuery = supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        altQuery.eq('status', status);
      }
      
      const { data: altData, error: altError } = await altQuery;
      
      if (altError) {
        return NextResponse.json({
          success: true,
          payments: [],
          source: 'empty',
          message: 'To\'lov jadvallari mavjud emas',
        });
      }
      
      return NextResponse.json({
        success: true,
        payments: altData || [],
        source: 'payment_requests',
      });
    }

    return NextResponse.json({
      success: true,
      payments: data || [],
      source: 'payments',
    });
  } catch (error: any) {
    console.error('Admin payments API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, action, userId, amount } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, error: 'paymentId va action talab qilinadi' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase mavjud emas' },
        { status: 503 }
      );
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    // Update payment status
    let updateResult = await supabase
      .from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    if (updateResult.error) {
      // Try alternative table
      updateResult = await supabase
        .from('payment_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', paymentId);
    }

    // If approved and we have user info, update balance
    if (action === 'approve' && userId && amount) {
      const balanceUpdate = await supabase.rpc('add_to_balance', {
        p_user_id: userId,
        p_amount: amount,
      });
      
      if (balanceUpdate.error) {
        // Try direct update on profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
        
        if (profile) {
          const currentBalance = Number(profile.balance || 0);
          await supabase
            .from('profiles')
            .update({ balance: currentBalance + Number(amount || 0) })
            .eq('id', userId);
        }
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Admin payments PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
