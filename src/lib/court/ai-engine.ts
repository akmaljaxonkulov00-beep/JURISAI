import {
  CourtRole,
  CourtScenario,
  CourtStage,
  CourtSessionState,
  StructuredAiResponse,
  UserActionPayload,
} from './court-types'
import { groundPrompt } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'

/**
 * Groq API ga JSON rejimida xavfsiz so'rov yuboradi.
 */
async function callGroqJson(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2500
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || 'test-groq-key'

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('Groq court AI error:', res.status, errText.slice(0, 300))
    throw new Error(`AI xizmatida xatolik yuz berdi (${res.status})`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI xizmatidan bo‘sh javob qaytdi')
  }
  return content
}

/**
 * AI javobini JSON sifatida parse qiladi, buzilgan bo'lsa xavfsiz tuzatadi.
 */
function safeParseAiResponse(raw: string, userRole: CourtRole): StructuredAiResponse {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.speakers) && parsed.speakers.length > 0) {
      return {
        speakers: parsed.speakers.map((s: any) => ({
          speaker: ensureUzbekLatin(s.speaker || 'Ishtirokchi'),
          role: s.role || 'SUDYA',
          message: ensureUzbekLatin(s.message || ''),
          action: s.action || 'speak',
          evidence_reference: Array.isArray(s.evidence_reference) ? s.evidence_reference : [],
          reaction_to_user: s.reaction_to_user ? ensureUzbekLatin(s.reaction_to_user) : undefined,
        })),
        stage_update: parsed.stage_update,
        user_feedback: parsed.user_feedback
          ? {
              valid_procedural_move: Boolean(parsed.user_feedback.valid_procedural_move),
              critique: ensureUzbekLatin(parsed.user_feedback.critique || ''),
              etiquette_score_delta: Number(parsed.user_feedback.etiquette_score_delta) || 0,
              argument_score_delta: Number(parsed.user_feedback.argument_score_delta) || 0,
              evidence_score_delta: Number(parsed.user_feedback.evidence_score_delta) || 0,
            }
          : undefined,
        suggested_actions: Array.isArray(parsed.suggested_actions)
          ? parsed.suggested_actions.map((a: any) => ({
              action_id: a.action_id || 'speak',
              label: ensureUzbekLatin(a.label || 'Davom etish'),
              description: a.description ? ensureUzbekLatin(a.description) : undefined,
            }))
          : undefined,
      }
    }
  } catch (e) {
    console.warn('AI JSON parse warning, attempting fallback extraction:', e)
  }

  // Fallback: Agar JSON buzilgan bo'lsa, xavfsiz struktura yaratamiz
  const cleanText = ensureUzbekLatin(raw.replace(/[{}\[\]"]/g, '').trim())
  const fallbackSpeaker = userRole === 'SUDYA' ? 'PROKUROR' : 'SUDYA'
  return {
    speakers: [
      {
        speaker: fallbackSpeaker === 'SUDYA' ? 'Sud raisi' : 'Davlat ayblovchisi',
        role: fallbackSpeaker,
        message: cleanText.slice(0, 600) || 'Sud majlisi tartibiga muvofiq davom etamiz.',
        action: 'speak',
      },
    ],
    user_feedback: {
      valid_procedural_move: true,
      critique: 'Protsessual harakat qayd etildi.',
      etiquette_score_delta: 0,
      argument_score_delta: 5,
      evidence_score_delta: 0,
    },
  }
}

/**
 * Virtual Sud uchun AI generatori (Start va Har bir Harakat uchun)
 */
export async function generateCourtAiTurn(params: {
  scenario: CourtScenario
  stage: CourtStage
  userRole: CourtRole
  userName: string
  session: CourtSessionState
  userAction?: UserActionPayload
  isOpening?: boolean
}): Promise<StructuredAiResponse> {
  const { scenario, stage, userRole, userName, session, userAction, isOpening } = params

  // 1. AI boshqaradigan participantlar (userdan tashqari barcha)
  const aiParticipants = scenario.participants.filter(p => p.role !== userRole)

  // 2. Xotira: oldingi ko'rsatmalar
  const statementsSummary = session.participant_state
    .filter(p => p.statementsMade && p.statementsMade.length > 0)
    .map(p => `${p.name} (${p.title}): ${p.statementsMade?.slice(-2).join('; ')}`)
    .join('\n')

  // 3. Dalillar holati
  const evidenceSummary = session.evidence_state
    .map(e => `- [${e.id}] ${e.title} (${e.status}, turi: ${e.type})`)
    .join('\n')

  // 4. Qatnashchilarning ruxsat etilgan bilimlari (maxfiy faktlar yashirilgan!)
  const personasPrompt = aiParticipants
    .map(
      p => `• ${p.name} | Roli: ${p.role} (${p.title})
  Maqsadi: ${p.objective}
  Muloqot uslubi: ${p.communicationStyle}
  Biladigan ma'lumotlari: ${p.allowedKnowledge.join(', ')}`
    )
    .join('\n\n')

  // 5. Asosiy tizim prompti
  const SYSTEM_PROMPT = `Sen Juristiv — O'zbekiston Respublikasi protsessual qonunchiligi (JPK, FPK, BSK, FK, JK, MK, OK) bo'yicha virtual sud simulyatori sun'iy intellekt hisoblanasan.

ISH NOMI: "${scenario.title}"
KATEGORIYA: ${scenario.category}
PROTSEDURA TURI: ${scenario.procedure_type}
FAKTIK HOLAT:
${scenario.facts}

QONUNIY ASOSLAR:
${scenario.legal_basis.map(l => `- ${l.code} ${l.article}: ${l.title} (${l.relevance})`).join('\n')}

HOZIRGI PROTSESSUAL BOSQICH:
- Bosqich: "${stage.title}" (${stage.legalName})
- Mazmuni: ${stage.description}

FOYDALANUVCHI:
- Ismi: ${userName}
- Tanlagan roli: ${userRole}
DIQQAT: "${userRole}" roli UCHUN HECH QACHON gapirma! Bu rolda faqat foydalanuvchi ${userName} o'zi gapiradi.

SEN FAQAT QUYIDAGI AI ISHTIROKCHILARI NOMIDAN GAPIRASAN:
${personasPrompt}

QAT'IY PROTSESSUAL VA FORMAT QOIDALARI:
1. FAQAT va FAQAT to'g'ri JSON formatida javob ber. Hech qanday markdown prefiks yoki tashqi matn yozma.
2. Har bir burilishda (turn) 1 tadan 3 tagacha eng mantiqiy va mos AI ishtirokchisi gapirsin (barcha rollar birdaniga gapirmasin).
3. Qatnashchilar O'Z BILIMIDAN TASHQARIDAGI maxfiy ma'lumotlarni bilmaydi.
4. Qatnashchilar oldingi aytgan gaplariga zid gapirmasligi (xotira izchilligi) SHART.
5. Har bir AI javobi professional, rasmiy sud tilida, O'zbekiston sud amaliyotiga mos bo'lsin.
6. Til: Faqat lotin alifbosidagi o'zbek tili.
7. Yolg'on yoki mavjud bo'lmagan qonun moddalarini to'qima (taxmin qilmang), faqat BAZA MA'LUMOTLARI va amaldagi O'zbekiston qonunchiligiga tayan.

JSON SCHEMA:
{
  "speakers": [
    {
      "speaker": "Ism Familiya",
      "role": "SUDYA|PROKUROR|ADVOKAT|SUDLANUVCHI|GUVOH|EKSPERT|KOTIB",
      "message": "To'liq, batafsil va realistik nutq (kamida 2-4 jumla)",
      "action": "speak|question|ruling|object",
      "evidence_reference": ["ev_1"] // agar dalilga murojaat qilinsa
    }
  ],
  "stage_update": {
    "ready_for_next_stage": false,
    "next_stage_recommendation": null,
    "reason": "..."
  },
  "user_feedback": {
    "valid_procedural_move": true,
    "critique": "Foydalanuvchining so'nggi harakati bo'yicha qisqa huquqiy tahlil",
    "etiquette_score_delta": 0,
    "argument_score_delta": 5,
    "evidence_score_delta": 0
  },
  "suggested_actions": [
    {
      "action_id": "harakat_id",
      "label": "Foydalanuvchiga tavsiya etiladigan keyingi harakat",
      "description": "Izoh"
    }
  ]
}`

  // RAG: qonunchilik bazasidan moddalar bilan mustahkamlash
  let groundedSystem = SYSTEM_PROMPT
  try {
    const grounded = await groundPrompt(scenario.facts + ' ' + stage.title, SYSTEM_PROMPT, 4)
    groundedSystem = grounded.prompt
  } catch {}

  // User input tayyorlash
  let userPrompt = ''
  if (isOpening) {
    userPrompt = `Sud majlisini oching. Foydalanuvchi ${userName} "${userRole}" rolida zalda hozir bo'lib turibdi.
Majlis tartibi bo'yicha birinchi navbatda tegishli shaxs (agar foydalanuvchi Sudya bo'lsa Kotiba, aks holda Sud raisi) majlisni ochsin va jarayonni qonuniy boshlasin.`
  } else if (userAction) {
    userPrompt = `Foydalanuvchi (${userName}, roli: ${userRole}) quyidagi protsessual harakatni amalga oshirdi:
Turi: ${userAction.type}
Matn: "${userAction.text}"
${userAction.targetRole ? `Murojaat qilingan shaxs: ${userAction.targetRole}` : ''}
${userAction.evidenceId ? `Taqdim etilgan dalil ID: ${userAction.evidenceId}` : ''}

Mavjud dalillar holati:
${evidenceSummary}

Oldingi ko'rsatmalar:
${statementsSummary || "Hali ko'rsatmalar berilmagan."}

Ushbu harakatga AI ishtirokchilari nomidan munosib protsessual reaksiya bering.`
  } else {
    userPrompt = `Hozirgi bosqich: "${stage.title}". Jarayonni protsessual qonunchilikka binoan davom ettiring.`
  }

  // AI chaqiruvi (retry bilan)
  let rawJson = ''
  try {
    rawJson = await callGroqJson(groundedSystem, userPrompt)
  } catch (err) {
    console.warn('Primary AI call failed, retrying once:', err)
    rawJson = await callGroqJson(SYSTEM_PROMPT, userPrompt)
  }

  return safeParseAiResponse(rawJson, userRole)
}
