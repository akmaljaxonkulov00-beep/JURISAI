import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { openaiClient } from '@/lib/openai';
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
    const response = await openaiClient.generateText(prompt);
    
    // Parse response and extract confidence
    const confidence = calculateConfidence(caseText, response);
    
    // Extract sources from response
    const sources = extractSources(response);

    return {
      issue: extractSection(response, 'Issue'),
      rule: extractSection(response, 'Rule'),
      application: extractSection(response, 'Application'),
      conclusion: extractSection(response, 'Conclusion'),
      sources,
      confidence
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    // Fallback to mock analysis if OpenAI fails
    return getMockAnalysis(caseText);
  }
}

