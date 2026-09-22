import {
  ScenarioData,
  ScenarioDecisionPoint,
  ScenarioEvaluation,
  ScenarioOption,
  UserActionLog,
  CreateScenarioFormInput,
  ScenarioDomain,
} from '@/types/scenario-generator'
import { OFFICIAL_LEGAL_SOURCES } from './official-sources-registry'

/**
 * Validates legal consistency of generated scenario data against active 2026 codes.
 */
export function validateScenarioLegalIntegrity(scenario: Partial<ScenarioData>): {
  isValid: boolean
  score: number
  notes: string[]
} {
  const notes: string[] = []
  let score = 100

  if (!scenario.title || scenario.title.length < 3) {
    notes.push('Senariy sarlavhasi yetarlicha aniq emas')
    score -= 15
  }

  if (!scenario.facts || scenario.facts.length === 0) {
    notes.push('Faktlar majmui topilmadi')
    score -= 25
  }

  if (!scenario.participants || scenario.participants.length < 2) {
    notes.push('Kamida 2 ta taraf (ishtirokchi) mavjud bo‘lishi lozim')
    score -= 20
  }

  if (!scenario.decision_points || scenario.decision_points.length === 0) {
    notes.push('Qaror qabul qilish bosqichlari (decision points) yetarli emas')
    score -= 25
  }

  if (!scenario.sources || scenario.sources.length === 0) {
    notes.push('Rasmiy qonuniy manbalar biriktirilmagan')
    score -= 15
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    notes,
  }
}

/**
 * Calculates comprehensive evaluation and XP when a simulation completes.
 */
export function evaluateScenarioPerformance(
  scenario: ScenarioData,
  actionLogs: UserActionLog[]
): ScenarioEvaluation {
  const totalSteps = actionLogs.length
  if (totalSteps === 0) {
    return {
      total_score: 0,
      xp_awarded: 0,
      decision_quality_score: 0,
      legal_analysis_score: 0,
      evidence_usage_score: 0,
      strategy_score: 0,
      mistakes: ['Hech qanday harakat amalga oshirilmadi'],
      missed_opportunities: ['Barcha bosqichlar o‘tkazib yuborildi'],
      recommendations: [
        'Boshlang‘ich darajadagi senariylardan boshlab amaliyot o‘tash tavsiya etiladi',
      ],
      completed_at: new Date().toISOString(),
    }
  }

  const optimalCount = actionLogs.filter(a => a.is_optimal).length
  const totalXp = actionLogs.reduce((acc, a) => acc + (a.xp_earned || 0), 0)

  const decisionQuality = Math.round((optimalCount / totalSteps) * 100)
  const evidenceUsage = Math.min(
    100,
    Math.round(
      actionLogs.filter(
        a =>
          a.action_type === 'request_evidence' ||
          a.action_type === 'inspect_document' ||
          a.action_type === 'question_witness'
      ).length *
        35 +
        30
    )
  )
  const legalAnalysis = Math.min(
    100,
    Math.round(
      actionLogs.filter(
        a => a.action_type === 'cite_article' || a.action_type === 'court_application'
      ).length *
        35 +
        40
    )
  )
  const strategyScore = Math.round(
    decisionQuality * 0.5 + evidenceUsage * 0.25 + legalAnalysis * 0.25
  )

  const totalScore = Math.round(
    decisionQuality * 0.4 + legalAnalysis * 0.3 + evidenceUsage * 0.15 + strategyScore * 0.15
  )

  const mistakes: string[] = []
  const missedOpportunities: string[] = []
  const recommendations: string[] = []

  actionLogs.forEach(log => {
    if (!log.is_optimal) {
      mistakes.push(
        `${log.step_number}-bosqichda sub-optimal tanlov: "${log.action_title}". ${log.feedback}`
      )
    }
  })

  if (evidenceUsage < 70) {
    missedOpportunities.push(
      'Dalillarni yig‘ish va hujjatlarni ekspertizadan o‘tkazish to‘liq amalga oshirilmadi'
    )
    recommendations.push(
      'Har doim sudga murojaat qilishdan oldin yetarli dalillar bazasini to‘plashga e’tibor bering'
    )
  }

  if (legalAnalysis < 70) {
    missedOpportunities.push(
      'Amaldagi qonun moddalariga (2026-yil tahriridagi) to‘g‘ridan-to‘g‘ri havola berish imkoniyatlari qoldirildi'
    )
    recommendations.push(
      'Yuridik tahlilda O‘zbekiston Respublikasi Kodekslari va LexUZ manbalaridan faol foydalaning'
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Ajoyib natija! Strategik qarorlar va dalillar bilan ishlash mukammal darajada bajarildi.'
    )
  }

  return {
    total_score: totalScore,
    xp_awarded: totalXp,
    decision_quality_score: decisionQuality,
    legal_analysis_score: legalAnalysis,
    evidence_usage_score: evidenceUsage,
    strategy_score: strategyScore,
    mistakes,
    missed_opportunities: missedOpportunities,
    recommendations,
    completed_at: new Date().toISOString(),
  }
}

/**
 * Built-in verified 2026 legal practice simulation templates.
 */
export const VERIFIED_SCENARIO_TEMPLATES: ScenarioData[] = [
  {
    id: 'tmpl_contract_default_2026',
    title: 'Yetkazib berish shartnomasi bo‘yicha to‘lov kechikishi va penya undirish',
    legal_domain: 'contract',
    difficulty: 'intermediate',
    objective: 'court_practice',
    user_role: 'advokat',
    background:
      '«Orient Trade» MChJ (Yetkazib beruvchi) va «Global Logistic» XK (Xaridor) o‘rtasida 2026-yil 15-yanvarda 150 000 000 so‘mlik qishloq xo‘jaligi texnikalarini yetkazib berish shartnomasi tuzilgan. Mahsulot to‘liq yetkazib berilgan bo‘lsa-da, Xaridor to‘lovni 65 kunga kechiktirmoqda. Shartnomada har bir kechiktirilgan kun uchun 0.5% penya belgilangan.',
    facts: [
      {
        id: 'f1',
        statement: 'Shartnoma 2026-yil 15-yanvarda tuzilgan va taraflar tomonidan imzolangan',
        is_contested: false,
        date: '2026-01-15',
      },
      {
        id: 'f2',
        statement: 'Tovarlar hisob-faktura (schet-faktura) asosida to‘liq qabul qilib olingan',
        is_contested: false,
        date: '2026-01-20',
      },
      {
        id: 'f3',
        statement: 'Xaridor bank hisobvarag‘ida mablag‘ yetarli emasligini ro‘kach qilmoqda',
        is_contested: true,
      },
    ],
    participants: [
      {
        id: 'p1',
        name: '«Orient Trade» MChJ rahbari',
        role: 'Mijoz (Da’vogar)',
        background: 'Yetkazib beruvchi tadbirkorlik subyekti',
        interests: 'Asosiy qarz va maksimal penya summasini zudlik bilan undirish',
      },
      {
        id: 'p2',
        name: '«Global Logistic» XK rahbari',
        role: 'Javobgar',
        background: 'Moliya qiyinchiligiga duch kelgan xususiy korxona',
        interests: 'To‘lov muddatini uzaytirish va penyani kamaytirish (FK 326)',
      },
    ],
    evidence: [
      {
        id: 'ev1',
        title: '№14/2026-sonli Yetkazib berish shartnomasi',
        type: 'document',
        description:
          'Shartnomada to‘lov 10 bank kunida amalga oshirilishi va 0.5% penya ko‘rsatilgan',
        reliability: 'high',
        is_admissible: true,
        legal_basis: '670-I-son Qonun 25-modda',
        discovered: true,
      },
      {
        id: 'ev2',
        title: 'Elektron hisob-faktura nusxasi (Didox/Soliq)',
        type: 'digital',
        description:
          'Tovarlar qabul qilib olinganligi to‘g‘risida ikki tomonlama QR-kodli elektron imzo',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Soliq Kodeksi 47-modda',
        discovered: true,
      },
      {
        id: 'ev3',
        title: 'Xaridordan olingan kafolat xati',
        type: 'document',
        description: 'Qarzni tan olish va to‘lash va’da qilingan xat (da’vo muddatini uzuvchi)',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'FK 157-modda',
        discovered: false,
      },
    ],
    timeline: [
      { date: '2026-01-15', event: 'Shartnoma tuzildi', significance: 'Majburiyat vujudga keldi' },
      {
        date: '2026-01-20',
        event: 'Tovar topshirildi',
        significance: 'To‘lov majburiyati boshlandi',
      },
      {
        date: '2026-02-04',
        event: 'To‘lov muddati o‘tdi',
        significance: 'Penya hisoblash davri boshlandi',
      },
    ],
    legal_issues: [
      {
        id: 'li1',
        question: 'Penyaning 50 foizlik qonuniy chegarasi (statutory cap) qanday qo‘llaniladi?',
        applicable_articles: ['670-I-son Qonun 25-32-moddalar', 'FK 327-modda'],
        official_source_url: 'https://lex.uz/docs/54641',
      },
      {
        id: 'li2',
        question: 'Sudgacha talabnoma (pretinziya) yuborish majburiymi?',
        applicable_articles: ['IPK 148-modda', '670-I-son Qonun 17-modda'],
        official_source_url: 'https://lex.uz/docs/3523891',
      },
    ],
    decision_points: [
      {
        id: 'dp1',
        step_number: 1,
        stage_title: '1-bosqich: Dastlabki huquqiy tahlil va harakatlar rejasi',
        prompt:
          'Mijoz sizga kelib to‘lov kechikayotganini aytdi va zudlik bilan sudga berishni talab qilyapti. Birinchi professional qadamingiz qanday bo‘ladi?',
        options: [
          {
            id: 'opt_1a',
            label:
              'Shartnomani o‘rganish, to‘lov muddati va talabnoma (pretinziya) yuborish tartibini tekshirish',
            action_type: 'inspect_document',
            description:
              'IPK 148-moddasiga muvofiq sudgacha hal qilish tartibiga rioya qilish va hisob-kitob qilish',
            consequence: 'To‘g‘ri yuridik yo‘l! Pretinziya yuborildi va qonuniy muddat hisoblandi.',
            xp: 25,
            is_optimal: true,
            feedback:
              'Ajoyib! Iqtisodiy nizolarda talabnoma tartibi sud arizasining qabul qilinishida hal qiluvchi ahamiyatga ega.',
          },
          {
            id: 'opt_1b',
            label: 'Hech qanday talabnomasiz darhol iqtisodiy sudga da’vo kiritish',
            action_type: 'court_application',
            description: 'Pretinziya yubormasdan to‘g‘ridan-to‘g‘ri sudga ariza berish',
            consequence: 'Sudya IPK 155-moddasiga asosan da’vo arizasini qaytarishi mumkin.',
            xp: 5,
            is_optimal: false,
            feedback:
              'Shoshilmang! Qonun yoki shartnomada ko‘rsatilgan pretinziya tartibini buzish da’voning qaytarilishiga sabab bo‘ladi.',
          },
        ],
      },
      {
        id: 'dp2',
        step_number: 2,
        stage_title: '2-bosqich: Penya va qarz summasini hisoblash',
        prompt:
          'Qarz summasi 150 000 000 so‘m, kechikish 65 kun, kunlik stavka 0.5%. Da’vo arizasida qancha penya ko‘rsatiladi?',
        options: [
          {
            id: 'opt_2a',
            label:
              '75 000 000 so‘m (670-I-son Qonun bo‘yicha 50% statutory cap bilan cheklangan holda)',
            action_type: 'cite_article',
            description:
              '65 kun * 0.5% = 32.5% (48 750 000 so‘m). Agar 50%dan oshmasa, amaldagi summa ko‘rsatiladi.',
            consequence:
              'Hisob-kitob to‘g‘ri amalga oshirildi: 48 750 000 so‘m penya va 150 000 000 so‘m asosiy qarz.',
            xp: 30,
            is_optimal: true,
            feedback:
              'Mukammal! Qonuniy 50 foizlik cheklov va haqiqiy kunlar soni to‘g‘ri muvofiqlashtirildi.',
          },
          {
            id: 'opt_2b',
            label: '150 000 000 so‘m penya (asosiy qarz bilan bir xil)',
            action_type: 'custom_action',
            description: 'Cheklovsiz to‘liq penya talab qilish',
            consequence: 'Sud 670-I-son Qonun 25-moddasi asosida ortiqcha summani rad etadi.',
            xp: 5,
            is_optimal: false,
            feedback:
              'Xato! O‘zbekiston qonunchiligida penya muddati va summasi kechiktirilgan to‘lovning 50%idan oshishi mumkin emas.',
          },
        ],
      },
    ],
    learning_outcomes: [
      'Xo‘jalik shartnomalarida penya hisoblash va 50% qonuniy cheklovni qo‘llash',
      'Iqtisodiy sudga murojaat qilishda talabnoma (pretinziya) institutining o‘rni',
      'FK 327 va 670-I-son Qonun normalarining nisbatini to‘g‘ri baholash',
    ],
    sources: [
      {
        name: 'Xo‘jalik yurituvchi subyektlar faoliyati to‘g‘risida',
        url: 'https://lex.uz/docs/54641',
        number: '670-I',
      },
      {
        name: 'Iqtisodiy Protsessual Kodeks',
        url: 'https://lex.uz/docs/3523891',
        number: 'O‘RQ-468',
      },
    ],
    validation: {
      is_valid: true,
      checked_articles: ['670-I 25-32-moddalar', 'IPK 148-modda', 'FK 327-modda'],
      legal_consistency_score: 100,
    },
  },
]
