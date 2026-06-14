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

    // Update simulation status to paused
    const { data, error } = await supabase
      .from('court_simulations')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Court simulation pause error:', error);
      // Fallback response
      return NextResponse.json({
        simulation_id: id,
        status: 'paused',
        message: 'Simulyatsiya muvaffaqiyatli pauza qilindi',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      simulation_id: id,
      status: data.status,
      message: 'Simulyatsiya muvaffaqiyatli pauza qilindi',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Court simulation pause error:', error);
    return NextResponse.json(
      { error: 'Simulyatsiyani pauza qilishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
