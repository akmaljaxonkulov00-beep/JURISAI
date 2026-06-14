import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Session ID talab qilinadi' },
        { status: 400 }
      );
    }

    // Get simulation from database
    const { data, error } = await supabase
      .from('court_simulations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Court session get error:', error);
      // Fallback to mock response
      return NextResponse.json({
        simulation_id: id,
        status: 'active',
        current_phase: 'arguments',
        elapsed_time: 300,
        remaining_time: 1500,
        participants: {
          plaintiff: { name: 'Ali Valiyev', role: 'Plaintiff' },
          defendant: { name: 'Dilnoza Karimova', role: 'Defendant' },
          judge: { name: 'Sudya', role: 'Judge' }
        },
        current_speaker: 'defendant',
        last_action: 'Argument submitted'
      });
    }

    return NextResponse.json({
      simulation_id: data.id,
      status: data.status,
      current_phase: data.current_phase,
      elapsed_time: data.elapsed_time,
      remaining_time: data.remaining_time,
      participants: {
        plaintiff: { name: 'Ali Valiyev', role: 'Plaintiff' },
        defendant: { name: 'Dilnoza Karimova', role: 'Defendant' },
        judge: { name: 'Sudya', role: 'Judge' }
      },
      current_speaker: 'plaintiff',
      last_action: data.last_action || 'Session retrieved'
    });

  } catch (error) {
    console.error('Court session get error:', error);
    return NextResponse.json(
      { error: 'Sessiyani olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
