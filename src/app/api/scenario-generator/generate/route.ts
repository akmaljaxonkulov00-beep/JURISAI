import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { 
      scenario_type, 
      difficulty_level, 
      complexity, 
      participants_count, 
      focus_areas, 
      duration_minutes 
    } = await request.json();

    if (!scenario_type || !difficulty_level || !complexity) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: scenario_type, difficulty_level, complexity' },
        { status: 400 }
      );
    }

    // Generate unique scenario ID
    const scenarioId = `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock scenario generation based on type and difficulty
    const mockScenarios: Record<string, Record<string, {
      title: string;
      description: string;
      participants: string[];
      key_issues: string[];
      complexity_score: number;
    }>> = {
      'civil': {
        'easy': {
          title: 'Oddiy tijorat nizosi',
          description: 'Kichik biznes shartnomasi bo\'yicha nizo',
          participants: ['Plaintiff', 'Defendant', 'Judge'],
          key_issues: ['Shartnoma shartlari', 'To\'lov majburiyatlari'],
          complexity_score: 3
        },
        'medium': {
          title: 'Murakkab tijorat nizosi',
          description: 'Katta kompaniyalar o\'rtasida shartnoma nizosi',
          participants: ['Plaintiff', 'Defendant', 'Judge', 'Expert'],
          key_issues: ['Shartnoma buzilishi', 'Zarar kompensatsiyasi', 'Shartnoma bekor qilish'],
          complexity_score: 6
        },
        'hard': {
          title: 'Xalqaro tijorat nizosi',
          description: 'Xalqaro shartnoma bo\'yicha nizo',
          participants: ['Plaintiff', 'Defendant', 'Judge', 'Expert', 'Arbitrator'],
          key_issues: ['Xalqaro huquqiy qoidalar', 'Valyuta risklari', 'Ijro etish'],
          complexity_score: 9
        }
      },
      'criminal': {
        'easy': {
          title: 'Oddiy jinoyat ishi',
          description: 'Mulkka tegishli kichik jinoyat',
          participants: ['Prosecutor', 'Defendant', 'Judge'],
          key_issues: ['Dalillar', 'Jinoyat tarkibi', 'Jazo'],
          complexity_score: 4
        },
        'medium': {
          title: 'Murakkab jinoyat ishi',
          description: 'Shaxsga qarshi og\'ir jinoyat',
          participants: ['Prosecutor', 'Defendant', 'Judge', 'Expert', 'Witness'],
          key_issues: ['Jinoyat tarkibi', 'Dalillar to\'plami', 'Jazo miqdori'],
          complexity_score: 7
        },
        'hard': {
          title: 'Jamiyat uchun xavfli jinoyat',
          description: 'Tashkilot tomonidan sodir etilgan jinoyat',
          participants: ['Prosecutor', 'Defendant', 'Judge', 'Expert', 'Witness', 'Victim'],
          key_issues: ['Tashkilot javobgarligi', 'Jamoaviy xavf', 'Jazo turlari'],
          complexity_score: 10
        }
      },
      'family': {
        'easy': {
          title: 'Oddiy oilaviy nizo',
          description: 'Ajralish bo\'yicha nizo',
          participants: ['Plaintiff', 'Defendant', 'Judge'],
          key_issues: ['Ajralish shartlari', 'Mulk bo\'linishi'],
          complexity_score: 3
        },
        'medium': {
          title: 'Murakkab oilaviy nizo',
          description: 'Vosa huquqi va mulk bo\'linishi bo\'yicha nizo',
          participants: ['Plaintiff', 'Defendant', 'Judge', 'Child Representative'],
          key_issues: ['Vosa huquqi', 'Aliment', 'Mulk bo\'linishi'],
          complexity_score: 6
        },
        'hard': {
          title: 'Xalqaro oilaviy nizo',
          description: 'Turli davlat fuqarolari o\'rtasida nizo',
          participants: ['Plaintiff', 'Defendant', 'Judge', 'Expert', 'International Authority'],
          key_issues: ['Xalqaro huquq', 'Vosa qaytarib olish', 'Yurisdiksiya'],
          complexity_score: 9
        }
      }
    };

    const baseScenario = mockScenarios[scenario_type as string]?.[difficulty_level] || mockScenarios['civil']['medium'];

    // Generate detailed scenario
    const generatedScenario = {
      id: scenarioId,
      title: baseScenario.title,
      scenario_type: scenario_type as string,
      difficulty_level: difficulty_level,
      complexity: complexity,
      description: baseScenario.description,
      participants_count: participants_count || baseScenario.participants.length,
      participants: baseScenario.participants.slice(0, participants_count || baseScenario.participants.length),
      focus_areas: focus_areas || baseScenario.key_issues,
      duration_minutes: duration_minutes || 30,
      key_issues: baseScenario.key_issues,
      complexity_score: baseScenario.complexity_score,
      generated_at: new Date().toISOString(),
      detailed_content: {
        background: `${baseScenario.description}. Bu holat O\'zbekiston Respublikasi qonunchiligiga muvofiq ko\'rib chiqilishi kerak bo\'lgan murakkab vaziyat.`,
        case_facts: [
          'Holat 2024 yilda sodir etilgan',
          'Tomonlar o\'rtasida oldindan kelishuv mavjud',
          'Nizolarning asosiy sababi majburiyatlar buzilishi',
          'Tomonlar bir necha bor muzokaralar olib borgan, ammo natija bermagan'
        ],
        legal_issues: baseScenario.key_issues.map((issue: string) => ({
          issue: issue,
          relevant_laws: getRelevantLaws(scenario_type, issue),
          precedents: getPrecedents(scenario_type, issue),
          complexity: getComplexityLevel(baseScenario.complexity_score)
        })),
        evidence_requirements: [
          'Yozma hujjatlar (shartnomalar, guvohnomalar)',
          'Elektron dalillar (elektron pochtalar, SMS lar)',
          'Guvohlar ifodalari',
          'Ekspert xulosalari'
        ],
        possible_outcomes: [
          {
            outcome: 'Tinchlik yo\'li bilan hal etish',
            probability: 0.35,
            description: 'Tomonlar o\'zaro kelishuvga erishadi'
          },
          {
            outcome: 'Sud qarori bilan hal etish',
            probability: 0.45,
            description: 'Sud tomonidan qaror qabul qilinadi'
          },
          {
            outcome: 'Arbitraj orqali hal etish',
            probability: 0.20,
            description: 'Arbitraj komissiyasi tomonidan hal qilinadi'
          }
        ],
        learning_objectives: [
          `${scenario_type} huquqiy qoidalarini o\'rganish`,
          'Dalillar yig\'ish va tahlil qilish ko\'nikmalari',
          'Huquqiy argumentatsiyani rivojlantirish',
          'Nizolarni hal etish strategiyalarini o\'rganish'
        ],
        evaluation_criteria: [
          {
            criterion: 'Huquqiy bilimlar',
            weight: 0.30,
            description: 'Qonun hujjatlarini to\'g\'ri qo\'llash'
          },
          {
            criterion: 'Argumentatsiya',
            weight: 0.25,
            description: 'Mantiqiy va dalilli argumentlar keltirish'
          },
          {
            criterion: 'Dalillar bilan ishlash',
            weight: 0.25,
            description: 'Dalillarni to\'g\'ri yig\'ish va taqdim etish'
          },
          {
            criterion: 'Strategik tafakkur',
            weight: 0.20,
            description: 'Optimal yo\'nalishni tanlash va reja tuzish'
          }
        ]
      }
    };

    // Save scenario to database
    const { data, error } = await supabase
      .from('scenarios')
      .insert([{
        id: scenarioId,
        scenario_type: scenario_type,
        difficulty_level: difficulty_level,
        complexity: complexity,
        participants_count: participants_count || baseScenario.participants.length,
        focus_areas: focus_areas || baseScenario.key_issues,
        duration_minutes: duration_minutes || 30,
        scenario_data: generatedScenario,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Scenario generation error:', error);
    }

    // Track usage
    await trackUsage('scenario_generate', { 
      scenario_id: scenarioId,
      scenario_type: scenario_type,
      difficulty_level: difficulty_level
    });

    return NextResponse.json(generatedScenario);

  } catch (error) {
    console.error('Scenario generate error:', error);
    return NextResponse.json(
      { error: 'Senariy yaratishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function getRelevantLaws(scenarioType: string, issue: string): string[] {
  const lawMap: Record<string, string[]> = {
    'civil': ['O\'zbekiston Respublikasi Fuqarolik kodeksi', 'O\'zbekiston Respublikasi "Nizolarni hal etish to\'g\'risida" qonuni'],
    'criminal': ['O\'zbekiston Respublikasi Jinoyat kodeksi', 'O\'zbekiston Respublikasi Jinoyat protsessual kodeksi'],
    'family': ['O\'zbekiston Respublikasi Oilaviy kodeksi', 'O\'zbekiston Respublikasi Fuqarolik kodeksi']
  };
  return lawMap[scenarioType] || ['O\'zbekiston Respublikasi qonunlari'];
}

function getPrecedents(scenarioType: string, issue: string): string[] {
  return [
    'O\'zbekiston Respublikasi Oliy sudi amaliyoti',
    'Toshkent shahar sudi amaliyoti',
    'Xalqaro sud amaliyoti (agar tegishli bo\'lsa)'
  ];
}

function getComplexityLevel(score: number): string {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}
