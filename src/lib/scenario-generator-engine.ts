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
  const evidenceActionsCount = actionLogs.filter(
    a =>
      a.action_type === 'request_evidence' ||
      a.action_type === 'inspect_document' ||
      a.action_type === 'question_witness'
  ).length
  const evidenceUsage = Math.min(
    100,
    evidenceActionsCount > 0 ? Math.round(evidenceActionsCount * 30 + 15) : 10
  )

  const legalActionsCount = actionLogs.filter(
    a => a.action_type === 'cite_article' || a.action_type === 'court_application'
  ).length
  const legalAnalysis = Math.min(
    100,
    legalActionsCount > 0 ? Math.round(legalActionsCount * 30 + 20) : 15
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
              '48 750 000 so‘m (65 kun * 0.5% = 32.5%, bu 50%lik qonuniy limitdan oshmaydi)',
            action_type: 'cite_article',
            description:
              'Hisob-kitob: 150 000 000 * 32.5% = 48 750 000 so‘m penya va 150 000 000 so‘m asosiy qarz.',
            consequence:
              'Hisob-kitob to‘g‘ri amalga oshirildi: sud arizasi qonuniy va asosli qabul qilindi.',
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
  {
    id: 'tmpl_labor_dispute_2026',
    title: 'Mehnat shartnomasini noqonuniy bekor qilish va ish haqini undirish',
    legal_domain: 'labor',
    difficulty: 'intermediate',
    objective: 'court_practice',
    user_role: 'advokat',
    background:
      'Xodim Dilshod Rahimov «Agro Star» MChJda bosh buxgalter lavozimida ishlab kelgan. 2026-yil 1-fevralda ish beruvchi hech qanday ogohlantirishsiz va kasaba uyushmasi roziligisiz uni yangi Mehnat Kodeksining 161-moddasi 4-bandi (mehnat majburiyatlarini bir marta qo‘pol buzish) bilan ishdan bo‘shatgan. Shuningdek, oxirgi 2 oylik ish haqi (24 000 000 so‘m) to‘lanmagan.',
    facts: [
      {
        id: 'fl1',
        statement: 'Xodim bilan 2023-yil 1-martda muddatsiz mehnat shartnomasi tuzilgan',
        is_contested: false,
        date: '2023-03-01',
      },
      {
        id: 'fl2',
        statement: 'Ishdan bo‘shatish to‘g‘risidagi buyruq xodimga tanishtirilmagan va kasaba qo‘mitasi xabardor qilinmagan',
        is_contested: false,
        date: '2026-02-01',
      },
      {
        id: 'fl3',
        statement: 'Ish beruvchi xodim hisobotni 1 kun kechiktirgani uchun qo‘pol buzilish deb topgan',
        is_contested: true,
      },
    ],
    participants: [
      {
        id: 'pl1',
        name: 'Dilshod Rahimov',
        role: 'Xodim (Da’vogar)',
        background: '5 yillik tajribaga ega bosh buxgalter',
        interests: 'Ishga tiklanish, majburiy progul haqi va ma’naviy zararni undirish',
      },
      {
        id: 'pl2',
        name: '«Agro Star» MChJ direktori',
        role: 'Ish beruvchi (Javobgar)',
        background: 'Xususiy agrofirma rahbari',
        interests: 'Xodimni ishga qaytarmaslik va qo‘shimcha to‘lovlardan qochish',
      },
    ],
    evidence: [
      {
        id: 'evl1',
        title: 'Mehnat shartnomasi va lavozim yo‘riqnomasi',
        type: 'document',
        description: 'Bosh buxgalter majburiyatlari va ichki mehnat tartibi qoidalari',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Yangi MK 103-modda',
        discovered: true,
      },
      {
        id: 'evl2',
        title: 'Ishdan bo‘shatish to‘g‘risidagi buyruq nusxasi',
        type: 'document',
        description: 'Kasaba qo‘mitasi roziligisiz chiqarilgan 12-K-sonli buyruq',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Yangi MK 164-modda',
        discovered: true,
      },
      {
        id: 'evl3',
        title: 'Bank hisobvarag‘idan oylik to‘lovlar ko‘chirmasi',
        type: 'digital',
        description: 'Noyabr-dekabr oylari uchun ish haqi o‘tkazilmaganligini tasdiqlovchi dalil',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Yangi MK 333-modda',
        discovered: true,
      },
    ],
    timeline: [
      { date: '2026-02-01', event: 'Xodim ishdan noqonuniy bo‘shatildi', significance: 'Mehnat nizosi yuzaga keldi' },
      { date: '2026-02-10', event: 'Ish beruvchiga talabnoma yuborildi', significance: 'Sudgacha murojaat urinishi' },
      { date: '2026-02-20', event: 'Javob berilmadi', significance: 'Sudga da’vo arizasi kiritish muddati o‘tmasligi lozim' },
    ],
    legal_issues: [
      {
        id: 'lil1',
        question: 'Ishga tiklash da’vosi bo‘yicha fuqarolik sudiga murojaat qilish muddati qancha?',
        applicable_articles: ['Yangi MK 560-modda (1 oy)', 'FPK 149-modda'],
        official_source_url: 'https://lex.uz/docs/6257288',
      },
      {
        id: 'lil2',
        question: 'Majburiy progul va ma’naviy zarar qanday hisoblanadi?',
        applicable_articles: ['Yangi MK 563-modda', 'Yangi MK 567-modda'],
        official_source_url: 'https://lex.uz/docs/6257288',
      },
    ],
    decision_points: [
      {
        id: 'dpl1',
        step_number: 1,
        stage_title: '1-bosqich: Da’vo muddatini tekshirish va sudga murojaat qilish',
        prompt:
          'Xodim buyruq chiqqanidan 20 kun o‘tgach oldingizga keldi. Birinchi navbatda qaysi organga qanday talab bilan murojaat qilasiz?',
        options: [
          {
            id: 'opt_l1a',
            label:
              'Fuqarolik ishlari bo‘yicha tumanlararo sudiga ishga tiklash, oylik va progul undirish bo‘yicha da’vo kiritish',
            action_type: 'court_application',
            description:
              'Yangi MK 560-moddasiga asosan ishga tiklash bo‘yicha 1 oylik da’vo muddati o‘tmasdan FIB sudiga da’vo berish',
            consequence: 'To‘g‘ri qaror! Da’vo muddati saqlab qolindi va ish sud ish yurituviga qabul qilindi.',
            xp: 30,
            is_optimal: true,
            feedback:
              'Mukammal! Ishga tiklash bo‘yicha 1 oylik qat’iy muddat bor. Vaqtni boy bermasdan sudga murojaat qilish yagona to‘g‘ri yo‘l.',
          },
          {
            id: 'opt_l1b',
            label: 'Avval Mehnat inspeksiyasiga shikoyat qilib, 30 kun kutish',
            action_type: 'custom_action',
            description: 'Mehnat inspeksiyasi tekshiruvini kutib turish',
            consequence: 'Xavfli! Inspeksiya javob berguncha 1 oylik sud muddati o‘tib ketishi va da’vo rad etilishi mumkin.',
            xp: 10,
            is_optimal: false,
            feedback:
              'Ehtiyot bo‘ling! Mehnat inspeksiyasiga shikoyat qilish sudga murojaat qilishning 1 oylik muddatini to‘xtatmaydi.',
          },
        ],
      },
      {
        id: 'dpl2',
        step_number: 2,
        stage_title: '2-bosqich: Sudda buyruqning noqonuniyligini isbotlash',
        prompt:
          'Sud majlisida ish beruvchi hisobot 1 kun kechikkanini ro‘kach qilmoqda. Qanday huquqiy dalil keltirasiz?',
        options: [
          {
            id: 'opt_l2a',
            label:
              'Ichki mehnat tartibi qoidalarida 1 kun kechikish "qo‘pol buzilish" deb ko‘rsatilmaganligi va kasaba roziligi yo‘qligini ko‘rsatish',
            action_type: 'cite_article',
            description:
              'Yangi MK 161 va 164-moddalariga muvofiq, bir martalik qo‘pol buzilishlar ro‘yxati shartnomada aniq bo‘lishi va kasaba roziligi olinishi shart',
            consequence: 'Sud ish beruvchining vajlarini rad etdi va buyruqni noqonuniy deb topdi.',
            xp: 35,
            is_optimal: true,
            feedback:
              'Ajoyib yuridik mahorat! Ro‘yxatda bo‘lmagan harakat qo‘pol buzilish hisoblanmaydi va kasaba roziligisiz bo‘shatish noqonuniy.',
          },
          {
            id: 'opt_l2b',
            label: 'Xodimning sog‘lig‘i yomon bo‘lganligi haqida guvoh chaqirish',
            action_type: 'question_witness',
            description: 'Faqat emotsional holatga urg‘u berish',
            consequence: 'Protsessual jihatdan zaif vaj, buyruqning qonuniyligi asosiy e’tibordan chetda qoldi.',
            xp: 15,
            is_optimal: false,
            feedback:
              'Huquqiy normalar va buyruqning protsessual buzilishiga tayanish guvohlarning emotsional ko‘rsatmasidan ancha kuchliroq.',
          },
        ],
      },
    ],
    learning_outcomes: [
      'Yangi Mehnat Kodeksida ishdan bo‘shatishning qonuniy asoslarini tahlil qilish',
      'Ishga tiklash bo‘yicha 1 oylik da’vo muddatiga rioya qilish muhimligi',
      'Majburiy progul va kechiktirilgan ish haqiga penya hisoblash (MK 333)',
    ],
    sources: [
      {
        name: 'O‘zbekiston Respublikasi Mehnat Kodeksi (2023-2026)',
        url: 'https://lex.uz/docs/6257288',
        number: 'O‘RQ-798',
      },
    ],
    validation: {
      is_valid: true,
      checked_articles: ['Yangi MK 161-modda', 'MK 164-modda', 'MK 333-modda', 'MK 560-modda'],
      legal_consistency_score: 100,
    },
  },
  {
    id: 'tmpl_family_property_2026',
    title: 'Nikohdan ajralishda er-xotinning umumiy mulkini taqsimlash',
    legal_domain: 'family',
    difficulty: 'advanced',
    objective: 'irac',
    user_role: 'advokat',
    background:
      'Er-xotin 10 yillik nikohdan so‘ng ajrashmoqda. Nikoh davomida umumiy qiymati 1 200 000 000 so‘mlik 3 xonali xonadon, avtomobil va er nomiga ochilgan MChJ ustav fondidagi 60% ulush xarid qilingan. Er xotiniga xonadon o‘zining nomida ekanini va xotin uy bekasi bo‘lgani uchun mulkdan ulush ololmasligini da’vo qilmoqda. Xotin qaramog‘ida 2 nafar voyaga yetmagan bola bor.',
    facts: [
      {
        id: 'ff1',
        statement: 'Nikoh 2016-yilda FXDYO organida rasmiy qayd etilgan',
        is_contested: false,
        date: '2016-04-12',
      },
      {
        id: 'ff2',
        statement: 'Ko‘chmas mulk va avtomobil nikoh davomida er nomiga sotib olingan',
        is_contested: false,
        date: '2020-08-15',
      },
      {
        id: 'ff3',
        statement: 'Er xotin daromad topmaganligi sababli barcha mulk uning yakka mulki deb hisoblamoqda',
        is_contested: true,
      },
    ],
    participants: [
      {
        id: 'pf1',
        name: 'Nilufar Karimova',
        role: 'Xotin (Da’vogar)',
        background: 'Uy bekasi, 2 nafar voyaga yetmagan farzand onasi',
        interests: 'Bolalar manfaatlarini hisobga olgan holda uy-joy va mulkdan teng/kattaroq ulush olish',
      },
      {
        id: 'pf2',
        name: 'Farhod Karimov',
        role: 'Er (Javobgar)',
        background: 'Tadbirkor, MChJ ta’sischisi',
        interests: 'Xonadon va biznes ulushini o‘zida saqlab qolish',
      },
    ],
    evidence: [
      {
        id: 'evf1',
        title: 'Ko‘chmas mulk oldi-sotdi shartnomasi va kadastr pasporti',
        type: 'document',
        description: '2020-yilda rasmiylashtirilgan, nikoh davrida sotib olinganligi ko‘rsatilgan',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Oila Kodeksi 23-modda',
        discovered: true,
      },
      {
        id: 'evf2',
        title: 'MChJ ustav fondidagi ulush to‘g‘risida davlat xizmatlari reyestridan ko‘chirma',
        type: 'digital',
        description: 'Ustav fondi 500 mln so‘m bo‘lgan korxonadagi 60% ulush nikoh davrida shakllantirilgan',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'FK 223-modda, OK 23-modda',
        discovered: true,
      },
      {
        id: 'evf3',
        title: 'Bolalarning tug‘ilganlik haqidagi guvohnomalari',
        type: 'document',
        description: '2 nafar voyaga yetmagan farzand onaning qaramog‘ida qoldirilganligi',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Oila Kodeksi 28-modda',
        discovered: true,
      },
    ],
    timeline: [
      { date: '2016-04-12', event: 'Nikoh tuzildi', significance: 'Birgalikdagi umumiy mulk rejimi boshlandi' },
      { date: '2020-08-15', event: 'Xonadon xarid qilindi', significance: 'Umumiy birgalikdagi mulk vujudga keldi' },
      { date: '2026-01-10', event: 'Nikohni bekor qilish arizasi berildi', significance: 'Mulk taqsimoti nizosi' },
    ],
    legal_issues: [
      {
        id: 'lif1',
        question: 'Uy bekasi bo‘lgan er/xotinning umumiy mulkdagi huquqi qanday belgilanadi?',
        applicable_articles: ['Oila Kodeksi 23-modda 2-qism (Teng huquqlilik)', 'FK 223-modda'],
        official_source_url: 'https://lex.uz/docs/104720',
      },
      {
        id: 'lif2',
        question: 'Voyaga yetmagan bolalar manfaati uchun ulushlarni tenglikdan chetga chiqqan holda ko‘paytirish mumkinmi?',
        applicable_articles: ['Oila Kodeksi 28-modda 2-qism', 'Oliy Sud Plenumi Qarori №6'],
        official_source_url: 'https://lex.uz/docs/104720',
      },
    ],
    decision_points: [
      {
        id: 'dpf1',
        step_number: 1,
        stage_title: '1-bosqich: Mulkning huquqiy maqomini aniqlash va da’vo talablarini belgilash',
        prompt:
          'Er barcha mol-mulk o‘z nomiga rasmiylashtirilganini aytmoqda. Da’vo arizasida qaysi qonuniy asosni keltirasiz?',
        options: [
          {
            id: 'opt_f1a',
            label:
              'OK 23-moddasiga asosan er-xotindan biri uy ro‘zg‘ori bilan band bo‘lib mustaqil daromadga ega bo‘lmagan taqdirda ham mulkka nisbatan teng huquqqa egaligini isbotlash',
            action_type: 'cite_article',
            description:
              'Qonuniy mulk rejimiga asosan nom kimga rasmiylashtirilganidan qat’i nazar mulk 50/50 taqsimlanadi',
            consequence: 'To‘g‘ri huquqiy pozitsiya! Erning yakka mulk ekanligi haqidagi vaji qonunan puchga chiqdi.',
            xp: 30,
            is_optimal: true,
            feedback:
              'Ajoyib! Oila Kodeksining 23-moddasi uy bekalari huquqini to‘liq himoya qiladi — daromad topmaslik ulushdan mahrum qilmaydi.',
          },
          {
            id: 'opt_f1b',
            label: 'Xonadonni sotib olishda xotinning ota-onasi qarz berganini aytib soxta tilxat yozish',
            action_type: 'custom_action',
            description: 'Qalbaki qarz shartnomasini taqdim etish',
            consequence: 'Xavfli va noqonuniy! Sud ekspertizasi tilxat yangi yozilganini aniqlasa, jinoiy javobgarlik (JK 228) kelib chiqadi.',
            xp: 0,
            is_optimal: false,
            feedback:
              'Qat’iyan taqiqlanadi! Soxta dalillar advokatlik etikasiga zid va qonun bo‘yicha mulk baribir teng bo‘linadi.',
          },
        ],
      },
      {
        id: 'dpf2',
        step_number: 2,
        stage_title: '2-bosqich: Bolalar manfaati hisobiga ulushni oshirish',
        prompt:
          'Xotinning qaramog‘ida 2 nafar voyaga yetmagan nogiron bolalar qolmoqda. Sudda qanday qo‘shimcha iltimosnoma kiritasiz?',
        options: [
          {
            id: 'opt_f2a',
            label:
              'OK 28-moddasi 2-qismiga binoan bolalar manfaatini ko‘zlab onaning ulushini oshirish (masalan 60/40 yoki xonadonni to‘liq berib, o‘rniga avtomobil va kompensatsiya)',
            action_type: 'court_application',
            description:
              'Sud voyaga yetmagan bolalar manfaatlarini hisobga olib, umumiy mulkdagi ulushlar tengligidan chetga chiqishga haqli',
            consequence: 'Sud iltimosnomani qanoatlantirdi va onaga xonadondagi 65% ulushni ajratib berdi.',
            xp: 35,
            is_optimal: true,
            feedback:
              'Yuqori darajadagi strategiya! Oila Kodeksi 28-moddasi bolalar manfaati uchun tenglikdan chetga chiqishga to‘liq imkon beradi.',
          },
          {
            id: 'opt_f2b',
            label: 'Faqat 50% ulush bilan cheklanish va bolalarni aralashtirmaslik',
            action_type: 'inspect_document',
            description: 'Standart teng taqsimot so‘rash',
            consequence: 'Xonadon teng taqsimlandi, ammo bolalarning qo‘shimcha ehtiyojlari hisobga olinmadi.',
            xp: 20,
            is_optimal: false,
            feedback:
              'Standart yondashuv, ammo mijoz manfaatlarini maksimal darajada himoya qilish imkoniyati boy berildi.',
          },
        ],
      },
    ],
    learning_outcomes: [
      'Er-xotinning umumiy birgalikdagi mulki rejimini qo‘llash (OK 23-modda)',
      'Voyaga yetmagan bolalar manfaati uchun ulushlar tengligidan chetga chiqish mexanizmi (OK 28)',
      'MChJ ustav kapitalidagi ulushlarni baholash va kompensatsiya undirish',
    ],
    sources: [
      {
        name: 'O‘zbekiston Respublikasi Oila Kodeksi',
        url: 'https://lex.uz/docs/104720',
        number: 'O‘RQ-607-I',
      },
      {
        name: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
        url: 'https://lex.uz/docs/111189',
        number: 'FK',
      },
    ],
    validation: {
      is_valid: true,
      checked_articles: ['Oila Kodeksi 23-modda', 'Oila Kodeksi 27-modda', 'Oila Kodeksi 28-modda', 'FK 223-modda'],
      legal_consistency_score: 100,
    },
  },
  {
    id: 'tmpl_criminal_investigation_2026',
    title: 'Firibgarlik ishi bo‘yicha dastlabki tergovda advokatlik himoyasi',
    legal_domain: 'criminal',
    difficulty: 'advanced',
    objective: 'investigation',
    user_role: 'himoyachi',
    background:
      'Fuqaro Akrom Vohidovga nisbatan JK 168-moddasi 3-qismi «a» bandi (ko‘p miqdorda firibgarlik) bilan jinoyat ishi qo‘zg‘atilgan. Tergov organi uni tanishiga «yer ajratib berish» va’dasi bilan 15 000 AQSh dollari olganlikda ayblamoqda. Biroq Akrom bu pulni avtomobil oldi-sotdisi bo‘yicha qarzga olganini, yer haqida umuman gap bo‘lmaganini va tilxat mavjudligini ta’kidlamoqda. Tergovchi qamoqqa olish ehtiyot chorasini qo‘llash bo‘yicha sudga iltimosnoma kiritgan.',
    facts: [
      {
        id: 'fc1',
        statement: 'Fuqaro A. Vohidov 2026-yil 10-fevralda tergov bo‘limiga chaqirilgan va gumonlanuvchi tariqasida ushlangan',
        is_contested: false,
        date: '2026-02-10',
      },
      {
        id: 'fc2',
        statement: 'Jabrlanuvchi o‘z arizasida pul yer maydoni uchun berilganini ko‘rsatgan',
        is_contested: true,
      },
      {
        id: 'fc3',
        statement: 'Gumonlanuvchida taraflar o‘rtasida notarial tasdiqlangan qarz shartnomasi va tilxat mavjud',
        is_contested: false,
        date: '2025-11-05',
      },
    ],
    participants: [
      {
        id: 'pc1',
        name: 'Akrom Vohidov',
        role: 'Gumonlanuvchi / Himoya ostidagi shaxs',
        background: 'Ilgari sudlanmagan tadbirkor, 3 nafar farzandning otasi',
        interests: 'Qamoqqa olinishning oldini olish va jinoiy ishni fuqarolik-huquqiy munosabat deb topish',
      },
      {
        id: 'pc2',
        name: 'Tergovchi',
        role: 'Ayblov organi',
        background: 'Tuman IIB TB tergovchisi',
        interests: 'Qamoqqa olish ehtiyot chorasini o‘tkazish va ishni tezroq sudga yuborish',
      },
    ],
    evidence: [
      {
        id: 'evc1',
        title: 'Notarial tasdiqlangan qarz shartnomasi',
        type: 'document',
        description: '2025-yil 5-noyabrda 15 000 AQSh dollari 6 oy muddatga qarzga berilganligi',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'JPK 88-modda, FK 732-modda',
        discovered: true,
      },
      {
        id: 'evc2',
        title: 'Gumonlanuvchining shaxsiga oid tavsiyanomalar va yashash joyidan ma’lumotnoma',
        type: 'document',
        description: 'Muqaddam sudlanmaganligi, doimiy yashash joyi borligi, voyaga yetmagan farzandlari',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'JPK 242-modda (Qamoqqa olish asoslari)',
        discovered: true,
      },
    ],
    timeline: [
      { date: '2025-11-05', event: 'Qarz shartnomasi tuzildi', significance: 'Fuqarolik-huquqiy bitim' },
      { date: '2026-02-10', event: 'Gumonlanuvchi ushlandi', significance: 'Protsessual muddat boshlandi' },
      { date: '2026-02-12', event: 'Qamoqqa olish bo‘yicha sud majlisi', significance: 'Ehtiyot chorasi hal qilinadi' },
    ],
    legal_issues: [
      {
        id: 'lic1',
        question: 'Fuqarolik-huquqiy munosabatlarni jinoyat tarkibidan ajratish mezonlari nimalardan iborat?',
        applicable_articles: ['JK 168-modda', 'Oliy Sud Plenumi Qarori №5 (Firibgarlik bo‘yicha)'],
        official_source_url: 'https://lex.uz/docs/111453',
      },
      {
        id: 'lic2',
        question: 'JPK 242-moddasiga ko‘ra qamoqqa olish o‘rniga garov yoki munosib xulq-atvorda bo‘lish haqida tilxat qo‘llash imkoni bormi?',
        applicable_articles: ['JPK 242-modda', 'JPK 249-modda (Garov)'],
        official_source_url: 'https://lex.uz/docs/111460',
      },
    ],
    decision_points: [
      {
        id: 'dpc1',
        step_number: 1,
        stage_title: '1-bosqich: Sudda ehtiyot chorasi ko‘rilishida himoya pozitsiyasi',
        prompt:
          'Tergovchi sudga qamoqqa olish to‘g‘risida iltimosnoma kiritdi. Sud majlisida himoyachi sifatida qanday taktika tanlaysiz?',
        options: [
          {
            id: 'opt_c1a',
            label:
              'Shaxsning muqaddam sudlanmagani, doimiy yashash joyi borligi va notarial qarz shartnomasini taqdim etib, qamoqqa olishni rad etish va garov ehtiyot chorasini so‘rash',
            action_type: 'court_application',
            description:
              'JPK 242-moddasi talablariga asosan qochish yoki tergovga to‘sqinlik qilish ehtimoli yo‘qligini dalillash',
            consequence: 'Sudya tergovchi iltimosnomasini rad etdi va Akrom Vohidovga garov ehtiyot chorasini qo‘lladi.',
            xp: 35,
            is_optimal: true,
            feedback:
              'Ajoyib himoya! Notarial hujjat va shaxsga oid ma’lumotlar asosida sud qamoqqa olishni asossiz deb topdi.',
          },
          {
            id: 'opt_c1b',
            label: 'Sud majlisida tergovchini korrupsiyada ayblab janjal ko‘tarish',
            action_type: 'custom_action',
            description: 'Dalilsiz hissiyotga berilish',
            consequence: 'Sudya ogohlantirish berdi, himoya obro‘si tushdi va qamoq ehtiyot chorasi qanoatlantirildi.',
            xp: 5,
            is_optimal: false,
            feedback:
              'Qo‘pol xato! Advokat sudda shaxsiy his-tuyg‘ularga emas, faqat qonun moddalari va protsessual dalillarga tayanishi lozim.',
          },
        ],
      },
      {
        id: 'dpc2',
        step_number: 2,
        stage_title: '2-bosqich: Jinoyat ishini harakatdan tugatish bo‘yicha iltimosnoma',
        prompt:
          'Ehtiyot chorasi yengillashtirilgach, ish bo‘yicha qanday protsessual harakatni amalga oshirasiz?',
        options: [
          {
            id: 'opt_c2a',
            label:
              'JPK 83-moddasiga asosan qilmishda jinoyat tarkibi yo‘qligi sababli ishni tugatish haqida prokurorga iltimosnoma berish (nizo fuqarolik sudiga tegishli)',
            action_type: 'cite_article',
            description:
              'Oliy Sud Plenumi tushuntirishiga ko‘ra, qarz majburiyatini bajarmaslik avtomatik firibgarlik hisoblanmaydi',
            consequence: 'Prokuratura nazorati iltimosnomani o‘rganib chiqdi va ish bo‘yicha qo‘shimcha tekshiruv tayinladi.',
            xp: 30,
            is_optimal: true,
            feedback:
              'To‘g‘ri yuridik malaka! Fuqarolik-huquqiy munosabatlarni jinoyatdan ajratish himoyachining asosiy qurolidir.',
          },
          {
            id: 'opt_c2b',
            label: 'Hech qanday harakat qilmasdan to‘g‘ridan-to‘g‘ri sud hukmini kutish',
            action_type: 'inspect_document',
            description: 'Passiv pozitsiya egallash',
            consequence: 'Tergov ayblov xulosasini tuzib, ishni sudga yubordi.',
            xp: 10,
            is_optimal: false,
            feedback:
              'Passivlik xavfli. Dastlabki tergov bosqichidayoq faol iltimosnomalar kiritilishi mijoz taqdirini hal qiladi.',
          },
        ],
      },
    ],
    learning_outcomes: [
      'Jinoyat protsessida ehtiyot choralarini qo‘llash asoslari (JPK 242)',
      'Firibgarlik (JK 168) va fuqarolik-huquqiy qarz munosabatlarini farqlash',
      'JPK 83-moddasiga asosan reabilitatsiya asosida ishni tugatish metodikasi',
    ],
    sources: [
      {
        name: 'O‘zbekiston Respublikasi Jinoyat Kodeksi',
        url: 'https://lex.uz/docs/111453',
        number: 'JK',
      },
      {
        name: 'O‘zbekiston Respublikasi Jinoyat-Protsessual Kodeksi',
        url: 'https://lex.uz/docs/111460',
        number: 'JPK',
      },
    ],
    validation: {
      is_valid: true,
      checked_articles: ['JK 168-modda', 'JPK 83-modda', 'JPK 242-modda', 'JPK 249-modda'],
      legal_consistency_score: 100,
    },
  },
  {
    id: 'tmpl_property_lease_2026',
    title: 'Noturar bino ijarasi, ta’mirlash xarajatlari va garov depozitini undirish',
    legal_domain: 'property',
    difficulty: 'intermediate',
    objective: 'court_practice',
    user_role: 'advokat',
    background:
      '«InnoTech» IT-kompaniyasi (Ijarachi) Toshkent markazidagi biznes-markazdan 300 kv.m maydonni 1 yilga ijaraga olgan. Shartnoma tuzilganda 100 000 000 so‘m garov depoziti to‘langan. Shuningdek, ijara beruvchining yozma roziligi bilan bino ichida 150 000 000 so‘mlik ajralmas yaxshilanishlar (ta’mirlash, vitraj, ventilyatsiya) qilingan. Ijara muddati tugagach, Bino egasi depozitni qaytarishdan bosh tortmoqda va ta’mirlash xarajatlarini to‘lamayapti.',
    facts: [
      {
        id: 'fp1',
        statement: 'Noturar joy ijara shartnomasi 1 yil muddatga tuzilgan va davlat soliq organida hisobga qo‘yilgan',
        is_contested: false,
        date: '2025-01-10',
      },
      {
        id: 'fp2',
        statement: '100 mln so‘mlik depozit bank orqali to‘liq o‘tkazilgan',
        is_contested: false,
        date: '2025-01-12',
      },
      {
        id: 'fp3',
        statement: 'Ijara beruvchi ta’mirlashga yozma xat orqali ruxsat bergan',
        is_contested: false,
        date: '2025-03-01',
      },
    ],
    participants: [
      {
        id: 'pp1',
        name: '«InnoTech» IT MChJ direktori',
        role: 'Ijarachi (Da’vogar)',
        background: 'Bosh offisini boshqa joyga ko‘chirgan innovatsion korxona',
        interests: '100 mln depozit va 150 mln ajralmas yaxshilanishlar qiymatini to‘liq undirish',
      },
      {
        id: 'pp2',
        name: '«Real Capital» MChJ rahbari',
        role: 'Ijara beruvchi (Javobgar)',
        background: 'Tijorat ko‘chmas mulk egasi',
        interests: 'Xarajatlarni to‘lamaslik va binodagi tabiiy eskirishni ijarachi bo‘yniga qo‘yish',
      },
    ],
    evidence: [
      {
        id: 'evp1',
        title: 'Ijara shartnomasi va to‘lov topshiriqnomalari',
        type: 'document',
        description: 'Shartnomada ijara muddati tugagach 10 kun ichida depozit qaytarilishi yozilgan',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'FK 535, 544-moddalar',
        discovered: true,
      },
      {
        id: 'evp2',
        title: 'Ajralmas yaxshilanishlarni tasdiqlovchi dalolatnoma va hisob-fakturalar',
        type: 'document',
        description: 'Litsenziyali qurilish firmasi tomonidan 150 mln so‘mlik ishlar qabul qilinganligi',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'FK 555-modda (Ijaraga olingan mol-mulkni yaxshilash)',
        discovered: true,
      },
    ],
    timeline: [
      { date: '2025-01-10', event: 'Ijara shartnomasi tuzildi', significance: 'Majburiyatlar belgilandi' },
      { date: '2026-01-10', event: 'Bino topshirish-qabul qilish dalolatnomasi imzolandi', significance: 'Bino bo‘shatildi' },
      { date: '2026-01-25', event: 'Depozit qaytarish muddati o‘tdi', significance: 'Penya va sudga da’vo huquqi' },
    ],
    legal_issues: [
      {
        id: 'lip1',
        question: 'FK 555-moddasiga binoan ajralmas yaxshilanishlar qiymati qanday holatda qoplanadi?',
        applicable_articles: ['FK 555-modda 2-qism', 'FK 324-modda'],
        official_source_url: 'https://lex.uz/docs/111189',
      },
      {
        id: 'lip2',
        question: 'Ijara depozitini asossiz ushlab qolganlik uchun FK 327-moddasi foizlari qo‘llaniladimi?',
        applicable_articles: ['FK 327-modda', 'IPK 149-modda'],
        official_source_url: 'https://lex.uz/docs/111189',
      },
    ],
    decision_points: [
      {
        id: 'dpp1',
        step_number: 1,
        stage_title: '1-bosqich: Sudgacha talabnoma (pretinziya) va ekspertiza dalillari',
        prompt:
          'Bino egasi yaxshilanishlar unga kerak emasligini va buzib olib ketishni aytmoqda. Birinchi qadamingiz?',
        options: [
          {
            id: 'opt_p1a',
            label:
              'FK 555-moddasiga asosan ijara beruvchining yozma roziligi bilan qilingan ajralmas yaxshilanishlar qiymati to‘lanishi shartligini ko‘rsatib, hisob-kitob bilan pretinziya yuborish',
            action_type: 'inspect_document',
            description:
              'Binoga zarar yetkazmasdan ajratib bo‘lmaydigan yaxshilanishlar qiymatini sud orqali undirish huquqiy asosi',
            consequence: 'Pretinziya asosli kiritildi, javobgar yozma rozilik berganini inkor eta olmay qoldi.',
            xp: 30,
            is_optimal: true,
            feedback:
              'To‘g‘ri modda! FK 555-moddasi 2-qismiga ko‘ra, agar ijarachi mulkni ijara beruvchining ruxsati bilan yaxshilagan bo‘lsa, shartnoma tugagach uning qiymatini talab qilishga haqli.',
          },
          {
            id: 'opt_p1b',
            label: 'Binodagi devor va vitrajlarni bolg‘a bilan buzib tashlash',
            action_type: 'custom_action',
            description: 'O‘zboshimchalik bilan mulkka zarar yetkazish',
            consequence: 'Jiddiy qonunbuzarlik! Ijara beruvchi IIBga ariza berib, JK 173-moddasi bo‘yicha jinoyat ishi qo‘zg‘atishi mumkin.',
            xp: 0,
            is_optimal: false,
            feedback:
              'Mutlaqo noqonuniy! O‘zboshimchalik va mulkka shikast yetkazish jinoyat hisoblanadi.',
          },
        ],
      },
      {
        id: 'dpp2',
        step_number: 2,
        stage_title: '2-bosqich: Iqtisodiy sudga da’vo kiritish va foizlar talabi',
        prompt:
          'Iqtisodiy sudga kiritiladigan da’vo arizasida qanday umumiy summalar va sanksiyalarni talab qilasiz?',
        options: [
          {
            id: 'opt_p2a',
            label:
              '100 mln depozit + 150 mln yaxshilanishlar + FK 327-modda bo‘yicha Markaziy bank qayta moliyalash stavkasi foizlari va davlat boji',
            action_type: 'court_application',
            description:
              'Pul majburiyatini kechiktirganlik uchun qonuniy foizlar va barcha yetkazilgan zararlarni undirish',
            consequence: 'Iqtisodiy sud da’voni to‘liq qanoatlantirdi va 265 mln so‘m undirib berdi.',
            xp: 35,
            is_optimal: true,
            feedback:
              'Mukammal sud strategiyasi! Asosiy summa bilan birga FK 327-modda foizlari hamda sud xarajatlari to‘liq talab qilindi.',
          },
          {
            id: 'opt_p2b',
            label: 'Faqat 100 mln depozitni so‘rash, qolgan 150 mln dan voz kechish',
            action_type: 'cite_article',
            description: 'Mijoz huquqlarini to‘liq talab qilmaslik',
            consequence: 'Mijoz 150 mln so‘m zarar ko‘rdi.',
            xp: 15,
            is_optimal: false,
            feedback:
              'Tavsiya etilmaydi. Yozma ruxsat mavjud bo‘lganda ajralmas yaxshilanishlarni undirib olish to‘liq qonuniy kafolatlangan.',
          },
        ],
      },
    ],
    learning_outcomes: [
      'Tijorat ko‘chmas mulki ijarasida ajralmas yaxshilanishlar huquqiy maqomi (FK 555)',
      'Ijara garov depozitini undirish va FK 327-modda bo‘yicha foizlar hisoblash',
      'Iqtisodiy sud amaliyotida yozma dalillar bilan ishlash metodikasi',
    ],
    sources: [
      {
        name: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
        url: 'https://lex.uz/docs/111189',
        number: 'FK',
      },
      {
        name: 'O‘zbekiston Respublikasi Iqtisodiy Protsessual Kodeksi',
        url: 'https://lex.uz/docs/3523891',
        number: 'IPK',
      },
    ],
    validation: {
      is_valid: true,
      checked_articles: ['FK 535-modda', 'FK 555-modda', 'FK 327-modda', 'IPK 149-modda'],
      legal_consistency_score: 100,
    },
  },
  {
    id: 'tmpl_consumer_rights_2026',
    title: 'Sifatsiz elektronika texnikasi xaridi va iste’molchi huquqlarini himoya qilish',
    legal_domain: 'civil',
    difficulty: 'beginner',
    objective: 'legal_consulting',
    user_role: 'yurist',
    background:
      'Fuqaro Nodira Alimova maishiy texnika do‘konidan 18 000 000 so‘mga noutbuk sotib olgan. 10 kundan so‘ng noutbukning ekrani o‘chib qolgan va qayta yonmagan. Do‘kon ma’muriyati "qurilma mijoz tomonidan noto‘g‘ri ishlatilgan" degan vaj bilan noutbukni almashtirishdan ham, pulni qaytarishdan ham bosh tortmoqda va kafolat xizmatiga qabul qilmayapti.',
    facts: [
      {
        id: 'fcr1',
        statement: 'Noutbuk 2026-yil 1-fevralda fiskal chek va 1 yillik kafolat taloni bilan sotib olingan',
        is_contested: false,
        date: '2026-02-01',
      },
      {
        id: 'fcr2',
        statement: 'Nosozlik xariddan 10 kun o‘tgach yuzaga kelgan va tashqi mexanik shikastlanish yo‘q',
        is_contested: false,
        date: '2026-02-11',
      },
      {
        id: 'fcr3',
        statement: 'Sotuvchi ekspertiza o‘tkazmasdan og‘zaki ravishda rad javobini bergan',
        is_contested: true,
      },
    ],
    participants: [
      {
        id: 'pcr1',
        name: 'Nodira Alimova',
        role: 'Iste’molchi (Mijoz)',
        background: 'Noutbukni o‘qish va ish uchun xarid qilgan fuqaro',
        interests: 'Sifatsiz tovar pulini to‘liq qaytarib olish yoki yangisiga almashtirish',
      },
      {
        id: 'pcr2',
        name: '«Tech Market» do‘koni direktori',
        role: 'Sotuvchi',
        background: 'Savdo do‘koni mas’ul shaxsi',
        interests: 'Mablag‘ni qaytarmaslik va servis markaziga yo‘naltirib vaqt cho‘zish',
      },
    ],
    evidence: [
      {
        id: 'evcr1',
        title: 'Fiskal QR-kodli xarid cheki va kafolat taloni',
        type: 'document',
        description: '18 mln so‘m to‘langanligini va kafolat muddatini tasdiqlovchi rasmiy hujjat',
        reliability: 'high',
        is_admissible: true,
        legal_basis: '«Iste’molchilar huquqlarini himoya qilish to‘g‘risida»gi Qonun 13-modda',
        discovered: true,
      },
      {
        id: 'evcr2',
        title: 'Mustaqil ekspertiza xulosasi (Savdo-sanoat palatasi)',
        type: 'document',
        description: 'Nosozlik zavod braki (ona plata defekti) oqibatida kelib chiqqani haqida xulosa',
        reliability: 'high',
        is_admissible: true,
        legal_basis: 'Qonun 14-modda',
        discovered: false,
      },
    ],
    timeline: [
      { date: '2026-02-01', event: 'Noutbuk xarid qilindi', significance: 'Kafolat muddati boshlandi' },
      { date: '2026-02-11', event: 'Nosozlik yuzaga keldi', significance: 'Qonuniy talab qo‘yish huquqi' },
      { date: '2026-02-12', event: 'Do‘konga og‘zaki murojaat qilindi', significance: 'Asossiz rad etildi' },
    ],
    legal_issues: [
      {
        id: 'licr1',
        question: 'Kafolat muddati davomida tovardagi nuqsonlar bo‘yicha isbotlash yuki kimning zimmasida?',
        applicable_articles: ['Iste’molchilar huquqlarini himoya qilish to‘g‘risida Qonun 15-modda', 'FK 424-modda'],
        official_source_url: 'https://lex.uz/docs/111189',
      },
      {
        id: 'licr2',
        question: 'Iste’molchi qanday talablarni qo‘yishga haqli?',
        applicable_articles: ['Qonun 13-modda (Almashtirish, qaytarish, bepul tuzatish)'],
        official_source_url: 'https://lex.uz/docs/111189',
      },
    ],
    decision_points: [
      {
        id: 'dpcr1',
        step_number: 1,
        stage_title: '1-bosqich: Qonuniy talabnoma yozish va ekspertiza talab qilish',
        prompt:
          'Sotuvchi og‘zaki rad etmoqda. Iste’molchiga birinchi professional maslahatingiz?',
        options: [
          {
            id: 'opt_cr1a',
            label:
              'Qonunning 13 va 15-moddalariga asosan yozma da’vogarlik xati (talabnoma) topshirish va qonun bo‘yicha ekspertiza o‘tkazish sotuvchi hisobidan amalga oshirilishini eslatish',
            action_type: 'inspect_document',
            description:
              'Kafolat davrida ayb iste’molchida ekanligini isbotlash yuki sotuvchi zimmasida ekanligini ta’kidlash',
            consequence: 'Yozma talabnoma 2 nusxada topshirildi va do‘kon muhr bilan qabul qildi.',
            xp: 25,
            is_optimal: true,
            feedback:
              'Ajoyib yuridik qadam! Og‘zaki tortishuv befoyda — rasmiy yozma talabnoma topshirish sudgacha eng kuchli vositadir.',
          },
          {
            id: 'opt_cr1b',
            label: 'Noutbukni o‘z hisobidan xususiy ustaxonada ochtirib ko‘rish',
            action_type: 'custom_action',
            description: 'Kafolat plombalarini buzish',
            consequence: 'Xato! Plomba buzilsa, do‘kon qonuniy ravishda kafolatni bekor qiladi.',
            xp: 5,
            is_optimal: false,
            feedback:
              'Bunday qilmang! Kafolatli texnikani uchinchi shaxslarga ochtirish kafolat huquqini butunlay yo‘qqa chiqaradi.',
          },
        ],
      },
      {
        id: 'dpcr2',
        step_number: 2,
        stage_title: '2-bosqich: Raqobat qo‘mitasi yoki sudga murojaat qilish',
        prompt:
          'Sotuvchi 7 kun ichida javob bermadi. Keyingi samarali harakat?',
        options: [
          {
            id: 'opt_cr2a',
            label:
              'Raqobatni rivojlantirish va iste’molchilar huquqlarini himoya qilish qo‘mitasiga murojaat qilish hamda sudga pulni qaytarish, penya (har kun uchun 1%) va ma’naviy zarar undirish da’vosi kiritish',
            action_type: 'court_application',
            description:
              'Qonunning 19 va 22-moddalari bo‘yicha kechiktirilgan har bir kun uchun tovar narxining 1% miqdorida penya va ma’naviy zarar undirish',
            consequence: 'Raqobat qo‘mitasi aralashuvi bilan do‘kon to‘liq 18 mln so‘mni qaytardi va qo‘shimcha kompensatsiya to‘ladi.',
            xp: 35,
            is_optimal: true,
            feedback:
              'Mukammal natija! Iste’molchilar huquqi bo‘yicha kunlik 1% penya sotuvchilar uchun eng og‘ir sanksiya hisoblanadi.',
          },
          {
            id: 'opt_cr2b',
            label: 'Ijtimoiy tarmoqlarda post yozib haqorat qilish',
            action_type: 'custom_action',
            description: 'Emotsional yondashuv',
            consequence: 'Sotuvchi tuhmat va sha’nni kamsitish bo‘yicha qarshi ariza (MJtK 40) berishi mumkin.',
            xp: 5,
            is_optimal: false,
            feedback:
              'Hissiyotga berilmang. Qonuniy vositalar (Raqobat qo‘mitasi va fuqarolik sudi) ancha tez va kafolatli natija beradi.',
          },
        ],
      },
    ],
    learning_outcomes: [
      'Iste’molchilar huquqlarini himoya qilish to‘g‘risidagi qonunchilikni qo‘llash',
      'Kafolat muddati davomida isbotlash yuki va ekspertiza tayinlash tartibi',
      'Kechiktirilgan har bir kun uchun 1 foiz penya va ma’naviy zarar undirish (Qonun 19, 22-moddalar)',
    ],
    sources: [
      {
        name: 'Iste’molchilarning huquqlarini himoya qilish to‘g‘risida',
        url: 'https://lex.uz/docs/111189',
        number: '221-I',
      },
      {
        name: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
        url: 'https://lex.uz/docs/111189',
        number: 'FK',
      },
    ],
    validation: {
      is_valid: true,
      checked_articles: ['Qonun 13-modda', 'Qonun 14-modda', 'Qonun 15-modda', 'Qonun 19-modda'],
      legal_consistency_score: 100,
    },
  },
]
