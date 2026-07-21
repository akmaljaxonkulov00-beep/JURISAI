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

    const SYSTEM_BASE = `You are JurisAI — an expert AI Legal Assistant specialized in Uzbekistan legislation. 
STRICT RULES:
1. ACCURACY FIRST: Never invent legal articles or punishments.
2. FORMATTING: Use clean Markdown with headings ## and bullet points *.
3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).
4. If unsure about an article, say "aniq modda uchun qonunlar bazasiga qarang".`;

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

Sen sud majlisini boshqaruvchi sudyasan. Berilgan holat bo'yicha sud jarayonini boshlang. 
FORMAT:
## Holat tahlili
(qisqa tahlil)
## Jarayon
(boshlang'ich qadam)`;

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

Sen sudyasan. Tomonlarning argumentlarini baholang va qisqa javob bering.
FORMAT:
## Baholash
(qisqa baho)
## Keyingi qadam
(1 qadam)`;

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

Sen sudyasan. Yakuniy hukmni chiqaring.
FORMAT:
## Qaror
(2-3 jumla qaror)
## Asos
(qonuniy asos)`;

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
