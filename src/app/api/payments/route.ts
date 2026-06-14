import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = supabase
      .from('payments')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('submitted_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { payments, total: payments?.length || 0 }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, planName, planPrice, checkImage } = body;

    if (!userId || !planId || !checkImage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        plan_id: planId,
        plan_name: planName,
        plan_price: planPrice,
        status: 'pending',
        check_image: checkImage
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
