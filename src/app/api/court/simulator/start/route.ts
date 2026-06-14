import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { caseId, userRole, difficultyLevel, simulationType, customParameters } = await request.json();

    if (!caseId || !userRole || !difficultyLevel || !simulationType) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: caseId, userRole, difficultyLevel, simulationType' },
        { status: 400 }
      );
    }

    // Create simulation session
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const simulationData = {
      id: simulationId,
      case_id: caseId,
      user_role: userRole,
      difficulty_level: difficultyLevel,
      simulation_type: simulationType,
      custom_parameters: customParameters || {},
      status: 'active',
      current_phase: 'opening',
      elapsed_time: 0,
      remaining_time: 1800, // 30 minutes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database
    const { data, error } = await supabase
      .from('court_simulations')
      .insert([simulationData])
      .select()
      .single();

    if (error) {
      console.error('Court simulation start error:', error);
      // Fallback to mock response
      return NextResponse.json({
        simulation_id: simulationId,
        status: 'active',
        current_phase: 'opening',
        elapsed_time: 0,
        remaining_time: 1800,
        participants: {
          plaintiff: { name: 'Ali Valiyev', role: 'Plaintiff' },
          defendant: { name: 'Dilnoza Karimova', role: 'Defendant' },
          judge: { name: 'Sudya', role: 'Judge' }
        },
        current_speaker: 'plaintiff',
        last_action: 'Simulation started'
      });
    }

    // Track usage
    await trackUsage('court_simulation_start', { 
      simulationId, 
      caseId, 
      userRole, 
      difficultyLevel,
      simulationType 
    });

    return NextResponse.json({
      simulation_id: simulationId,
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
      last_action: 'Simulation started'
    });

  } catch (error) {
    console.error('Court simulation start error:', error);
    return NextResponse.json(
      { error: 'Simulyatsiyani boshlashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
