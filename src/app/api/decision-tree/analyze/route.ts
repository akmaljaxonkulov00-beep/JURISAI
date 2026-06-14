import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { scenario_title, scenario_description, case_type, initial_decisions } = await request.json();

    if (!scenario_title || !scenario_description || !case_type) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: scenario_title, scenario_description, case_type' },
        { status: 400 }
      );
    }

    // Mock decision tree analysis
    const mockAnalysis = {
      tree_id: `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenario_title: scenario_title,
      case_type: case_type,
      analysis_date: new Date().toISOString(),
      confidence_score: Math.floor(Math.random() * 15) + 85, // 85-100
      complexity_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      estimated_outcomes: [
        {
          path: 'Path A - Qonuniy yo\'l',
          probability: 0.65,
          confidence: 0.88,
          description: 'Qonun hujjatlariga to\'liq rioya qilish orqali eng yaxshi natijaga erishish',
          steps: [
            {
              step: 1,
              action: 'Shartnoma shartlarini tekshirish',
              legal_basis: 'O\'zbekiston FK 350-modda',
              outcome: 'Shartnoma shartlarining aniqlanishi',
              confidence: 0.95
            },
            {
              step: 2,
              action: 'Tomonlarning majburiyatlarini belgilash',
              legal_basis: 'O\'zbekiston FK 367-modda',
              outcome: 'Majburiyatlar aniq belgilanadi',
              confidence: 0.92
            },
            {
              step: 3,
              action: 'Zararni hisoblash va talab qilish',
              legal_basis: 'O\'zbekiston FK 367-modda',
              outcome: 'Zarar to\'liq qoplanadi',
              confidence: 0.87
            }
          ],
          risks: [
            {
              risk: 'Dalillar yetarli bo\'lmasligi',
              probability: 0.15,
              impact: 'medium',
              mitigation: 'Qo\'shimcha dalillar yig\'ish'
            },
            {
              risk: 'Qonuniy muddatlar o\'tib ketishi',
              probability: 0.08,
              impact: 'high',
              mitigation: 'Tez harakat qilish'
            }
          ],
          timeline: '2-3 oy',
          expected_cost: '500,000 - 1,000,000 so\'m',
          success_probability: 0.75
        },
        {
          path: 'Path B - Tuzatish yo\'li',
          probability: 0.25,
          confidence: 0.72,
          description: 'Shartnomani qisman tuzatish orqali muammoni hal qilish',
          steps: [
            {
              step: 1,
              action: 'Shartnoma shartlarini qayta ko\'rib chiqish',
              legal_basis: 'O\'zbekiston FK 357-modda',
              outcome: 'Shartnomaga o\'zgartirishlar kiritish',
              confidence: 0.85
            },
            {
              step: 2,
              action: 'Tomonlar o\'rtasida kelishuv',
              legal_basis: 'O\'zbekiston FK 6-modda',
              outcome: 'O\'zaro kelishuvga erishish',
              confidence: 0.78
            }
          ],
          risks: [
            {
              risk: 'Ikkinchi tomon rad etishi',
              probability: 0.35,
              impact: 'medium',
              mitigation: 'Qo\'shimcha kompromisslar taklif etish'
            }
          ],
          timeline: '1-2 oy',
          expected_cost: '200,000 - 400,000 so\'m',
          success_probability: 0.60
        },
        {
          path: 'Path C - Arbitraj yo\'li',
          probability: 0.10,
          confidence: 0.65,
          description: 'Arbitraj orqali nizoni hal qilish',
          steps: [
            {
              step: 1,
              action: 'Arbitrajga murojaat qilish',
              legal_basis: 'O\'zbekiston "Nizolarni hal etish to\'g\'risida" qonuni',
              outcome: 'Arbitraj jarayoni boshlanadi',
              confidence: 0.80
            },
            {
              step: 2,
              action: 'Arbitraj qarori kutish',
              legal_basis: 'Arbitraj reglamenti',
              outcome: 'Arbitraj qarori chiqariladi',
              confidence: 0.70
            }
          ],
          risks: [
            {
              risk: 'Arbitraj qarori bajarilmasligi',
              probability: 0.20,
              impact: 'high',
              mitigation: 'Ijro qilish choralari ko\'rish'
            }
          ],
          timeline: '3-4 oy',
          expected_cost: '800,000 - 1,500,000 so\'m',
          success_probability: 0.55
        }
      ],
      recommended_path: 'Path A - Qonuniy yo\'l',
      key_factors: [
        {
          factor: 'Shartnoma mavjudligi',
          importance: 'critical',
          status: 'present'
        },
        {
          factor: 'Dalillar mavjudligi',
          importance: 'high',
          status: 'sufficient'
        },
        {
          factor: 'Muddatlar buzilishi',
          importance: 'medium',
          status: 'confirmed'
        }
      ],
      legal_references: [
        {
          title: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
          articles: ['350-modda', '357-modda', '367-modda'],
          relevance: 'high'
        },
        {
          title: 'O\'zbekiston Respublikasi "Nizolarni hal etish to\'g\'risida" qonuni',
          articles: ['3-modda', '7-modda'],
          relevance: 'medium'
        }
      ],
      next_steps: [
        'Shartnoma hujjatlarini to\'plang',
        'Dalillarni rasmiylashtiring',
        'Advokat bilan maslahatlashing',
        'Da\'vo arizasini tayyorlang'
      ]
    };

    // Save analysis to database
    const { data, error } = await supabase
      .from('decision_tree_analyses')
      .insert([{
        tree_id: mockAnalysis.tree_id,
        scenario_title: scenario_title,
        scenario_description: scenario_description,
        case_type: case_type,
        analysis_data: mockAnalysis,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Decision tree analysis error:', error);
    }

    // Track usage
    await trackUsage('decision_tree_analyze', { 
      tree_id: mockAnalysis.tree_id,
      case_type: case_type,
      confidence_score: mockAnalysis.confidence_score
    });

    return NextResponse.json(mockAnalysis);

  } catch (error) {
    console.error('Decision tree analyze error:', error);
    return NextResponse.json(
      { error: 'Qaror yo\'nalishini tahlil qilishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
