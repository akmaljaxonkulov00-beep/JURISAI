import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, notes, processedBy } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: processedBy,
        notes: notes || 'Payment rejected by admin'
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      data
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
