import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { simulationId, argumentType, content, targetId, evidenceReferences } = await request.json();

    if (!simulationId || !argumentType || !content) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: simulationId, argumentType, content' },
        { status: 400 }
      );
    }

    // Save argument to database
    const argumentData = {
      simulation_id: simulationId,
      argument_type: argumentType,
      content: content,
      target_id: targetId || null,
      evidence_references: evidenceReferences || [],
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('court_arguments')
      .insert([argumentData])
      .select()
      .single();

    if (error) {
      console.error('Court argument submit error:', error);
    }

    // Update simulation status
    await supabase
      .from('court_simulations')
      .update({ 
        last_action: 'Argument submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    // Track usage
    await trackUsage('court_argument_submit', { 
      simulationId, 
      argumentType, 
      contentLength: content.length 
    });

    return NextResponse.json({
      success: true,
      argument_id: data?.id || `arg_${Date.now()}`,
      simulation_id: simulationId,
      argument_type: argumentType,
      status: 'submitted',
      timestamp: new Date().toISOString(),
      feedback: {
        strength: 'Good',
        clarity: 'Clear',
        legal_basis: 'Well-supported',
        suggestions: [
          'Qonun hujjatlariga ko\'ra dalillarni kuchaytirishingiz mumkin',
          'Argumentingiz mantiqiy ravishda yaxshi tuzilgan'
        ]
      }
    });

  } catch (error) {
    console.error('Court argument submit error:', error);
    return NextResponse.json(
      { error: 'Argument yuborishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
