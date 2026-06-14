import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario_type = searchParams.get('scenario_type');
    const difficulty_level = searchParams.get('difficulty_level');

    // Mock scenario templates
    const mockTemplates = [
      {
        id: 'template_1',
        name: 'Tijorat shartnomasi nizosi',
        scenario_type: 'civil',
        difficulty_level: 'medium',
        description: 'Tijorat shartnomasi buzilishi bo\'yicha nizolarni hal qilish uchun senariy shabloni',
        structure: {
          introduction: 'Nizoning mohiyati va tarixi',
          parties: 'Tomonlar va ularning huquqiy holati',
          facts: 'Nizoga olib kelgan faktik holatlar',
          legal_issues: 'Asosiy huquqiy masalalar',
          evidence: 'Dalillar va guvohliklar',
          arguments: 'Tomonlar argumentlari',
          resolution: 'Nizoni hal etish yo\'llari',
          conclusion: 'Xulosa va tavsiyalar'
        },
        duration_minutes: 45,
        participants_count: 4,
        key_elements: [
          'Shartnoma shartlari',
          'Majburiyatlar buzilishi',
          'Zararni hisoblash',
          'Qonuniy asoslar'
        ],
        learning_objectives: [
          'Fuqarolik huquqini o\'rganish',
          'Shartnoma huquqini tushunish',
          'Dalillar bilan ishlash',
          'Argumentatsiya ko\'nikmalari'
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
            description: 'Mantiqiy va dalilli argumentlar'
          },
          {
            criterion: 'Dalillar bilan ishlash',
            weight: 0.25,
            description: 'Dalillarni to\'g\'ri yig\'ish va taqdim etish'
          },
          {
            criterion: 'Strategik tafakkur',
            weight: 0.20,
            description: 'Optimal yo\'nalishni tanlash'
          }
        ],
        materials_needed: [
          'Fuqarolik kodeksi',
          'Shartnoma namunalari',
          'Dalillar to\'plami',
          'Ekspert xulosalari namunalari'
        ],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        usage_count: 156,
        rating: 4.5
      },
      {
        id: 'template_2',
        name: 'Ish haqi nizosi',
        scenario_type: 'labor',
        difficulty_level: 'easy',
        description: 'Ish haqi to\'lanmaganligi bo\'yicha nizolarni hal qilish uchun senariy shabloni',
        structure: {
          introduction: 'Ish munosabatlari tarixi',
          employer: 'Ish beruvchi haqida ma\'lumot',
          employee: 'Ishchi haqida ma\'lumot',
          violations: 'Ish haqi buzilishi holatlari',
          calculations: 'Qarz miqdorini hisoblash',
          legal_basis: 'Mehnat kodeksiga asos',
          resolution: 'Nizoni hal etish yo\'llari',
          conclusion: 'Xulosa'
        },
        duration_minutes: 30,
        participants_count: 3,
        key_elements: [
          'Ish haqi to\'lanmaganligi',
          'Ish vaqti hisobi',
          'Kompensatsiya miqdori',
          'Mehnat inspektsiyasi'
        ],
        learning_objectives: [
          'Mehnat huquqini o\'rganish',
          'Ish haqi hisoblash',
          'Kompensatsiya turlari',
          'Mehnat nizolarini hal qilish'
        ],
        evaluation_criteria: [
          {
            criterion: 'Mehnat huquqi bilimlari',
            weight: 0.35,
            description: 'Mehnat kodeksini qo\'llash'
          },
          {
            criterion: 'Hisoblash aniqligi',
            weight: 0.30,
            description: 'Ish haqi va kompensatsiyani to\'g\'ri hisoblash'
          },
          {
            criterion: 'Dalillar',
            weight: 0.25,
            description: 'Ish jadvali va to\'lov hujjatlari'
          },
          {
            criterion: 'Yechim takliflari',
            weight: 0.10,
            description: 'Samimiy va qonuniy yechimlar'
          }
        ],
        materials_needed: [
          'Mehnat kodeksi',
          'Ish jadvalari namunalari',
          'Ish haqi hisoblash formulalari',
          'Kompensatsiya jadvallari'
        ],
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-14T15:20:00Z',
        usage_count: 89,
        rating: 4.2
      },
      {
        id: 'template_3',
        name: 'Oilaviy mulk bo\'linishi',
        scenario_type: 'family',
        difficulty_level: 'hard',
        description: 'Ajralish paytida umumiy mulkning bo\'linishi bo\'yicha murakkab senariy',
        structure: {
          introduction: 'Oilaviy holat tarixi',
          marriage: 'Nikoh va oila tarixi',
          assets: 'Umumiy mulk ro\'yxati',
          children: 'Farzandlar va vosa huquqi',
          division: 'Mulk bo\'linishi tamoyillari',
          disputes: 'Nizoli masalalar',
          resolution: 'Tinchlik yo\'li bilan hal etish',
          litigation: 'Sud jarayoni',
          conclusion: 'Xulosa'
        },
        duration_minutes: 60,
        participants_count: 4,
        key_elements: [
          'Nikohning buzilishi',
          'Umumiy mulk turi',
          'Mulkning qimmati',
          'Vosa huquqi',
          'Aliment majburiyatlari'
        ],
        learning_objectives: [
          'Oilaviy huquqni chuqur o\'rganish',
          'Mulk bo\'linishi qoidalari',
          'Vosa huquqi asoslari',
          'Xalqaro oilaviy huquq'
        ],
        evaluation_criteria: [
          {
            criterion: 'Oilaviy huquq bilimlari',
            weight: 0.30,
            description: 'Oilaviy kodeksini qo\'llash'
          },
          {
            criterion: 'Mulk baholash',
            weight: 0.25,
            description: 'Mulkning qimmatini to\'g\'ri baholash'
          },
          {
            criterion: 'Vosa huquqi',
            weight: 0.25,
            description: 'Farzandlar manfaatini himoya qilish'
          },
          {
            criterion: 'Tuzatish qobiliyati',
            weight: 0.20,
            description: 'Murakkab vaziyatlarni hal qilish'
          }
        ],
        materials_needed: [
          'Oilaviy kodeksi',
          'Mulk baholash usullari',
          'Vosa huquqi qoidalari',
          'Xalqaro konvensiyalar'
        ],
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-15T09:15:00Z',
        usage_count: 234,
        rating: 4.7
      },
      {
        id: 'template_4',
        name: 'Jinoyat tergovi',
        scenario_type: 'criminal',
        difficulty_level: 'medium',
        description: 'Jinoyat ishi bo\'yicha tergov jarayonini o\'rganish uchun senariy',
        structure: {
          introduction: 'Jinoyat holati',
          crime: 'Jinoyat tarkibi va turlari',
          suspect: 'Ayblanuvchi haqida',
          evidence: 'Dalillar va guvohlar',
          investigation: 'Tergov harakatlari',
          legal_procedure: 'Protsessual qoidalar',
          trial: 'Sud jarayoni',
          verdict: 'Qaror va jazo',
          conclusion: 'Xulosa'
        },
        duration_minutes: 50,
        participants_count: 4,
        key_elements: [
          'Jinoyat tarkibi',
          'Dalillar to\'plami',
          'Tergov harakatlari',
          'Protsessual qoidalar',
          'Jazo miqdori'
        ],
        learning_objectives: [
          'Jinoyat huquqini o\'rganish',
          'Tergov usullarini tushunish',
          'Protsessual qoidalarni qo\'llash',
          'Jazo turlarini bilish'
        ],
        evaluation_criteria: [
          {
            criterion: 'Jinoyat huquqi bilimlari',
            weight: 0.35,
            description: 'Jinoyat kodeksini qo\'llash'
          },
          {
            criterion: 'Tergov mahorati',
            weight: 0.25,
            description: 'Dalillarni to\'plash va tahlil qilish'
          },
          {
            criterion: 'Protsessual rioya qilish',
            weight: 0.25,
            description: 'Protsessual qoidalarni bajarish'
          },
          {
            criterion: 'Tahlil chuqurligi',
            weight: 0.15,
            description: 'Vaziyatni to\'liq tahlil qilish'
          }
        ],
        materials_needed: [
          'Jinoyat kodeksi',
          'Jinoyat protsessual kodeksi',
          'Tergov qoidalari',
          'Dalillar to\'plami namunalari'
        ],
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-12T18:45:00Z',
        usage_count: 178,
        rating: 4.4
      },
      {
        id: 'template_5',
        name: 'Ijaraga olish nizosi',
        scenario_type: 'property',
        difficulty_level: 'easy',
        description: 'Ijaraga olingan mulk bo\'yicha nizolarni hal qilish uchun senariy',
        structure: {
          introduction: 'Ijaraga olish shartnomasi',
          property: 'Ijaraga olingan mulk xususiyatlari',
          landlord: 'Ijaraga beruvchi',
          tenant: 'Ijaraga oluvchi',
          contract: 'Shartnoma shartlari',
          violations: 'Buzilish holatlari',
          damages: 'Zarar va yo\'qotishlar',
          resolution: 'Nizoni hal etish',
          conclusion: 'Xulosa'
        },
        duration_minutes: 35,
        participants_count: 3,
        key_elements: [
          'Ijaraga olish shartnomasi',
          'Ijara to\'lovi',
          'Mulk sifati',
          'Garantiya majburiyatlari',
          'Shartnomani bekor qilish'
        ],
        learning_objectives: [
          'Ijaraga olish huquqini o\'rganish',
          'Shartnoma huquqini qo\'llash',
          'Mulk sifatini baholash',
          'Kompensatsiya hisobi'
        ],
        evaluation_criteria: [
          {
            criterion: 'Ijaraga olish huquqi',
            weight: 0.30,
            description: 'Ijaraga olish qoidalarini bilish'
          },
          {
            criterion: 'Shartnoma tahlili',
            weight: 0.30,
            description: 'Shartnoma shartlarini tushunish'
          },
          {
            criterion: 'Hisoblash aniqligi',
            weight: 0.25,
            description: 'Zarar va kompensatsiyani hisoblash'
          },
          {
            criterion: 'Yechim samaradorligi',
            weight: 0.15,
            description: 'Amaliy yechimlar taklif etish'
          }
        ],
        materials_needed: [
          'Fuqarolik kodeksi',
          'Ijaraga olish shartnomalari',
          'Mulk baholash usullari',
          'Kompensatsiya hisob formulalari'
        ],
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-13T11:30:00Z',
        usage_count: 123,
        rating: 4.1
      }
    ];

    // Filter templates
    let filteredTemplates = mockTemplates;
    if (scenario_type) {
      filteredTemplates = mockTemplates.filter(template => template.scenario_type === scenario_type);
    }
    if (difficulty_level) {
      filteredTemplates = filteredTemplates.filter(template => template.difficulty_level === difficulty_level);
    }

    return NextResponse.json({
      templates: filteredTemplates,
      total_templates: filteredTemplates.length,
      filters: {
        scenario_type: scenario_type,
        difficulty_level: difficulty_level
      },
      summary: {
        by_type: {
          civil: filteredTemplates.filter(t => t.scenario_type === 'civil').length,
          criminal: filteredTemplates.filter(t => t.scenario_type === 'criminal').length,
          family: filteredTemplates.filter(t => t.scenario_type === 'family').length,
          labor: filteredTemplates.filter(t => t.scenario_type === 'labor').length,
          property: filteredTemplates.filter(t => t.scenario_type === 'property').length,
          other: filteredTemplates.filter(t => !['civil', 'criminal', 'family', 'labor', 'property'].includes(t.scenario_type)).length
        },
        by_difficulty: {
          easy: filteredTemplates.filter(t => t.difficulty_level === 'easy').length,
          medium: filteredTemplates.filter(t => t.difficulty_level === 'medium').length,
          hard: filteredTemplates.filter(t => t.difficulty_level === 'hard').length
        },
        average_duration: Math.round(filteredTemplates.reduce((sum, t) => sum + t.duration_minutes, 0) / filteredTemplates.length),
        average_rating: Math.round(filteredTemplates.reduce((sum, t) => sum + t.rating, 0) / filteredTemplates.length * 10) / 10
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scenario templates get error:', error);
    return NextResponse.json(
      { error: 'Senariy shablonlarini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
