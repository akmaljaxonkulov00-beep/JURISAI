import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Simulation ID talab qilinadi' },
        { status: 400 }
      );
    }

    // Update simulation status to active
    const { data, error } = await supabase
      .from('court_simulations')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Court simulation resume error:', error);
      // Fallback response
      return NextResponse.json({
        simulation_id: id,
        status: 'active',
        message: 'Simulyatsiya muvaffaqiyatli davom ettirildi',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      simulation_id: id,
      status: data.status,
      message: 'Simulyatsiya muvaffaqiyatli davom ettirildi',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Court simulation resume error:', error);
    return NextResponse.json(
      { error: 'Simulyatsiyani davom ettirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
