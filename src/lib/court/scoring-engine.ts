import { CourtRole, CourtScenario, CourtSessionState, ScoringResult } from './court-types'

/**
 * Sessiya hodisalari va harakatlari asosida role-specific scoring hisoblaydi.
 */
export function calculateSessionScore(
  session: CourtSessionState,
  scenario: CourtScenario
): ScoringResult {
  const { scoring, selected_role, events, procedural_violations } = session

  // 1. Foydalanuvchi qatnashuvini tahlil qilish
  const userEvents = events.filter(e => e.role === selected_role)
  const userActionsCount = userEvents.length
  const evidenceEvents = events.filter(
    e => e.eventType === 'evidence_presented' || e.eventType === 'evidence_admitted'
  )

  // Zero participation check: agar foydalanuvchi umuman qatnashmagan bo'lsa va hech qanday ball olmagan bo'lsa
  if (userActionsCount === 0 && scoring.argument === 0 && scoring.evidence === 0 && !session.completed) {
    return {
      legalReasoning: 0,
      argumentQuality: 0,
      evidenceUsage: 0,
      proceduralCorrectness: 10,
      strategy: 0,
      impartiality: selected_role === 'SUDYA' ? 10 : undefined,
      totalScore: 5,
      xpEarned: 0,
      achievements: [],
      feedbackSummary: `Siz ${selected_role} sifatida sud majlisida birorta ham protsessual harakat yoki nutq amalga oshirmadingiz. Qonuniy pozitsiyani himoya qilish uchun sud jarayonida faol ishtirok etish shart.`,
      detailedCritique: [
        `Tanlangan rol: ${selected_role}. Ish: "${scenario.title}".`,
        `Amalga oshirilgan protsessual harakatlar soni: 0 ta (To‘liq sukut).`,
        `Huquqiy talab: Taraflar o‘z talab va vajlarini sud majlisida og‘zaki bayon qilishlari va dalillar bilan asoslashlari shart.`,
      ],
      strengths: [],
      improvements: [
        'Sud majlisida o‘z vaqtida so‘z oling va o‘z tarafingiz himoyasini amalga oshiring',
        'Ish bo‘yicha dalillarni taqdim eting va tegishli qonun moddalarini keltiring',
      ],
    }
  }

  // 2. Bazaviy ballarni shakllantirish (haqqoniy va xolis mezonlar asosida)
  const participationFactor =
    session.completed || userActionsCount >= 3
      ? 1.0
      : userActionsCount === 0
        ? 0.1
        : userActionsCount === 1
          ? 0.4
          : userActionsCount === 2
            ? 0.75
            : 1.0

  let legalReasoning = Math.min(
    100,
    Math.max(
      0,
      Math.round((20 + scoring.legalReasoning * 0.8) * participationFactor - procedural_violations.length * 10)
    )
  )
  let argumentQuality = Math.min(
    100,
    Math.max(0, Math.round((20 + scoring.argument * 0.8) * participationFactor))
  )
  let evidenceUsage = Math.min(
    100,
    Math.max(
      0,
      evidenceEvents.length > 0
        ? Math.round((40 + scoring.evidence * 0.6) * participationFactor)
        : Math.round(15 * participationFactor)
    )
  )
  let proceduralCorrectness = Math.min(
    100,
    Math.max(0, Math.round((scoring.etiquette || 80) * participationFactor - procedural_violations.length * 15))
  )
  let strategy = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (20 + (userActionsCount >= 4 ? 40 : userActionsCount * 10) + scoring.argument * 0.4) *
          participationFactor
      )
    )
  )

  let impartiality: number | undefined = undefined

  // 3. Rolga xos mezonlarni kuchaytirish
  if (selected_role === 'ADVOKAT') {
    // Advokat: himoya sifati, dalillarni shubha ostiga olish va mijoz manfaati
    strategy = Math.min(100, strategy + (evidenceEvents.length > 0 ? 10 : 0))
  } else if (selected_role === 'PROKUROR') {
    // Prokuror: ayblov asosi, qonuniylik va jazo chorasi
    legalReasoning = Math.min(100, legalReasoning + (userActionsCount >= 3 ? 10 : 0))
  } else if (selected_role === 'SUDYA') {
    // Sudya: xolislik (impartiality) va majlisni boshqarish
    impartiality = Math.min(
      100,
      Math.max(40, 80 - procedural_violations.length * 6 + (session.completed ? 15 : 0))
    )
  }

  // 4. Umumiy ball (vaznlangan)
  let totalScore = 0
  if (selected_role === 'SUDYA') {
    totalScore = Math.round(
      legalReasoning * 0.25 +
        proceduralCorrectness * 0.25 +
        impartiality! * 0.25 +
        evidenceUsage * 0.15 +
        argumentQuality * 0.1
    )
  } else if (selected_role === 'PROKUROR') {
    totalScore = Math.round(
      legalReasoning * 0.3 +
        evidenceUsage * 0.25 +
        argumentQuality * 0.25 +
        proceduralCorrectness * 0.2
    )
  } else {
    // ADVOKAT
    totalScore = Math.round(
      legalReasoning * 0.25 +
        argumentQuality * 0.3 +
        evidenceUsage * 0.25 +
        proceduralCorrectness * 0.2
    )
  }

  totalScore = Math.max(10, Math.min(100, totalScore))

  // 5. XP va Yutuqlar (Achievements)
  const xpEarned = Math.round(totalScore * 1.8 + userActionsCount * 10)
  const achievements: string[] = []

  if (totalScore >= 85) achievements.push('Oliy Mahorat')
  if (proceduralCorrectness >= 85) achievements.push('Qonun Posboni')
  if (evidenceUsage >= 80) achievements.push('Dalil Ustasi')
  if (argumentQuality >= 80) achievements.push('Notiq')
  if (procedural_violations.length === 0 && userActionsCount >= 3) {
    achievements.push('Benuqson Tartib')
  }
  if (selected_role === 'SUDYA' && (impartiality ?? 0) >= 80) {
    achievements.push('Xolis Hakam')
  }

  // 6. Tahlil va takliflar
  const strengths: string[] = []
  const improvements: string[] = []

  if (argumentQuality >= 70) strengths.push('Mantiqiy va izchil dalillash')
  else improvements.push('Argumentlarni qonun moddalari (JK/FK/MK) bilan mustahkamlang')

  if (evidenceUsage >= 70) strengths.push('Hujjatli dalillardan samarali foydalanish')
  else
    improvements.push("Ish materiallaridagi dalillar va ekspert xulosalarini ko'proq jalb qiling")

  if (procedural_violations.length === 0) {
    strengths.push('Sud etikasiga va protsessual tartibga to‘liq rioya qilish')
  } else {
    improvements.push(
      `Sud jarayonida ${procedural_violations.length} ta protsessual kamchilik kuzatildi (masalan: vaqtidan erta e'tiroz yoki vakolatsiz harakat)`
    )
  }

  const feedbackSummary =
    totalScore >= 75
      ? `Ajoyib natija! Siz ${selected_role} rolida O'zbekiston protsessual qonunchiligiga to'la mos, professional tarzda ishtirok etdingiz.`
      : totalScore >= 55
        ? `Yaxshi urinish! Asosiy protsessual talablarga amal qilindi, lekin argumentatsiya va dalillarni taqdim etishda chuqurroq tahlil talab etiladi.`
        : `Boshlang‘ich daraja. Qonun moddalari va sud bosqichlari qoidalarini qayta takrorlash tavsiya etiladi.`

  const detailedCritique = [
    `Tanlangan rol: ${selected_role}. Ish: "${scenario.title}".`,
    `Amalga oshirilgan protsessual harakatlar soni: ${userActionsCount}.`,
    `Dalillar bilan ishlash samaradorligi: ${evidenceUsage}%.`,
    `Huquqiy asoslantirish darajasi: ${legalReasoning}%.`,
  ]

  return {
    legalReasoning,
    argumentQuality,
    evidenceUsage,
    proceduralCorrectness,
    strategy,
    impartiality,
    totalScore,
    xpEarned,
    achievements,
    feedbackSummary,
    detailedCritique,
    strengths,
    improvements,
  }
}

/**
 * Sud sessiyasini AI orqali har tomonlama yuridik baholash (Oliy toifali sudya va protsessual ekspert rubrikasi).
 */
export async function evaluateCourtSessionWithAi(
  session: CourtSessionState,
  scenario: CourtScenario,
  messageHistory?: Array<{ speaker: string; role: string; content: string }>
): Promise<ScoringResult> {
  const baseResult = calculateSessionScore(session, scenario)

  // Test muhitida yoki API kaliti bo'lmaganda tezkor deterministik natija
  if (process.env.NODE_ENV === 'test' || (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY)) {
    return baseResult
  }

  try {
    const userSpeeches = (messageHistory || [])
      .filter(m => m.role === session.selected_role)
      .map(m => m.content)
      .join('\n')

    const userActions = session.events
      .filter(e => e.role === session.selected_role)
      .map(e => `[${e.eventType}]: ${e.content}`)
      .join('\n')

    const prompt = `Sen O‘zbekiston Respublikasi Oliy Sudi Malaka Hay’ati va Oliy Sudyalar Kengashi ekspert-baholovchisisan.
Quyidagi virtual sud simulyatsiyasi bo‘yicha ishtirokchining (${session.selected_role} roli) yuridik mahoratini, protsessual qonunchilikka (JPK/FPK/MShtK) va moddiy huquq normalariga (JK/FK/MK) rioya etganligini CHUQUR VA HAQQONIY BAHOLA (hech qanday demo yoki soxta ball qo'yma).

ISH MA’LUMOTLARI:
- Nomi: "${scenario.title}"
- Soha: ${scenario.category} (${scenario.procedure_type})
- Faktlar: ${scenario.facts}
- Qonuniy asoslar: ${scenario.legal_basis.map(l => `${l.code} ${l.article}: ${l.title}`).join(', ')}

ISHTIROKCHINING RO‘LI VA NATIJALARI:
- Roli: ${session.selected_role}
- Amalga oshirilgan harakatlar: ${session.events.length} ta
- Protsessual qoidabuzarliklar: ${session.procedural_violations.length > 0 ? session.procedural_violations.join('; ') : "Qoidabuzarlik yo'q"}

ISHTIROKCHINING NUTQI VA BAYONOTLARI:
${userSpeeches || userActions || "Ishtirokchi nutqi saqlanmagan"}

QAT'IY BAHOLASH MEZONLARI (0-100 shkalada):
1. legalReasoning (0-100): O'zbekiston amaldagi moddiy huquq normalarini to'g'ri qo'llay olishi va dispozitsiya bilan faktlarni bog'lashi.
2. argumentQuality (0-100): Mantiqiy izchillik, nutq madaniyati va ritorika, raddiyalarning asosliligi.
3. evidenceUsage (0-100): Ish materiallaridagi dalillardan foydalanish, ularning maqbulligi va ishonchliligini baholash.
4. proceduralCorrectness (0-100): Protsessual bosqichlar tartibiga rioya qilish, sud etikasiga sodiqlik.
5. strategy (0-100): Sud taktikasi, o'z pozitsiyasini mustahkamlash usullari.
${session.selected_role === 'SUDYA' ? '6. impartiality (0-100): Sudyaning xolisligi, taraflarga teng sharoit yaratishi.' : ''}

Javobni FAQAT toza JSON formatida ber:
{
  "legalReasoning": 85,
  "argumentQuality": 80,
  "evidenceUsage": 75,
  "proceduralCorrectness": 90,
  "strategy": 80,
  ${session.selected_role === 'SUDYA' ? '"impartiality": 88,' : ''}
  "totalScore": 82,
  "feedbackSummary": "Sud Hay'atining batafsil rasmiy xulosasi (2-3 jumla)",
  "detailedCritique": [
    "1-muhim protsessual harakat tahlili",
    "2-dalillar bilan ishlash tahlili",
    "3-qonuniy normalarni qo'llash tahlili"
  ],
  "strengths": ["Kuchli jihat 1", "Kuchli jihat 2"],
  "improvements": ["Kamchilik yoki tavsiya 1", "Tavsiya 2"]
}`

    let aiRaw = ''
    if (process.env.GEMINI_API_KEY) {
      try {
        const { callGemini } = await import('@/lib/gemini')
        aiRaw = await callGemini(prompt, { temperature: 0.15, maxTokens: 2000, responseJson: true })
      } catch (gemErr) {
        console.warn('Gemini court evaluation failed:', gemErr)
      }
    }

    if (!aiRaw && process.env.GROQ_API_KEY) {
      const { aiClient } = await import('@/lib/ai-client')
      const groqRes = await aiClient.chat({ prompt, temperature: 0.15, maxTokens: 2000 })
      aiRaw = groqRes.text
    }

    if (aiRaw) {
      let clean = aiRaw.trim()
      if (clean.startsWith('```json')) clean = clean.slice(7)
      else if (clean.startsWith('```')) clean = clean.slice(3)
      if (clean.endsWith('```')) clean = clean.slice(0, -3)
      clean = clean.trim()

      const parsed = JSON.parse(clean)
      if (parsed && typeof parsed.totalScore === 'number') {
        const total = Math.min(100, Math.max(10, Math.round(parsed.totalScore)))
        const achievements: string[] = []
        if (total >= 85) achievements.push('Oliy Mahorat')
        if ((parsed.proceduralCorrectness || 0) >= 85) achievements.push('Qonun Posboni')
        if ((parsed.evidenceUsage || 0) >= 80) achievements.push('Dalil Ustasi')
        if ((parsed.argumentQuality || 0) >= 80) achievements.push('Notiq')
        if (session.procedural_violations.length === 0) achievements.push('Benuqson Tartib')
        if (session.selected_role === 'SUDYA' && (parsed.impartiality || 0) >= 80) achievements.push('Xolis Hakam')

        return {
          legalReasoning: Math.min(100, Math.max(0, Math.round(parsed.legalReasoning || baseResult.legalReasoning))),
          argumentQuality: Math.min(100, Math.max(0, Math.round(parsed.argumentQuality || baseResult.argumentQuality))),
          evidenceUsage: Math.min(100, Math.max(0, Math.round(parsed.evidenceUsage || baseResult.evidenceUsage))),
          proceduralCorrectness: Math.min(100, Math.max(0, Math.round(parsed.proceduralCorrectness || baseResult.proceduralCorrectness))),
          strategy: Math.min(100, Math.max(0, Math.round(parsed.strategy || baseResult.strategy))),
          impartiality: session.selected_role === 'SUDYA' ? Math.min(100, Math.max(0, Math.round(parsed.impartiality || 80))) : undefined,
          totalScore: total,
          xpEarned: Math.round(total * 1.8 + baseResult.xpEarned),
          achievements,
          feedbackSummary: parsed.feedbackSummary || baseResult.feedbackSummary,
          detailedCritique: Array.isArray(parsed.detailedCritique) && parsed.detailedCritique.length > 0 ? parsed.detailedCritique : baseResult.detailedCritique,
          strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : baseResult.strengths,
          improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0 ? parsed.improvements : baseResult.improvements,
        }
      }
    }
  } catch (evalErr) {
    console.warn('evaluateCourtSessionWithAi error, falling back to base calculation:', evalErr)
  }

  return baseResult
}
