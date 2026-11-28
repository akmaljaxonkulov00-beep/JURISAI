import {
  CourtRole,
  CourtScenario,
  CourtStage,
  CourtSessionState,
  StructuredAiResponse,
  UserActionPayload,
} from './court-types'
import { groundPrompt, validateCitations, appendCitationNote } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { callGemini } from '@/lib/gemini'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const CANDIDATE_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']

/**
 * Universal Court AI: Google Gemini birlamchi, Groq zaxira.
 */
async function callCourtAiJson(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2500
): Promise<string> {
  // 1. Google Gemini orqali so'rov (bepul, yuridik jihatdan aniq)
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiRes = await callGemini(userPrompt, {
        systemInstruction: systemPrompt,
        maxTokens,
        temperature: 0.2,
        responseJson: true,
      })
      if (geminiRes && geminiRes.trim()) {
        return geminiRes
      }
    } catch (err: any) {
      console.warn('[Court AI] Gemini attempt failed, falling back to Groq:', err.message)
    }
  }

  // 2. Zaxira: Groq API
  return callGroqJson(systemPrompt, userPrompt, maxTokens)
}

/**
 * Groq API ga JSON rejimida xavfsiz so'rov yuboradi (Zaxira).
 */
async function callGroqJson(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2500
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY sozlanmagan')
  }

  let lastError = ''
  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content && content.trim()) {
          return content
        }
      } else {
        const errText = await res.text().catch(() => '')
        lastError = `Model ${model} failed (${res.status}): ${errText.slice(0, 150)}`
        console.warn('Groq court AI attempt failed:', lastError)
      }
    } catch (e: any) {
      clearTimeout(timeoutId)
      lastError = e.name === 'AbortError' ? 'AI timeout (25s)' : e.message
      console.warn(`Groq court AI error with ${model}:`, lastError)
    }
  }

  throw new Error(`AI xizmatida xatolik yuz berdi: ${lastError || 'Barcha modellar band'}`)
}

/**
 * AI javobini JSON sifatida parse qiladi, buzilgan bo'lsa xavfsiz tuzatadi.
 */
function safeParseAiResponse(
  raw: string,
  userRole: CourtRole,
  fallbackAiSpeaker?: { name: string; role: string },
  isOpening = false
): StructuredAiResponse {
  try {
    let cleanRaw = raw.trim()
    if (cleanRaw.startsWith('```json')) cleanRaw = cleanRaw.slice(7)
    else if (cleanRaw.startsWith('```')) cleanRaw = cleanRaw.slice(3)
    if (cleanRaw.endsWith('```')) cleanRaw = cleanRaw.slice(0, -3)
    cleanRaw = cleanRaw.trim()

    let parsed: any = null
    try {
      parsed = JSON.parse(cleanRaw)
    } catch {
      const jsonMatch = cleanRaw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    }
    if (parsed && Array.isArray(parsed.speakers) && parsed.speakers.length > 0) {
      // Strictly exclude speakers matching the user's selected role so AI never impersonates the user
      const filteredSpeakers = parsed.speakers
        .filter((s: any) => String(s.role || '').toUpperCase().trim() !== userRole)
        .map((s: any) => ({
          speaker: ensureUzbekLatin(s.speaker || 'Ishtirokchi'),
          role: String(s.role || fallbackAiSpeaker?.role || 'SUDYA').toUpperCase(),
          message: ensureUzbekLatin(s.message || ''),
          action: s.action || 'speak',
          evidence_reference: Array.isArray(s.evidence_reference) ? s.evidence_reference : [],
          reaction_to_user: s.reaction_to_user ? ensureUzbekLatin(s.reaction_to_user) : undefined,
        }))
        .filter((s: any) => s.message.length > 0)

      const safeSpeakers =
        filteredSpeakers.length > 0
          ? filteredSpeakers
          : [
              {
                speaker: fallbackAiSpeaker?.name || (userRole === 'SUDYA' ? 'Sud kotibi' : 'Sud raisi'),
                role: fallbackAiSpeaker?.role || (userRole === 'SUDYA' ? 'KOTIB' : 'SUDYA'),
                message:
                  userRole === 'SUDYA'
                    ? 'Muhtaram Sudya, taraflar sizning protsessual qaroringizni kutmoqda.'
                    : `Rahmat. ${userRole}ning bayonoti qayd etildi. Endi sud yoki qarshi taraf fikri tinglanadi.`,
                action: 'speak',
                evidence_reference: [],
              },
            ]

      return {
        speakers: safeSpeakers,
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

  // Fallback: Agar JSON buzilgan bo'lsa yoki bo'sh bo'lsa
  const cleanText = ensureUzbekLatin(raw.replace(/[{}\[\]"]/g, '').trim())
  const fallbackSpeaker = userRole === 'SUDYA' ? 'PROKUROR' : 'SUDYA'
  
  let fallbackMessage = cleanText.slice(0, 600)
  if (!fallbackMessage || fallbackMessage.length < 20) {
    if (isOpening) {
      if (userRole === 'ADVOKAT') {
        fallbackMessage =
          'O‘zbekiston Respublikasi nomidan! Sud majlisi ochiq deb e’lon qilinadi. Raislik qiluvchi: Farhod Ergashev. Zalda davlat ayblovchisi, himoyachi advokat va sudlanuvchi hozir. JPK talablariga muvofiq taraflarga o‘z protsessual huquq va majburiyatlari tushuntiriladi. Dastlabki iltimosnomalar bormi? So‘z himoyachi advokatga beriladi.'
      } else if (userRole === 'PROKUROR') {
        fallbackMessage =
          'O‘zbekiston Respublikasi nomidan! Sud majlisi ochiq deb e’lon qilinadi. Ish materiallari va taraflarning hozirligi tekshirildi. JPK talablariga muvofiq taraflarga huquqlari tushuntirildi. Ish bo‘yicha dastlabki iltimosnomalar bormi? So‘z davlat ayblovchisiga beriladi.'
      } else {
        fallbackMessage =
          'Barcha o‘rnidan tursin, sud kelmoqda! Jinoyat ishlari bo‘yicha sud zaliga raislik qiluvchi sudya tashrif buyurdi. Barcha chaqirilgan ishtirokchilar zalda hozir. Muhtaram Sudya, marhamat, sud majlisini ochiq deb e’lon qiling.'
      }
    } else {
      // In-session fallback: NEVER re-open hearing!
      if (userRole === 'SUDYA') {
        fallbackMessage = 'Muhtaram Sudya, taraflar navbatdagi protsessual ajrimingizni yoki savolingizni kutmoqda.'
      } else {
        fallbackMessage = 'Vajlaringiz sud tomonidan qabul qilindi va majlis bayonnomasiga kiritildi. Ish bo‘yicha keyingi protsessual masalaga o‘tamiz.'
      }
    }
  }

  return {
    speakers: [
      {
        speaker: fallbackSpeaker === 'SUDYA' ? 'Sud raisi' : 'Davlat ayblovchisi',
        role: fallbackSpeaker === 'SUDYA' ? 'SUDYA' : 'PROKUROR',
        message: fallbackMessage,
        action: 'speak',
      },
    ],
    user_feedback: {
      valid_procedural_move: true,
      critique: isOpening ? 'Sud majlisi rasmiy ochildi.' : 'Bildirilgan fikr protsessual tartibda eshitildi.',
      etiquette_score_delta: 0,
      argument_score_delta: 0,
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

  // 1. AI boshqaradigan participantlar (userdan tashqari barcha, session.participant_state asosida)
  const sourceParticipants =
    session.participant_state && session.participant_state.length > 0
      ? session.participant_state
      : scenario.participants
  const aiParticipants = sourceParticipants.filter(
    p =>
      !p.isUser &&
      (p.role || '').toUpperCase() !== userRole &&
      (isOpening || (p.role || '').toUpperCase() !== 'KOTIB')
  )

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
2. Har bir burilishda (turn) 1 tadan 2 tagacha eng mantiqiy va mos AI ishtirokchisi gapirsin.
3. ${
    !isOpening
      ? `DIQQAT: Sud majlisi ALLAQACHON OCHILGAN VA TARAFLAR SHAXSI TEKSHIRILGAN! "Sud majlisini ochiq deb e'lon qilaman", "O'zbekiston Respublikasi nomidan majlis ochiq", "Ishtirokchilarning hozirligini tekshirishga o'tamiz", "bayonnoma yuritishga tayyorman" kabi ochilish jumlalarini QAYTA AYTISH QAT'IYAN TAQIQLANADI! AI ishtirokchisi foydalanuvchining so'nggi aytgan gapiga bevosita yuridik javob bersin va protsessni oldinga siljitsin.`
      : ''
  }
4. Sud kotibi (KOTIB) majlis ochilgach jim turadi, har replikada aralashmaydi.
5. Qatnashchilar O'Z BILIMIDAN TASHQARIDAGI maxfiy ma'lumotlarni bilmaydi.
6. Qatnashchilar oldingi aytgan gaplariga zid gapirmasligi (xotira izchilligi) SHART.
7. Har bir AI javobi professional, rasmiy sud tilida, O'zbekiston sud amaliyotiga mos bo'lsin.
8. Til: Faqat lotin alifbosidagi o'zbek tili.
9. Yolg'on yoki mavjud bo'lmagan qonun moddalarini to'qima (taxmin qilmang), faqat BAZA MA'LUMOTLARI va amaldagi O'zbekiston qonunchiligiga tayan.

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
    "critique": "Foydalanuvchining so'nggi harakati va nutqi bo'yicha chuqur yuridik tahlil (nima to'g'ri, nima xato bo'ldi)",
    "etiquette_score_delta": 5, // Sud etikasiga rioya uchun (+5 dan +10 gacha; tartibbuzarlik uchun -5 dan -20 gacha)
    "argument_score_delta": 10, // Kuchli qonuniy argument va modda keltirsa (+5 dan +15 gacha; asossiz bo'lsa -5 dan -10 gacha)
    "evidence_score_delta": 10 // Dalillarga tayansa (+5 dan +20 gacha; dalillarsiz bo'lsa 0)
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
    if (userRole === 'SUDYA') {
      userPrompt = `Sud majlisi ochilish vaqti keldi. Foydalanuvchi ${userName} "SUDYA" (Sud Raisi) sifatida majlisni boshqaradi.
Birinchi bo‘lib Kotiba (Sud kotibi) so‘zlasin:
"Barcha o‘rnidan tursin, sud kelmoqda! Jinoyat ishlari bo‘yicha sud zaliga raislik qiluvchi sudya ${userName} tashrif buyurdi. Zalda barcha chaqirilgan ishtirokchilar hozir."
So‘ng Sudya ${userName}ga sud majlisini rasman ochiq deb e’lon qilish va taraflar shaxsini tekshirish uchun navbat berilsin.`
    } else {
      userPrompt = `Sud majlisini O‘zbekiston Respublikasi protsessual qonunchiligi (JPK, FPK, IPK yoki MSIYuK) talablariga binoan rasman OCHING.
Foydalanuvchi ${userName} "${userRole}" rolida ishtirok etmoqda.

Birinchi navbatda Sud Raisi (SUDYA) quyidagi ketma-ketlikda gapirishi SHART:
1. "O‘zbekiston Respublikasi nomidan! Sud majlisi ochiq deb e’lon qilinadi!"
2. Ishtirokchilarning hozirligini tekshirsin, jumladan foydalanuvchi ${userName} (${userRole}) hozirligini qayd etsin.
3. Taraflarga o‘z protsessual huquqlari va rad etish (otvod) huquqini tushuntirsin.
4. Dastlabki iltimosnomalar bor-yo‘qligini so‘rasin va so‘z navbatini foydalanuvchi ${userName} (${userRole})ga bersin.`
    }
  } else if (userAction) {
    userPrompt = `DIQQAT: Sud majlisi allaqachon ochiq deb e'lon qilingan va davom etmoqda!
Majlisni qayta ochish yoki ishtirokchilar ro'yxatini qayta tekshirish QAT'IYAN TAQIQLANADI!

Foydalanuvchi (${userName}, roli: ${userRole}) sudda quyidagi protsessual bayonot/harakatni bildirdi:
Turi: ${userAction.type}
Matn: "${userAction.text}"
${userAction.targetRole ? `Murojaat qilingan shaxs: ${userAction.targetRole}` : ''}
${userAction.evidenceId ? `Taqdim etilgan dalil ID: ${userAction.evidenceId}` : ''}

Hozirgi bosqich: "${stage.title}".
Mavjud dalillar holati:
${evidenceSummary}

Oldingi ko'rsatmalar:
${statementsSummary || "Hali ko'rsatmalar berilmagan."}

AI ishtirokchilari (sudya yoki qarshi taraf) foydalanuvchining bu gapiga mantiqan va qonunan bevosita javob qaytarsin. Agar foydalanuvchi shaxsini tasdiqlagan bo'lsa ("tasdiqlayman"), sudya buni qabul qilib, ish bo'yicha e'tiroz yoki dastlabki iltimosnomalar borligini so'rasin.`
  } else {
    userPrompt = `Hozirgi bosqich: "${stage.title}". Jarayonni protsessual qonunchilikka binoan davom ettiring.`
  }

  // AI chaqiruvi (Google Gemini primary, Groq fallback)
  let rawJson = ''
  try {
    rawJson = await callCourtAiJson(groundedSystem, userPrompt)
  } catch (err) {
    console.warn('Primary AI call failed, retrying once:', err)
    rawJson = await callCourtAiJson(SYSTEM_PROMPT, userPrompt)
  }

  const fallbackAiSpeaker = aiParticipants[0]
    ? { name: aiParticipants[0].name, role: aiParticipants[0].role }
    : undefined
  const parsed = safeParseAiResponse(rawJson, userRole, fallbackAiSpeaker, isOpening)

  // Validate legal citations in AI courtroom speeches
  try {
    for (const spk of parsed.speakers) {
      if (spk.message) {
        const citeResult = await validateCitations(spk.message)
        if (citeResult.invalid.length > 0) {
          spk.message = appendCitationNote(spk.message, citeResult)
        }
      }
    }
  } catch {
    // Non-blocking citation check
  }

  return parsed
}
