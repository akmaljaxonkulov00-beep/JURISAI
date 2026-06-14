import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { original_argument, weakness_points, improvement_style } = await request.json();

    if (!original_argument || !weakness_points) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: original_argument, weakness_points' },
        { status: 400 }
      );
    }

    // Generate unique improvement ID
    const improvementId = `improvement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock argument improvement
    const mockImprovement = {
      id: improvementId,
      original_argument: original_argument,
      weakness_points: weakness_points,
      improvement_style: improvement_style || 'formal',
      improved_at: new Date().toISOString(),
      improved_argument: generateImprovedArgument(original_argument, weakness_points, improvement_style),
      improvements_made: [
        {
          type: 'logical_structure',
          description: 'Mantiqiy tuzilish mustahkamlandi',
          original: 'Sababsiz xulosa chiqarilgan',
          improved: 'Har bir xulosadan oldin aniq sabablar keltirildi',
          confidence: 0.85
        },
        {
          type: 'evidence_addition',
          description: 'Qo\'shimcha dalillar qo\'shildi',
          original: 'Dalillar yetarli emas',
          improved: 'Qonun hujjatlari va statistik ma\'lumotlar qo\'shildi',
          confidence: 0.92
        },
        {
          type: 'style_enhancement',
          description: 'Uslub yaxshilandi',
          original: 'Hissiy ifodalar ko\'p',
          improved: 'Rasmiy va obyektiv uslub qo\'llanildi',
          confidence: 0.78
        }
      ],
      quality_metrics: {
        original_score: Math.floor(Math.random() * 20) + 60, // 60-80
        improved_score: Math.floor(Math.random() * 15) + 80, // 80-95
        improvement_percentage: Math.floor(Math.random() * 20) + 15, // 15-35%
        confidence_level: Math.floor(Math.random() * 10) + 85 // 85-95
      },
      detailed_changes: {
        structure_changes: [
          {
            section: 'Kirish qismi',
            change: 'Aniqroq va qisqaroq qilib qayta yozildi',
            reason: 'Diqqatni jalb qilish va asosiy mavzuga yo\'naltirish'
          },
          {
            section: 'Asosiy argument',
            change: 'Mantiqiy ketma-ketlik mustahkamlandi',
            reason: 'Tushunarli va izchil fikr oqimini ta\'minlash'
          },
          {
            section: 'Xulosa',
            change: 'Asosiy argument bilan to\'g\'ri bog\'landi',
            reason: 'Xulosaning asoslanganligini ko\'rsatish'
          }
        ],
        content_additions: [
          {
            type: 'legal_references',
            added: 'O\'zbekiston Respublikasi Fuqarolik kodeksi 350-modda',
            reason: 'Qonuniy asosni kuchaytirish'
          },
          {
            type: 'statistical_data',
            added: '2023 yil statistikasiga ko\'ra, shunday nizolarning 65% da da\'vogar g\'alaba qozongan',
            reason: 'Argumentning ishonchligini oshirish'
          },
          {
            type: 'expert_opinion',
            added: 'Mustaqil ekspertlar xulosasiga ko\'ra, bu holatda da\'vo asosli',
            reason: 'Mustaqil baholashni qo\'shish'
          }
        ],
        style_improvements: [
          {
            aspect: 'tone',
            before: 'Hissiy va shaxsiy',
            after: 'Rasmiy va obyektiv',
            reason: 'Professionallik va ishonchlilikni oshirish'
          },
          {
            aspect: 'word_choice',
            before: 'Oddiy va kundalik so\'zlar',
            after: 'Huquqiy terminlar va aniq ifodalar',
            reason: 'Aniqlik va professionallik'
          },
          {
            aspect: 'sentence_structure',
            before: 'Uzun va murakkab gaplar',
            after: 'Qisqa va tushunarli gaplar',
            reason: 'O\'qish qulayligi va tushunish osonligi'
          }
        ]
      },
      comparison_analysis: {
        strengths_gained: [
          'Mantiqiy izchillik',
          'Dalillar bilan mustahkamlanganlik',
          'Professional uslub',
          'Aniqlik va qisqalik'
        ],
        weaknesses_removed: [
          'Mantiqiy xatoliklar',
          'Dalillarning yetishmasligi',
          'Hissiy ifodalar',
          'Noto\'g\'ri tuzilish'
        ],
        overall_assessment: 'Argument sifati sezilarli darajada yaxshilandi, xatoliklar bartaraf etildi'
      },
      recommendations: [
        {
          category: 'Kelajakki yaxshilanishlar',
          suggestions: [
            'Qo\'shimcha dalillar yig\'ish',
            'Qarshiliklarni oldindan ko\'rib chiqish',
            'Turli nuqtai nazardan baholash'
          ]
        },
        {
          category: 'Qo\'llash maslahatlari',
          suggestions: [
            'Sud jarayonida shu uslubni qo\'llang',
            'Muzokaralarda aniq dalillarga tayaning',
            'Yozma shaklda ham shu argumentni ishlating'
          ]
        }
      ],
      confidence_explanation: {
        overall_confidence: Math.floor(Math.random() * 10) + 85,
        factors: [
          'Asl argumentning tuzilishi yaxshi',
          'Zaifliklar aniq belgilangan',
          'Yaxshilanishlar mantiqiy asoslangan',
          'Professional standartlarga moslash'
        ],
        limitations: [
          'Kontekstning to\'liq emasligi',
          'Auditoriya reaksiyasini oldindan bashorat qilish qiyinligi',
          'Amaliy sinovdan o\'tmaganlik'
        ]
      }
    };

    // Save improvement to database
    const { data, error } = await supabase
      .from('argument_improvements')
      .insert([{
        id: improvementId,
        original_argument: original_argument,
        weakness_points: weakness_points,
        improvement_style: improvement_style || 'formal',
        improvement_data: mockImprovement,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Argument improvement error:', error);
    }

    // Track usage
    await trackUsage('argument_improvement', { 
      improvement_id: improvementId,
      improvement_style: improvement_style,
      improved_score: mockImprovement.quality_metrics.improved_score
    });

    return NextResponse.json(mockImprovement);

  } catch (error) {
    console.error('Argument improvement error:', error);
    return NextResponse.json(
      { error: 'Argumentni yaxshilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function generateImprovedArgument(original: string, weaknesses: string[], style: string): string {
  // Mock improved argument generation
  const improvements = [
    'Mazkur holatda O\'zbekiston Respublikasi Fuqarolik kodeksining 350-moddasiga asosan, shartnoma majburiyatlarining to\'liq bajarilishi talab etiladi. Tomonlar o\'rtasida tuzilgan shartnomaning 5-bandiga ko\'ra, javobgar tomon 2024 yil 1-yanvardan boshlab to\'lov majburiyatini bajarmagan.',
    
    'Statistik ma\'lumotlarga ko\'ra, 2023 yilda shunga o\'xshash nizolarning 65% da da\'vogar tomon g\'alaba qozongan. Bu holatda da\'vogarning pozitsiyasi qonuniy asoslangan va adolatli.',
    
    'Mustaqil ekspertlar xulosasiga ko\'ra, berilgan hujjatlar va dalillar asosida, javobgar tomonning majburiyatlarini buzish fakti aniq belgilangan. Shu sababli, da\'vo talablari to\'liq asoslangan.',
    
    'Xulosa qilib aytish mumkinki, da\'vogarning talablari qonuniy asoslangan, dalillar bilan mustahkamlangan va adolatli. Sud ushbu da\'voni qanoatlantirish lozim.'
  ];

  return improvements.join('\n\n');
}
