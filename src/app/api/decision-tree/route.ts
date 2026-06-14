import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, scenario_title, scenario_description, case_type, tree_id, node_id, decision } = body;

    switch (action) {
      case 'create':
        return await createDecisionTree(scenario_title, scenario_description, case_type);
      case 'update':
        return await updateDecisionTree(tree_id, node_id, decision);
      case 'get_trees':
        return await getDecisionTrees();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Decision tree API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createDecisionTree(
  scenario_title: string, 
  scenario_description: string, 
  case_type: string
) {
  try {
    // Use AI to generate decision tree
    const prompt = `
Quyidagi yuridik vaziyat uchun qaror daraxti yarating:

Sarlavha: ${scenario_title}
Tavsif: ${scenario_description}
Ish turi: ${case_type}

3-4 ta qaror tugunlarini yarating. Har bir tugun uchun:
1. Tugun nomi
2. Batafsil tavsifi
3. 2-3 ta variant (har biri keyingi tugunga olib boradi)
4. Xavf darajasi (low, medium, high)

Format:
TUGUN 1: [nomi]
Tavsif: [tavsif]
Variantlar:
- [variant 1]
- [variant 2]
Xavf: [xavf darajasi]

---

TUGUN 2: ...
`;

    const response = await aiClient.chatMessage(prompt, 'Qaror daraxti generatori');

    // Parse AI response
    const lines = response.text.split('\n');
    const nodes: any[] = [];
    let currentNode: any = null;

    for (const line of lines) {
      if (line.startsWith('TUGUN')) {
        if (currentNode) nodes.push(currentNode);
        const title = line.split(':')[1]?.trim() || 'Tugun';
        currentNode = {
          id: 'node_' + (nodes.length + 1),
          title,
          description: '',
          type: nodes.length === 0 ? 'start' : 'decision',
          options: [],
          risk_level: 'medium'
        };
      } else if (line.startsWith('Tavsif:') && currentNode) {
        currentNode.description = line.split(':')[1]?.trim() || '';
      } else if (line.startsWith('- ') && currentNode) {
        const optText = line.substring(2).trim();
        currentNode.options.push({
          id: 'opt_' + (currentNode.options.length + 1),
          text: optText,
          next: 'node_' + (nodes.length + 2)
        });
      } else if (line.startsWith('Xavf:') && currentNode) {
        const risk = line.split(':')[1]?.trim().toLowerCase() || 'medium';
        currentNode.risk_level = risk;
      }
    }
    if (currentNode) nodes.push(currentNode);

    // Generate edges
    const edges = nodes.flatMap((node, idx) => 
      node.options.map((opt: any) => ({
        from: node.id,
        to: opt.next,
        condition: opt.text
      }))
    );

    const tree = {
      id: 'tree_' + Date.now(),
      scenario_title,
      scenario_description,
      tree_data: {
        template_type: 'legal_decision',
        nodes,
        edges,
        case_type,
        legal_framework: { framework: `${case_type} law` }
      },
      current_node: nodes[0]?.id || 'node_1',
      path_taken: [],
      final_decision: null,
      confidence_score: 0.85,
      risk_assessment: {
        overall_risk: 'medium',
        legal_risks: ['Qonun buzilishi', 'Sud jarayoni'],
        financial_risks: ['Moliyaviy yo\'qotish', 'Jarima'],
        reputation_risks: ['Obro\'ga putur'],
        timeline_risks: ['Uzoq jarayon']
      },
      ai_recommendations: [
        'Yozma kelishuvlar tuzing',
        'Yurist maslahati oling',
        'Barcha hujjatlarni saqlang'
      ],
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Save to localStorage (client-side will handle this)
    return NextResponse.json(tree);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Qaror daraxti yaratilmadi' },
      { status: 500 }
    );
  }
}

async function updateDecisionTree(tree_id: string, node_id: string, decision: string) {
  try {
    // Update tree path
    return NextResponse.json({
      success: true,
      current_node: 'node_' + (parseInt(node_id.split('_')[1]) + 1),
      path_taken: [node_id],
      confidence_score: 0.9
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Yangilanmadi' },
      { status: 500 }
    );
  }
}

async function getDecisionTrees() {
  try {
    // Trees will be loaded from localStorage on client side
    return NextResponse.json({
      trees: [],
      total: 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Yuklanmadi' },
      { status: 500 }
    );
  }
}
