import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { node_id, decision, confidence } = await request.json();

    if (!id || !node_id || !decision) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: tree_id, node_id, decision' },
        { status: 400 }
      );
    }

    // Mock decision tree update
    const mockUpdate = {
      tree_id: id,
      node_id: node_id,
      decision: decision,
      confidence: confidence || 0.8,
      updated_at: new Date().toISOString(),
      previous_state: {
        decision: 'Old decision',
        confidence: 0.7,
        updated_at: '2024-01-14T10:30:00Z'
      },
      impact_analysis: {
        path_changes: [
          {
            path: 'Path A - Qonuniy yo\'l',
            old_probability: 0.65,
            new_probability: 0.70,
            change: '+0.05'
          },
          {
            path: 'Path B - Tuzatish yo\'li',
            old_probability: 0.25,
            new_probability: 0.20,
            change: '-0.05'
          }
        ],
        overall_confidence: {
          old_confidence: 0.82,
          new_confidence: 0.85,
          change: '+0.03'
        },
        risk_assessment: {
          old_risk_level: 'medium',
          new_risk_level: 'low',
          change: 'improved'
        }
      },
      recommendations: [
        'Yangi qaror asosida dalillarni mustahkamlang',
        'Qonuniy asoslarni qayta tekshiring',
        'Xavf omillarini baholashni yangilang'
      ],
      next_nodes: [
        {
          node_id: 'node_2',
          title: 'Dalillarni to\'plash',
          description: 'Yangi qaror asosida kerakli dalillarni yig\'ish',
          estimated_time: '1-2 hafta',
          priority: 'high'
        },
        {
          node_id: 'node_3',
          title: 'Huquqiy maslahat',
          description: 'Advokat bilan maslahat olish',
          estimated_time: '3-5 kun',
          priority: 'medium'
        }
      ]
    };

    // Save update to database
    const { data, error } = await supabase
      .from('decision_tree_updates')
      .insert([{
        tree_id: id,
        node_id: node_id,
        decision: decision,
        confidence: confidence || 0.8,
        update_data: mockUpdate,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Decision tree update error:', error);
    }

    // Track usage
    await trackUsage('decision_tree_update', { 
      tree_id: id,
      node_id: node_id,
      confidence: confidence || 0.8
    });

    return NextResponse.json({
      success: true,
      update_id: data?.id || `update_${Date.now()}`,
      tree_id: id,
      node_id: node_id,
      decision: decision,
      confidence: confidence || 0.8,
      impact_analysis: mockUpdate.impact_analysis,
      recommendations: mockUpdate.recommendations,
      next_nodes: mockUpdate.next_nodes,
      message: 'Qaror daraxti muvaffaqiyatli yangilandi',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Decision tree update error:', error);
    return NextResponse.json(
      { error: 'Qaror daraxtni yangilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
