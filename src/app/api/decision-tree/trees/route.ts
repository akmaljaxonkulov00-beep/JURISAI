import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const case_type = searchParams.get('case_type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock decision trees
    const mockDecisionTrees = [
      {
        id: 'tree_1',
        title: 'Tijorat shartnomasi nizosi',
        case_type: 'civil',
        description: 'Shartnoma buzilishi bo\'yicha nizolarni hal qilish uchun qaror yo\'nalishi',
        complexity_level: 'medium',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T14:30:00Z',
        status: 'active',
        confidence_score: 88,
        total_nodes: 12,
        completed_nodes: 8,
        current_node: 'node_9',
        progress: 67,
        estimated_completion: '2024-01-17T16:00:00Z',
        outcomes: [
          {
            path: 'Qonuniy yo\'l',
            probability: 0.65,
            confidence: 0.88
          },
          {
            path: 'Tuzatish yo\'li',
            probability: 0.25,
            confidence: 0.72
          },
          {
            path: 'Arbitraj yo\'li',
            probability: 0.10,
            confidence: 0.65
          }
        ]
      },
      {
        id: 'tree_2',
        title: 'Ish haqi nizosi',
        case_type: 'labor',
        description: 'Ish haqi to\'lanmaganligi bo\'yicha nizolarni hal qilish',
        complexity_level: 'low',
        created_at: '2024-01-14T09:00:00Z',
        updated_at: '2024-01-14T17:20:00Z',
        status: 'completed',
        confidence_score: 92,
        total_nodes: 8,
        completed_nodes: 8,
        current_node: null,
        progress: 100,
        estimated_completion: '2024-01-14T17:20:00Z',
        outcomes: [
          {
            path: 'Ma\'muriy yo\'l',
            probability: 0.70,
            confidence: 0.85
          },
          {
            path: 'Sud yo\'li',
            probability: 0.30,
            confidence: 0.78
          }
        ]
      },
      {
        id: 'tree_3',
        title: 'Oilaviy mulk bo\'linishi',
        case_type: 'family',
        description: 'Ajralish paytida umumiy mulkning bo\'linishi masalasi',
        complexity_level: 'high',
        created_at: '2024-01-13T11:00:00Z',
        updated_at: '2024-01-15T09:15:00Z',
        status: 'active',
        confidence_score: 75,
        total_nodes: 15,
        completed_nodes: 6,
        current_node: 'node_7',
        progress: 40,
        estimated_completion: '2024-01-18T12:00:00Z',
        outcomes: [
          {
            path: 'Tinchlik yo\'li',
            probability: 0.45,
            confidence: 0.70
          },
          {
            path: 'Sud yo\'li',
            probability: 0.55,
            confidence: 0.68
          }
        ]
      },
      {
        id: 'tree_4',
        title: 'Ijaraga olish nizosi',
        case_type: 'property',
        description: 'Ijaraga olingan mulk bo\'yicha nizolarni hal qilish',
        complexity_level: 'medium',
        created_at: '2024-01-12T14:00:00Z',
        updated_at: '2024-01-12T18:45:00Z',
        status: 'completed',
        confidence_score: 85,
        total_nodes: 10,
        completed_nodes: 10,
        current_node: null,
        progress: 100,
        estimated_completion: '2024-01-12T18:45:00Z',
        outcomes: [
          {
            path: 'Shartnomani bekor qilish',
            probability: 0.60,
            confidence: 0.82
          },
          {
            path: 'Shartnomani o\'zgartirish',
            probability: 0.40,
            confidence: 0.78
          }
        ]
      },
      {
        id: 'tree_5',
        title: 'Qarz nizosi',
        case_type: 'financial',
        description: 'Qarz majburiyatlarini bajarish bo\'yicha nizolarni hal qilish',
        complexity_level: 'high',
        created_at: '2024-01-11T16:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        status: 'active',
        confidence_score: 78,
        total_nodes: 14,
        completed_nodes: 9,
        current_node: 'node_10',
        progress: 64,
        estimated_completion: '2024-01-17T15:00:00Z',
        outcomes: [
          {
            path: 'To\'lov rejasi',
            probability: 0.55,
            confidence: 0.75
          },
          {
            path: 'Sud yo\'li',
            probability: 0.35,
            confidence: 0.70
          },
          {
            path: 'Bankrotlik',
            probability: 0.10,
            confidence: 0.60
          }
        ]
      }
    ];

    // Filter by case type if provided
    let filteredTrees = mockDecisionTrees;
    if (case_type) {
      filteredTrees = mockDecisionTrees.filter(tree => tree.case_type === case_type);
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedTrees = filteredTrees.slice(startIndex, endIndex);

    return NextResponse.json({
      trees: paginatedTrees,
      pagination: {
        total: filteredTrees.length,
        limit: limit,
        offset: offset,
        has_more: endIndex < filteredTrees.length
      },
      filters: {
        case_type: case_type
      },
      summary: {
        total_trees: filteredTrees.length,
        active_trees: filteredTrees.filter(t => t.status === 'active').length,
        completed_trees: filteredTrees.filter(t => t.status === 'completed').length,
        average_confidence: Math.round(filteredTrees.reduce((sum, t) => sum + t.confidence_score, 0) / filteredTrees.length)
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Decision trees get error:', error);
    return NextResponse.json(
      { error: 'Qaror daraxtlarini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
