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

  // 2. Bazaviy ballarni shakllantirish (real ishtirok hajmiga bog'liq)
  const participationFactor = userActionsCount === 0 ? 0.75 : Math.min(1, Math.max(0.6, userActionsCount / 4))
  let legalReasoning = Math.min(
    100,
    Math.max(10, Math.round((40 + scoring.legalReasoning * 0.6) * participationFactor - procedural_violations.length * 8))
  )
  let argumentQuality = Math.min(
    100,
    Math.max(10, Math.round((30 + scoring.argument * 0.7) * participationFactor))
  )
  let evidenceUsage = Math.min(
    100,
    Math.max(10, evidenceEvents.length > 0 ? 55 + scoring.evidence : Math.round(25 * participationFactor))
  )
  let proceduralCorrectness = Math.min(
    100,
    Math.max(15, scoring.etiquette - procedural_violations.length * 10)
  )
  let strategy = Math.min(
    100,
    Math.max(10, Math.round((30 + (userActionsCount >= 4 ? 35 : userActionsCount * 8)) * participationFactor))
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
    totalScore >= 80
      ? `Ajoyib natija! Siz ${selected_role} rolida O'zbekiston protsessual qonunchiligiga to'la mos, professional tarzda ishtirok etdingiz.`
      : totalScore >= 60
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
