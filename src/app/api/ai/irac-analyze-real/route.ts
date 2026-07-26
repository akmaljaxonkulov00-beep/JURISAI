import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';
import { extractSection, extractSources, calculateConfidence, getMockAnalysis } from '@/lib/irac-analysis/utils';

export async function POST(request: NextRequest) {
  try {
    const { caseText } = await request.json();

    if (!caseText || caseText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Holat matni kamida 50 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Real IRAC analysis with OpenAI
    const analysis = await analyzeCaseWithOpenAI(caseText);

    // Track usage
    await trackUsage('irac_analysis', { caseLength: caseText.length, confidence: analysis.confidence });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('IRAC analysis error:', error);
    return NextResponse.json(
      { error: 'Tahlil qilishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

async function analyzeCaseWithOpenAI(caseText: string) {
  const prompt = `
Siz O'zbekiston qonunchilik bo'yicha mutaxassis sifatida berilgan holatni IRAC (Issue, Rule, Application, Conclusion) usulida tahlil qiling.

Holat matni:
${caseText}

Tahlil qilishda quyidagilarga rioya qiling:
1. Issue (Masala) - Holatning asosiy yuridik masalasini aniqlang
2. Rule (Qoida) - Qaysi qonun hujjatlari qo'llanilishini ko'rsating, modda raqamlari bilan
3. Application (Tatbiq) - Qoidani holatga qanday qo'llanilishini tushuntiring
4. Conclusion (Xulosa) - Yakuniy xulosani chiqaring

Qo'shimcha ravishda:
- O'zbekiston Respublikasi qonunlariga asoslang
- Modda raqamlarini ko'rsating
- Amaliy maslahatlar bering
- O'zbek tilida javob bering

Javobingizni quyidagi formatda tuzing:

**Issue**: [masala shaklida]

**Rule**: [qo'llaniladigan qonunlar va moddalar]

**Application**: [qoidaning holatga tatbiqi]

**Conclusion**: [xulosa va tavsiyalar]

**Sources**: [qonun hujjatlari ro'yxati]
`;

  try {
    const openaiMod = await import('@/lib/openai');
    const client = (openaiMod as any).openaiClient;
    const response = client ? await client.generateText(prompt) : 'AI hizmati vaqtincha mavjud emas.';
    
    // Parse response and extract confidence
    const confidence = typeof calculateConfidence === 'function' ? (calculateConfidence as any)(caseText, response) : 70;
    
    // Extract sources from response
    const sources = typeof extractSources === 'function' ? (extractSources as any)(response) : [];

    return {
      issue: typeof extractSection === 'function' ? (extractSection as any)(response, 'Issue') : 'Tahlil qilishda xatolik',
      rule: typeof extractSection === 'function' ? (extractSection as any)(response, 'Rule') : 'Qonun moddasini aniqlashda xatolik',
      application: typeof extractSection === 'function' ? (extractSection as any)(response, 'Application') : 'Tatbiq qilishda xatolik',
      conclusion: typeof extractSection === 'function' ? (extractSection as any)(response, 'Conclusion') : 'Xulosa chiqarishda xatolik',
      sources,
      confidence
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return {
      issue: 'Tahlil qilishda xatolik yuz berdi',
      rule: 'Iltimos, qayta urinib ko\'ring',
      application: 'Xatolik vaqtinchalik',
      conclusion: 'Agar xatolik takrorlansa, administrator bilan bog\'laning',
      sources: [],
      confidence: 0
    };
  }
}

