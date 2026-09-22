import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { CreateScenarioFormInput, ScenarioData } from '@/types/scenario-generator'
import { validateScenarioLegalIntegrity } from '@/lib/scenario-generator-engine'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * POST /api/scenario-generator/generate
 * Generates fully structured 2026 legal practice simulation scenario.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = (await request.json().catch(() => ({}))) as CreateScenarioFormInput

    const domain = body.domain || 'civil'
    const difficulty = body.difficulty || 'intermediate'
    const role = body.role || 'advokat'
    const objective = body.objective || 'irac'
    const topic = String(body.topic || '').trim()
    const focusAreas = Array.isArray(body.focus_areas) ? body.focus_areas : []
    const additionalRequirements = String(body.additional_requirements || '').trim()

    if (!topic && focusAreas.length === 0) {
      return NextResponse.json(
        { error: 'Senariy mavzusi yoki diqqat markazlari kiritilishi shart' },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // Check usage limits
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'scenario',
      metadata: { topic, domain, difficulty },
    })

    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const SYSTEM_PROMPT = `Sen O‘zbekiston Respublikasining 2026-yilgi amaldagi qonunchiligi (LexUZ, Oliy Sud Plenumi qarorlari, Kodekslar) bo‘yicha interaktiv yuridik amaliyot simulyatori yaratuvchi ekspert tizimsan.

QAT’IY TALABLAR:
1. Faqat O‘zbekiston Respublikasining 2026-yil 22-sentabr holatidagi AMALDAGI qonun va moddalarini ishlat.
2. Hech qachon xayoliy modda yoki qonun to‘qima.
3. Javobni FAQAT valid JSON formatida qaytar (hech qanday markdown \`\`\`json tegisiz, toza JSON obyekt):

{
  "id": "sc_${Date.now()}",
  "title": "Senariy nomi",
  "legal_domain": "${domain}",
  "difficulty": "${difficulty}",
  "objective": "${objective}",
  "user_role": "${role}",
  "background": "Ish holati bayoni (aniq faktlar, tomonlar, summalar, sanalar bilan)",
  "facts": [
    { "id": "f1", "statement": "Fakt bayoni", "is_contested": false, "date": "2026-01-15" },
    { "id": "f2", "statement": "Ikkinchi fakt", "is_contested": true }
  ],
  "participants": [
    { "id": "p1", "name": "Ishtirokchi 1", "role": "Mijoz / Da'vogar", "background": "Tavsifi", "interests": "Maqsadi" },
    { "id": "p2", "name": "Ishtirokchi 2", "role": "Javobgar / Qarshi taraf", "background": "Tavsifi", "interests": "Maqsadi" }
  ],
  "evidence": [
    { "id": "ev1", "title": "Hujjat nomi", "type": "document", "description": "Tavsifi", "reliability": "high", "is_admissible": true, "legal_basis": "FK modda", "discovered": true },
    { "id": "ev2", "title": "Yashirin/yig'ilishi kerak bo'lgan dalil", "type": "testimony", "description": "Tavsifi", "reliability": "medium", "is_admissible": true, "discovered": false }
  ],
  "timeline": [
    { "date": "2026-01-15", "event": "Voqea", "significance": "Huquqiy oqibat" }
  ],
  "legal_issues": [
    { "id": "li1", "question": "Huquqiy nizo masalasi?", "applicable_articles": ["FK 354-modda", "670-I-son Qonun 25-modda"], "official_source_url": "https://lex.uz" }
  ],
  "decision_points": [
    {
      "id": "dp1",
      "step_number": 1,
      "stage_title": "1-bosqich: Dastlabki harakat",
      "prompt": "Vaziyat bo'yicha qanday qaror qabul qilasiz?",
      "options": [
        {
          "id": "opt_1",
          "label": "Optimal yuridik harakat",
          "action_type": "inspect_document",
          "description": "Batafsil tushuntirish",
          "consequence": "Harakat natijasi",
          "xp": 30,
          "is_optimal": true,
          "feedback": "Nega bu to'g'ri?"
        },
        {
          "id": "opt_2",
          "label": "Xato yoki sub-optimal harakat",
          "action_type": "court_application",
          "description": "Batafsil tushuntirish",
          "consequence": "Salbiy oqibat",
          "xp": 5,
          "is_optimal": false,
          "feedback": "Nega bu noto'g'ri?"
        }
      ]
    }
  ],
  "learning_outcomes": ["O'rganiladigan bilim 1", "Bilim 2"],
  "sources": [
    { "name": "Fuqarolik Kodeksi", "url": "https://lex.uz/docs/111189", "number": "FK" }
  ],
  "validation": {
    "is_valid": true,
    "checked_articles": ["FK 354-modda"],
    "legal_consistency_score": 100
  }
}

Til: FAQAT LOTIN ALIFBOSIDAGI O‘ZBEK TILI.`

    const { prompt: systemPrompt } = await groundPrompt(
      `${topic} ${domain} ${focusAreas.join(' ')} ${additionalRequirements}`,
      SYSTEM_PROMPT
    )

    const userPrompt = `Yangi amaliy senariy yarat:
Soha: ${domain}
Qiyinlik: ${difficulty}
Foydalanuvchi roli: ${role}
Maqsad: ${objective}
Mavzu/Vaziyat: ${topic || '2026-yilgi amaliy huquqiy nizo'}
Diqqat markazlari: ${focusAreas.join(', ') || 'Umumiy huquqiy tahlil'}
Qo‘shimcha talablar: ${additionalRequirements || 'Standart professional amaliyot'}`

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 3500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq scenario generate error:', errorText)
      return NextResponse.json({ error: 'AI xizmati vaqtincha band' }, { status: response.status })
    }

    const aiRes = await response.json()
    const contentStr = aiRes.choices[0]?.message?.content || '{}'
    let scenarioData: ScenarioData

    try {
      scenarioData = JSON.parse(contentStr) as ScenarioData
    } catch {
      return NextResponse.json(
        { error: 'AI javobini tahlil qilishda xatolik yuz berdi' },
        { status: 502 }
      )
    }

    // Apply strict legal integrity validation
    const validation = validateScenarioLegalIntegrity(scenarioData)
    scenarioData.validation = {
      is_valid: validation.isValid,
      checked_articles: scenarioData.validation?.checked_articles || [],
      legal_consistency_score: validation.score,
      notes: validation.notes,
    }

    return NextResponse.json({
      success: true,
      scenario: scenarioData,
    })
  } catch (error) {
    console.error('Scenario generation API error:', error)
    return NextResponse.json(
      { error: 'Senariy yaratishda kutilmagan server xatosi' },
      { status: 500 }
    )
  }
}
