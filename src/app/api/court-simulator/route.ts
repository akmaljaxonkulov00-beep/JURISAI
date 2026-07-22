import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqChat(systemPrompt: string, userMessage: string) {
  if (!GROQ_API_KEY) return { text: 'AI xizmati sozlanmagan' };

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    return { text: data.choices?.[0]?.message?.content || 'Javob olinmadi' };
  } catch {
    return { text: 'Xatolik yuz berdi' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, caseDetails, argument, simulationId } = body;

    const SYSTEM_BASE = `You are JurisAI — the leading expert AI Legal Assistant strictly specialized in the COMPLETE legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).

YURIDIK BILIM DOIRASI:
1. KONSTITUTSIYA: O'zbekiston Respublikasi Konstitutsiyasi (1992, 2023 yangi tahrir) — barcha moddalar
2. FUQAROLIK KODEKSI (FK): 1-300+ moddalar — mulk, shartnoma, meros, majburiyatlar
3. JINOYAT KODEKSI (JK): 1-200+ moddalar — jinoyat turlari va jazolar
4. MEHNAT KODEKSI (MK): 1-90+ moddalar — mehnat shartnomasi, ish haqi, ta'til
5. OILA KODEKSI (OK): 1-55+ moddalar — nikoh, aliment, farzandlikka olish
6. PROTSESSUAL KODEKSLAR: FPK (Fuqarolik protsessual), JPK (Jinoiy protsessual), IPK (Iqtisodiy protsessual), BSK (Ma'muriy sud ishlari)
7. MA'MURIY KODEKS: Ma'muriy javobgarlik to'g'risidagi kodeks

STRICT RULES:
1. ACCURACY FIRST: Never invent or hallucinate legal articles (moddalar) or punishments. JK 97-modda is ALWAYS 'Qasddan odam o'ldirish (og'irlashtiruvchi holatlar)'. Never confuse codes.
2. ROLE PLAY: In court simulator, you act as Sudya (Judge), Prokuror (Prosecutor), or Advokat (Defense Attorney) adhering strictly to official Uzbek court decorum.
3. PROCEDURAL CODES: Reference the correct procedural code: FPK for civil cases, JPK for criminal cases, IPK for economic disputes.
4. FORMATTING: Use clean Markdown with headings ## and bullet points *.
5. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).
6. If unsure about an exact article number, say "aniq modda uchun qonunlar bazasiga qarang" — never make up fake citations.`;

    switch (action) {
      case 'start':
        return await startSimulation(caseDetails, SYSTEM_BASE);
      case 'submit_argument':
        return await submitArgument(simulationId, argument, SYSTEM_BASE);
      case 'get_verdict':
        return await getVerdict(simulationId, SYSTEM_BASE);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Court simulator API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startSimulation(caseDetails: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining professional sudyasisan. Berilgan holat bo'yicha sud majlisini oching.

PROTSESSUAL QOIDALAR:
- Fuqarolik ishlari bo'yicha: FPK (Fuqarolik protsessual kodeksi) qoidalariga amal qiling
- Jinoyat ishlari bo'yicha: JPK (Jinoiy protsessual kodeksi) qoidalariga amal qiling
- Iqtisodiy nizolar bo'yicha: IPK (Iqtisodiy protsessual kodeksi) qoidalariga amal qiling
- Sud majlisida: taraflarni tanishtirish, ishni e'lon qilish, taraflarning huquq va majburiyatlarini tushuntirish

FORMAT:
## Holat tahlili
(qisqa tahlil)

## Qo'llaniladigan qonun
(tegishli kodeks va moddalar)

## Jarayon
(boshlang'ich qadam va keyingi bosqichlar)`;

  const response = await groqChat(systemPrompt, `Sud jarayonini boshlang: ${caseDetails}`);
  
  const simulationId = 'sim_' + Date.now();
  const transcript = [{
    id: Date.now().toString(),
    speaker: 'judge',
    content: response.text || 'Sud majlisi boshlandi.',
    timestamp: new Date().toISOString(),
  }];

  const evidence = [
    {
      id: 'ev_1',
      type: 'document',
      title: 'Asosiy dalil',
      description: 'Ish materiallaridan',
      credibility_score: 85,
      relevance_score: 90,
      authenticity_score: 95,
      presented_by: 'plaintiff'
    }
  ];

  return NextResponse.json({
    simulation_id: simulationId,
    status: 'active',
    current_phase: 'opening',
    transcript,
    evidence,
    ai_response: response.text,
    success: true
  });
}

async function submitArgument(simulationId: string, argument: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining sudyasisan. Tomonlarning argumentlarini qonuniy nuqtai nazardan baholang.

BAHOLASH MEZONLARI:
1. Argumentning qonuniyligi — tegishli qonun moddasiga asoslanganmi?
2. Dalillarning ishonchliligi — dalillar qonuniy tartibda olinganmi?
3. Taraflarning huquqiy pozitsiyasi — protsessual talablarga rioya qilinganmi?

FORMAT:
## Baholash
(qisqa huquqiy baho)

## Tegishli qonun
(kodeks va modda nomi)

## Keyingi qadam
(1 qadam va asoslash)`;

  const response = await groqChat(systemPrompt, `Argument: "${argument}". Javobingizni bering.`);

  return NextResponse.json({
    success: true,
    transcript: {
      id: Date.now().toString(),
      speaker: 'judge',
      content: response.text,
      timestamp: new Date().toISOString()
    },
    ai_response: response.text
  });
}

async function getVerdict(simulationId: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining sudyasisan. Barcha dalillar va argumentlarni tahlil qilib, yakuniy sud qarorini (hukmni) chiqaring.

HUKM TARKIBI:
1. Qarorning qaror qismi — kim, nima haqda, qanday qaror qabul qilindi
2. Qonuniy asos — aniq kodeks, modda, band ko'rsatilgan
3. Qarorning oqibatlari — ijro etish tartibi, shikoyat qilish muddati va tartibi

FORMAT:
## Sud qarori (hukm)
(aniq qaror matni)

## Qonuniy asos
(kodeks, modda, band)

## Huquqiy oqibatlar
(ijro, shikoyat qilish tartibi va muddatlari)`;

  const response = await groqChat(systemPrompt, 'Yakuniy hukmni chiqaring.');
  const score = Math.floor(70 + Math.random() * 30);

  return NextResponse.json({
    verdict: response.text,
    score: Math.min(score, 100),
    outcome: score >= 80 ? 'Yutildi' : score >= 60 ? 'Qisman yutildi' : 'Yutirilmadi',
    feedback: {
      argument_quality: score >= 80 ? 'A\'lo' : 'Yaxshi',
      legal_knowledge: score >= 75 ? 'Yuqori' : 'O\'rta',
      presentation: score >= 70 ? 'Professional' : 'Qoniqarli'
    }
  });
}
