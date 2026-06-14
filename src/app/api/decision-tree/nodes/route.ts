import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario');
    const tree_id = searchParams.get('tree_id');

    // Mock decision tree nodes
    const mockNodes = [
      {
        id: 'node_1',
        title: 'Boshlang\'ich holatni aniqlash',
        description: 'Nizoning asosiy holatini va shart-sharoitlarini aniqlash',
        type: 'start',
        tree_id: 'tree_1',
        position: { x: 100, y: 50 },
        decisions: [
          {
            decision: 'Shartnoma mavjud',
            next_node: 'node_2',
            confidence: 0.95
          },
          {
            decision: 'Shartnoma mavjud emas',
            next_node: 'node_3',
            confidence: 0.85
          }
        ],
        legal_basis: ['O\'zbekiston FK 350-modda'],
        estimated_time: '15-30 daqiqa',
        priority: 'high',
        status: 'completed'
      },
      {
        id: 'node_2',
        title: 'Shartnoma shartlarini tekshirish',
        description: 'Shartnomaning to\'liq bajarilishi va buzilish holatlarini tekshirish',
        type: 'analysis',
        tree_id: 'tree_1',
        position: { x: 250, y: 150 },
        decisions: [
          {
            decision: 'Shartnoma to\'liq bajarilmagan',
            next_node: 'node_4',
            confidence: 0.88
          },
          {
            decision: 'Shartnoma qisman bajarilgan',
            next_node: 'node_5',
            confidence: 0.75
          },
          {
            decision: 'Shartnoma to\'liq bajarilgan',
            next_node: 'node_6',
            confidence: 0.65
          }
        ],
        legal_basis: ['O\'zbekiston FK 367-modda'],
        estimated_time: '30-45 daqiqa',
        priority: 'high',
        status: 'completed'
      },
      {
        id: 'node_3',
        title: 'Og\'zaki kelishuvni tekshirish',
        description: 'Og\'zaki kelishuvning mavjudligi va qonuniyligini tekshirish',
        type: 'analysis',
        tree_id: 'tree_1',
        position: { x: 250, y: 250 },
        decisions: [
          {
            decision: 'Og\'zaki kelishuv mavjud',
            next_node: 'node_7',
            confidence: 0.80
          },
          {
            decision: 'Og\'zaki kelishuv mavjud emas',
            next_node: 'node_8',
            confidence: 0.90
          }
        ],
        legal_basis: ['O\'zbekiston FK 6-modda'],
        estimated_time: '20-30 daqiqa',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'node_4',
        title: 'Zararni hisoblash',
        description: 'Shartnomani buzish oqibatida yetkazilgan zararni hisoblash',
        type: 'calculation',
        tree_id: 'tree_1',
        position: { x: 400, y: 200 },
        decisions: [
          {
            decision: 'To\'g\'ri hisoblangan zarar',
            next_node: 'node_9',
            confidence: 0.92
          },
          {
            decision: 'Zarar hisoblashda xatolik',
            next_node: 'node_10',
            confidence: 0.70
          }
        ],
        legal_basis: ['O\'zbekiston FK 367-modda'],
        estimated_time: '45-60 daqiqa',
        priority: 'high',
        status: 'in_progress'
      },
      {
        id: 'node_5',
        title: 'Qisman bajarilmaganlikni aniqlash',
        description: 'Qaysi shartlarning bajarilmaganligini aniqlash',
        type: 'analysis',
        tree_id: 'tree_1',
        position: { x: 400, y: 300 },
        decisions: [
          {
            decision: 'Muhim shartlar bajarilmagan',
            next_node: 'node_4',
            confidence: 0.85
          },
          {
            decision: 'Ikkinchi darajali shartlar bajarilmagan',
            next_node: 'node_11',
            confidence: 0.75
          }
        ],
        legal_basis: ['O\'zbekiston FK 350-modda'],
        estimated_time: '30-45 daqiqa',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'node_6',
        title: 'Qo\'shimcha majburiyatlarni tekshirish',
        description: 'Shartnomadan tashqari qo\'shimcha majburiyatlarni tekshirish',
        type: 'analysis',
        tree_id: 'tree_1',
        position: { x: 400, y: 400 },
        decisions: [
          {
            decision: 'Qo\'shimcha majburiyatlar mavjud',
            next_node: 'node_12',
            confidence: 0.78
          },
          {
            decision: 'Qo\'shimcha majburiyatlar mavjud emas',
            next_node: 'node_13',
            confidence: 0.88
          }
        ],
        legal_basis: ['O\'zbekiston FK 6-modda'],
        estimated_time: '20-30 daqiqa',
        priority: 'low',
        status: 'pending'
      },
      {
        id: 'node_7',
        title: 'Kelishuvni qonuniylashtirish',
        description: 'Og\'zaki kelishuvni yozma shaklda rasmiylashtirish',
        type: 'action',
        tree_id: 'tree_1',
        position: { x: 400, y: 250 },
        decisions: [
          {
            decision: 'Kelishuv rasmiylashtirildi',
            next_node: 'node_14',
            confidence: 0.85
          },
          {
            decision: 'Kelishuv rasmiylashtirilmadi',
            next_node: 'node_2',
            confidence: 0.70
          }
        ],
        legal_basis: ['O\'zbekiston FK 6-modda'],
        estimated_time: '15-30 daqiqa',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'node_8',
        title: 'Dalillarni yig\'ish',
        description: 'Nizoni hal qilish uchun kerakli dalillarni yig\'ish',
        type: 'action',
        tree_id: 'tree_1',
        position: { x: 400, y: 350 },
        decisions: [
          {
            decision: 'Dalillar yetarli',
            next_node: 'node_2',
            confidence: 0.80
          },
          {
            decision: 'Dalillar yetarli emas',
            next_node: 'node_15',
            confidence: 0.75
          }
        ],
        legal_basis: ['O\'zbekiston FPK 166-modda'],
        estimated_time: '1-2 hafta',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'node_9',
        title: 'Da\'vo talabini shakllantirish',
        description: 'Hisoblangan zarar asosida da\'vo talabini shakllantirish',
        type: 'action',
        tree_id: 'tree_1',
        position: { x: 550, y: 200 },
        decisions: [
          {
            decision: 'Da\'vo talabi shakllantirildi',
            next_node: 'node_16',
            confidence: 0.90
          },
          {
            decision: 'Da\'vo talabini qayta ko\'rib chiqish',
            next_node: 'node_4',
            confidence: 0.75
          }
        ],
        legal_basis: ['O\'zbekiston FPK 285-modda'],
        estimated_time: '30-45 daqiqa',
        priority: 'high',
        status: 'pending'
      }
    ];

    // Filter nodes by scenario or tree_id if provided
    let filteredNodes = mockNodes;
    if (scenario) {
      filteredNodes = mockNodes.filter(node => node.tree_id === scenario);
    }
    if (tree_id) {
      filteredNodes = mockNodes.filter(node => node.tree_id === tree_id);
    }

    return NextResponse.json({
      nodes: filteredNodes,
      total_nodes: filteredNodes.length,
      filters: {
        scenario: scenario,
        tree_id: tree_id
      },
      summary: {
        start_nodes: filteredNodes.filter(n => n.type === 'start').length,
        analysis_nodes: filteredNodes.filter(n => n.type === 'analysis').length,
        action_nodes: filteredNodes.filter(n => n.type === 'action').length,
        calculation_nodes: filteredNodes.filter(n => n.type === 'calculation').length,
        completed_nodes: filteredNodes.filter(n => n.status === 'completed').length,
        pending_nodes: filteredNodes.filter(n => n.status === 'pending').length,
        in_progress_nodes: filteredNodes.filter(n => n.status === 'in_progress').length
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Decision tree nodes get error:', error);
    return NextResponse.json(
      { error: 'Qaror daraxti tugunlarini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
