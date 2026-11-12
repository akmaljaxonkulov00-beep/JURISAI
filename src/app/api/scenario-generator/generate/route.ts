import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { callGemini } from '@/lib/gemini'
import { CreateScenarioFormInput, ScenarioData } from '@/types/scenario-generator'
import {
  validateScenarioLegalIntegrity,
  VERIFIED_SCENARIO_TEMPLATES,
} from '@/lib/scenario-generator-engine'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

function parseAndRepairScenarioJson(raw: string): ScenarioData | null {
  if (!raw || !raw.trim()) return null
  let str = raw.trim()

  // 1. Remove markdown fences
  if (str.startsWith('```json')) {
    str = str.slice(7)
  } else if (str.startsWith('```')) {
    str = str.slice(3)
  }
  if (str.endsWith('```')) {
    str = str.slice(0, -3)
  }
  str = str.trim()

  // 2. Extract between first '{' and last '}'
  const startIdx = str.indexOf('{')
  const endIdx = str.lastIndexOf('}')
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    str = str.substring(startIdx, endIdx + 1)
  }

  // 3. Try standard parse
  try {
    return JSON.parse(str) as ScenarioData
  } catch {
    // 4. Bracket repair if truncated
    try {
      let repaired = str.replace(/,\s*$/, '')
      let openBraces = (repaired.match(/\{/g) || []).length
      let closeBraces = (repaired.match(/\}/g) || []).length
      let openBrackets = (repaired.match(/\[/g) || []).length
      let closeBrackets = (repaired.match(/\]/g) || []).length

      while (openBrackets > closeBrackets) {
        repaired += ']'
        closeBrackets++
      }
      while (openBraces > closeBraces) {
        repaired += '}'
        closeBraces++
      }
      return JSON.parse(repaired) as ScenarioData
    } catch {
      return null
    }
  }
}

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

    if (!GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
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

    const SYSTEM_PROMPT = `Sen O'zbekiston Respublikasining 2026-yilgi amaldagi qonunchiligi (LexUZ, 21 ta Kodeks, Oliy Sud Plenumi qarorlari) bo'yicha interaktiv yuridik amaliyot simulyatori yaratuvchi ekspert tizimsan.

QAT'IY TALABLAR:
1. Faqat O'zbekiston Respublikasining 2026-yilgi AMALDAGI qonun va moddalarini (FK, FPK, JK, JPK, MK, MJtK, OK, SK va h.k.) ishlat.
2. Hech qachon xayoliy modda yoki qonun to'qima.
3. Decision points soni 2 tadan 3 tagacha bo'lsin. Har bir bosqichda 2-3 ta aniq tanlov varianti (kamida 1 tasi optimal) bo'lsin.
4. Javobni FAQAT valid toza JSON formatida qaytar (markdown bloklar \`\`\`json bo'lmasin):

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
    { "id": "ev1", "title": "Hujjat nomi", "type": "document", "description": "Tavsifi", "reliability": "high", "is_admissible": true, "legal_basis": "FK modda", "discovered": true }
  ],
  "timeline": [
    { "date": "2026-01-15", "event": "Voqea", "significance": "Huquqiy oqibat" }
  ],
  "legal_issues": [
    { "id": "li1", "question": "Huquqiy nizo masalasi?", "applicable_articles": ["FK 354-modda"], "official_source_url": "https://lex.uz" }
  ],
  "decision_points": [
    {
      "id": "dp1",
      "step_number": 1,
      "stage_title": "1-bosqich: Dastlabki protsessual harakat",
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

Til: FAQAT LOTIN ALIFBOSIDAGI O'ZBEK TILI.`

    const { prompt: systemPrompt } = await groundPrompt(
      `${topic} ${domain} ${focusAreas.join(' ')} ${additionalRequirements}`,
      SYSTEM_PROMPT
    )

    const userPrompt = `Yangi amaliy yuridik simulyatsiya senariysi yarat:
Soha: ${domain}
Qiyinlik darajasi: ${difficulty}
Foydalanuvchi roli: ${role}
Maqsad: ${objective}
Mavzu/Vaziyat: ${topic || '2026-yilgi amaliy huquqiy nizo'}
Diqqat markazlari: ${focusAreas.join(', ') || 'Umumiy huquqiy tahlil'}
Qo‘shimcha talablar: ${additionalRequirements || 'Standart professional amaliyot'}.
Bo‘limlarni ixcham, tizimli va to‘liq JSON ko‘rinishida tuz.`

    const CANDIDATE_GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']

    let contentStr = ''
    let lastError = ''

    // ── 1. Google Gemini orqali senariy yaratish (Birlamchi va barqaror) ──
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await callGemini(userPrompt, {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          maxTokens: 8192,
          responseJson: true,
        })
        if (geminiRes && geminiRes.trim()) {
          contentStr = geminiRes
        }
      } catch (geminiErr: any) {
        console.warn('Gemini Scenario urinishi xatoligi, Groq’ga o‘tilmoqda:', geminiErr.message)
        lastError = geminiErr.message
      }
    }

    // ── 2. Zaxira: Groq API ──
    if (!contentStr && GROQ_API_KEY) {
      for (const model of CANDIDATE_GROQ_MODELS) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 25000)

        try {
          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.3,
              max_tokens: 8192,
              response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const aiRes = await response.json()
            contentStr = aiRes.choices?.[0]?.message?.content || ''
            if (contentStr.trim()) break
          } else {
            const errorText = await response.text().catch(() => '')
            lastError = `Model ${model} failed (${response.status}): ${errorText.slice(0, 150)}`
            console.warn('Groq scenario generate attempt failed:', lastError)
          }
        } catch (e: any) {
          clearTimeout(timeoutId)
          lastError = e.name === 'AbortError' ? 'AI timeout (25s)' : e.message
          console.warn(`Groq scenario generate error with ${model}:`, lastError)
        }
      }
    }

    let scenarioData: ScenarioData | null = parseAndRepairScenarioJson(contentStr)

    // ── 3. Agar AI modellari band bo‘lsa, rasmiy tasdiqlangan andozadan moslashtirib berish ──
    if (!scenarioData) {
      console.warn('AI senariy generatsiyasi muvaffaqiyatsiz, andozadan foydalanilmoqda:', lastError)
      const matchingTemplate =
        VERIFIED_SCENARIO_TEMPLATES.find(t => t.legal_domain === domain) ||
        VERIFIED_SCENARIO_TEMPLATES[0]

      if (matchingTemplate) {
        scenarioData = JSON.parse(JSON.stringify(matchingTemplate)) as ScenarioData
        scenarioData.id = `sc_${Date.now()}`
        scenarioData.title = topic ? ensureUzbekLatin(topic) : scenarioData.title
        scenarioData.difficulty = difficulty as any
        scenarioData.user_role = role as any
        scenarioData.objective = objective as any
      }
    }

    if (!scenarioData) {
      return NextResponse.json(
        { error: 'Senariy yaratishda xatolik yuz berdi. Qayta urinib ko‘ring.' },
        { status: 502 }
      )
    }

    // Ensure Uzbek Latin for text fields
    if (scenarioData.title) scenarioData.title = ensureUzbekLatin(scenarioData.title)
    if (scenarioData.background) scenarioData.background = ensureUzbekLatin(scenarioData.background)
    if (Array.isArray(scenarioData.facts)) {
      scenarioData.facts = scenarioData.facts.map(f => ({
        ...f,
        statement: ensureUzbekLatin(f.statement || ''),
      }))
    }
    if (Array.isArray(scenarioData.participants)) {
      scenarioData.participants = scenarioData.participants.map(p => ({
        ...p,
        name: ensureUzbekLatin(p.name || ''),
        role: ensureUzbekLatin(p.role || ''),
        background: ensureUzbekLatin(p.background || ''),
        interests: ensureUzbekLatin(p.interests || ''),
      }))
    }
    if (Array.isArray(scenarioData.evidence)) {
      scenarioData.evidence = scenarioData.evidence.map(e => ({
        ...e,
        title: ensureUzbekLatin(e.title || ''),
        description: ensureUzbekLatin(e.description || ''),
        legal_basis: e.legal_basis ? ensureUzbekLatin(e.legal_basis) : undefined,
      }))
    }
    if (Array.isArray(scenarioData.decision_points)) {
      scenarioData.decision_points = scenarioData.decision_points.map(dp => ({
        ...dp,
        stage_title: ensureUzbekLatin(dp.stage_title || ''),
        prompt: ensureUzbekLatin(dp.prompt || ''),
        options: Array.isArray(dp.options)
          ? dp.options.map(opt => ({
              ...opt,
              label: ensureUzbekLatin(opt.label || ''),
              description: ensureUzbekLatin(opt.description || ''),
              consequence: ensureUzbekLatin(opt.consequence || ''),
              feedback: ensureUzbekLatin(opt.feedback || ''),
            }))
          : [],
      }))
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
