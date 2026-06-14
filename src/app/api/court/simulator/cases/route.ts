import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseType = searchParams.get('case_type');
    const difficulty = searchParams.get('difficulty');

    // Mock cases data
    const mockCases = [
      {
        id: 'case_1',
        title: 'Tijorat shartnomasi nizosi',
        case_type: 'civil',
        difficulty_level: 'medium',
        description: 'Ikki kompaniya o\'rtasida shartnoma shartlarining buzilishi munosabati bilan yuzaga kelgan nizo',
        estimated_duration: 45,
        key_issues: ['Shartnoma shartlari', 'To\'lov majburiyatlari', 'Jarima to\'lovlari'],
        participants: ['Plaintiff', 'Defendant', 'Judge'],
        complexity_score: 7
      },
      {
        id: 'case_2',
        title: 'Ish haqi to\'lanmaganligi bois nizo',
        case_type: 'labor',
        difficulty_level: 'easy',
        description: 'Xodimning ish haqi vaqtni to\'lanmaganligi munosabati bilan ish beruvchiga qarshi da\'vo',
        estimated_duration: 30,
        key_issues: ['Ish haqi', 'Ish vaqti', 'Kompensatsiya'],
        participants: ['Plaintiff', 'Defendant', 'Judge'],
        complexity_score: 4
      },
      {
        id: 'case_3',
        title: 'Oilaviy mulk bo\'linishi',
        case_type: 'family',
        difficulty_level: 'hard',
        description: 'Ajralish paytida umumiy mulkning bo\'linishi masalasi',
        estimated_duration: 60,
        key_issues: ['Mulk bo\'linishi', 'Vosa huquqi', 'Farzandlar tarbiyasi'],
        participants: ['Plaintiff', 'Defendant', 'Judge', 'Lawyer'],
        complexity_score: 9
      }
    ];

    // Filter cases if parameters provided
    let filteredCases = mockCases;
    if (caseType) {
      filteredCases = filteredCases.filter(c => c.case_type === caseType);
    }
    if (difficulty) {
      filteredCases = filteredCases.filter(c => c.difficulty_level === difficulty);
    }

    return NextResponse.json({
      cases: filteredCases,
      total: filteredCases.length,
      filters: {
        case_type: caseType,
        difficulty: difficulty
      }
    });

  } catch (error) {
    console.error('Court cases get error:', error);
    return NextResponse.json(
      { error: 'Sud ishlarini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
