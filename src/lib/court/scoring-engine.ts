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

  // 2. Bazaviy ballarni shakllantirish
  let legalReasoning = Math.min(
    100,
    Math.max(40, 60 + scoring.legalReasoning - procedural_violations.length * 5)
  )
  let argumentQuality = Math.min(100, Math.max(30, 50 + scoring.argument))
  let evidenceUsage = Math.min(
    100,
    Math.max(20, evidenceEvents.length > 0 ? 55 + scoring.evidence : 35)
  )
  let proceduralCorrectness = Math.min(
    100,
    Math.max(25, scoring.etiquette - procedural_violations.length * 8)
  )
  let strategy = Math.min(
    100,
    Math.max(30, 50 + (userActionsCount >= 4 ? 25 : userActionsCount * 6))
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
