import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

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

    // Generate mock results
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    const outcome = Math.random() > 0.5 ? 'Victory' : 'Defeat';
    
    const mockResult = {
      score: score,
      outcome: outcome,
      feedback: {
        argument_quality: score > 85 ? 'Excellent' : score > 70 ? 'Good' : 'Needs Improvement',
        evidence_usage: score > 80 ? 'Strong' : score > 65 ? 'Adequate' : 'Weak',
        legal_knowledge: score > 75 ? 'Very Good' : score > 60 ? 'Good' : 'Basic',
        overall_performance: score > 90 ? 'Outstanding' : score > 75 ? 'Good' : 'Fair'
      },
      performance_metrics: {
        argument_strength: Math.floor(Math.random() * 20) + 80,
        evidence_relevance: Math.floor(Math.random() * 15) + 85,
        legal_accuracy: Math.floor(Math.random() * 25) + 75,
        time_management: Math.floor(Math.random() * 10) + 90
      },
      recommendations: [
        'Qonun hujjatlarini chuqurroq o\'rganing',
        'Dalillarni samaraliroq taqdim eting',
        'Argumentlarni mantiqiy ravishda tuzing'
      ]
    };

    // Update simulation status to completed
    const { data, error } = await supabase
      .from('court_simulations')
      .update({ 
        status: 'completed',
        score: score,
        outcome: outcome,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Court simulation end error:', error);
    }

    // Track usage
    await trackUsage('court_simulation_end', { 
      simulationId: id, 
      score: score,
      outcome: outcome 
    });

    return NextResponse.json({
      simulation_id: id,
      status: 'completed',
      result: mockResult,
      message: `Simulyatsiya tugatildi! Ball: ${score}, Natija: ${outcome}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Court simulation end error:', error);
    return NextResponse.json(
      { error: 'Simulyatsiyani tugatishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
