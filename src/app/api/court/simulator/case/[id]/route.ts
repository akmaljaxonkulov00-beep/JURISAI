import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Case ID talab qilinadi' },
        { status: 400 }
      );
    }

    // Mock case details
    const mockCaseDetails = {
      id: id,
      title: 'Tijorat shartnomasi nizosi',
      case_type: 'civil',
      difficulty_level: 'medium',
      description: 'Ikki kompaniya o\'rtasida shartnoma shartlarining buzilishi munosabati bilan yuzaga kelgan nizo. Sotuvchi tomonidan tovar sifatiga ko\'ra talab qilinayotgan xususiyatlar bo\'lmaganligi, shu sababli xaridor tomonidan shartnoma bekor qilinishi va to\'langan pulning qaytarilishi talabi qonuniy asoslangan.',
      estimated_duration: 45,
      key_issues: [
        'Shartnoma shartlarining to\'liq bajarilmasligi',
        'Tovar sifatiga nisbatan da\'volar',
        'Pul mablag\'larining qaytarilishi',
        'Jarima shartlari'
      ],
      participants: [
        {
          name: 'Ali Valiyev',
          role: 'Plaintiff',
          description: 'Xaridor, shartnomani buzilgani uchun da\'vo arizasi bergan'
        },
        {
          name: 'Dilnoza Karimova',
          role: 'Defendant',
          description: 'Sotuvchi, shartnoma shartlarini bajarganini da\'vo qilmoqda'
        },
        {
          name: 'Sudya',
          role: 'Judge',
          description: 'Nizoni ko\'rib chiqayotgan sudya'
        }
      ],
      evidence: [
        {
          id: 'ev_1',
          type: 'document',
          title: 'Tijorat shartnomasi',
          description: 'Tomonlar o\'rtasida tuzilgan tijorat shartnomasi',
          credibility_score: 95,
          relevance_score: 90,
          authenticity_score: 98
        },
        {
          id: 'ev_2',
          type: 'document',
          title: 'To\'lov cheki',
          description: 'Xaridor tomonidan to\'langan pulning dalilasi',
          credibility_score: 92,
          relevance_score: 85,
          authenticity_score: 95
        },
        {
          id: 'ev_3',
          type: 'expert_report',
          title: 'Ekspert xulosasi',
          description: 'Mustaqil ekspertning tovar sifati haqida tahlili',
          credibility_score: 88,
          relevance_score: 92,
          authenticity_score: 90
        }
      ],
      legal_basis: [
        'O\'zbekiston Respublikasi Fuqarolik kodeksi 350-modda - Shartnomaning bajarilishi',
        'O\'zbekiston Respublikasi Fuqarolik kodeksi 367-modda - Majburiyatni noto\'g\'ri bajarish oqibatida yetkazilgan zararning qoplanishi',
        'O\'zbekiston Respublikasi Fuqarolik kodeksi 357-modda - Shartnomani bekor qilish asoslari'
      ],
      possible_outcomes: [
        {
          outcome: 'Shartnoma bekor qilinadi, pul qaytariladi',
          probability: 0.7,
          reasoning: 'Tovar sifati shartnomaga mos kelmaganligi isbotlangan'
        },
        {
          outcome: 'Shartnoma saqlanib qolinadi, qisman kompensatsiya',
          probability: 0.2,
          reasoning: 'Ayrim shartlar buzilgan, lekin umumiy majburiyatlar bajarilgan'
        },
        {
          outcome: 'Da\'vo rad etiladi',
          probability: 0.1,
          reasoning: 'Da\'vogar tomonidan yetarli dalillar keltirilmagan'
        }
      ],
      complexity_score: 7,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    };

    return NextResponse.json(mockCaseDetails);

  } catch (error) {
    console.error('Court case details get error:', error);
    return NextResponse.json(
      { error: 'Sud ish tafsilotlarini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
