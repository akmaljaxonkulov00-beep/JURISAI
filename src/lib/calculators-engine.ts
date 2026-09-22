import {
  StateFeeInput,
  StateFeeResult,
  StateFeeBreakdownItem,
  PenaltyInput,
  PenaltyResult,
  Interest327Input,
  Interest327Result,
  BhmInput,
  BhmResult,
  DeadlineInput,
  DeadlineResult,
} from '@/types/professional-tools'
import {
  CURRENT_BHM_VALUE,
  CURRENT_CBU_MAIN_RATE,
  OFFICIAL_LEGAL_SOURCES,
} from './official-sources-registry'

/**
 * 1. Davlat Boji Kalkulyatori
 * Asos: O‘zbekiston Respublikasining "Davlat boji to‘g‘risida"gi O‘RQ-600-son Qonuni
 */
export function calculateStateFee(input: StateFeeInput): StateFeeResult {
  const bhm = CURRENT_BHM_VALUE
  const amount = input.claimAmount || 0
  const instance = input.instance || 'first_instance'

  let baseFee = 0
  const breakdown: StateFeeBreakdownItem[] = []
  const legalBases: string[] = []
  const notes: string[] = []

  if (input.isExempted) {
    return {
      totalFee: 0,
      bhmRate: bhm,
      breakdown: [
        {
          name: 'Davlat bojidan ozod qilingan',
          rateDescription: input.exemptionReason || 'Qonuniy imtiyoz',
          calculatedAmount: 0,
          legalGround: 'O‘RQ-600-son Qonun 8-10-moddalari (Davlat bojidan ozod qilish)',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        },
      ],
      legalBases: ['O‘RQ-600-son Qonun 8-10-moddalari'],
      officialSources: [OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW],
      calculationFormula: '0 so‘m (Ozod etilgan)',
      notes: ['Da‘vogar davlat boji to‘lashdan ozod etilgan'],
    }
  }

  if (input.courtType === 'civil') {
    // Fuqarolik ishlari bo'yicha sudlar
    switch (input.claimType) {
      case 'property': {
        // Mulkiy xarakterdagi da'volar: 4%, kamida 1 BHM
        const percentageFee = Math.round(amount * 0.04)
        baseFee = Math.max(bhm, percentageFee)
        breakdown.push({
          name: 'Fuqarolik sudi — Mulkiy da‘vo',
          rateDescription: 'Da‘vo bahosining 4 foizi (kamida 1 BHM)',
          calculatedAmount: baseFee,
          statutoryMinimum: bhm,
          legalGround: 'O‘RQ-600-son Qonun ilovasi 1-bandi "a" kichik bandi',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        })
        legalBases.push('O‘RQ-600 Qonun ilovasi 1-bandi "a" bandi: 4% (min 1 BHM)')
        break
      }
      case 'non_property': {
        // Nomulkiy da'volar: 2 BHM
        baseFee = bhm * 2
        breakdown.push({
          name: 'Fuqarolik sudi — Nomulkiy da‘vo',
          rateDescription: 'BHMning 2 baravari',
          calculatedAmount: baseFee,
          legalGround: 'O‘RQ-600-son Qonun ilovasi 1-bandi "b" kichik bandi',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        })
        legalBases.push('O‘RQ-600 Qonun ilovasi 1-bandi "b" bandi: 2 BHM')
        break
      }
      case 'divorce': {
        // Nikohni bekor qilish: 2 BHM
        baseFee = bhm * 2
        breakdown.push({
          name: 'Nikohni bekor qilish haqidagi da‘vo',
          rateDescription: 'BHMning 2 baravari',
          calculatedAmount: baseFee,
          legalGround: 'O‘RQ-600-son Qonun ilovasi 1-bandi "g" kichik bandi',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        })
        legalBases.push('O‘RQ-600 Qonun ilovasi 1-bandi "g" bandi: 2 BHM')
        break
      }
      case 'divorce_repeated': {
        // Takroriy nikohni bekor qilish: 4 BHM
        baseFee = bhm * 4
        breakdown.push({
          name: 'Takroriy nikohni bekor qilish da‘vosi',
          rateDescription: 'BHMning 4 baravari',
          calculatedAmount: baseFee,
          legalGround: 'O‘RQ-600-son Qonun ilovasi 1-bandi "d" kichik bandi',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        })
        legalBases.push('O‘RQ-600 Qonun ilovasi 1-bandi "d" bandi: 4 BHM')
        break
      }
      case 'inheritance': {
        // Meros nizolari: 4%, kamida 1 BHM
        const percentageFee = Math.round(amount * 0.04)
        baseFee = Math.max(bhm, percentageFee)
        breakdown.push({
          name: 'Meros mulkini taqsimlash da‘vosi',
          rateDescription: 'Meros ulushi bahosining 4 foizi (kamida 1 BHM)',
          calculatedAmount: baseFee,
          statutoryMinimum: bhm,
          legalGround: 'O‘RQ-600-son Qonun ilovasi 1-bandi',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        })
        legalBases.push('O‘RQ-600 Qonun ilovasi 1-bandi: 4% (min 1 BHM)')
        break
      }
      default: {
        baseFee = bhm * 2
        breakdown.push({
          name: 'Boshqa fuqarolik da‘volari',
          rateDescription: 'BHMning 2 baravari',
          calculatedAmount: baseFee,
          legalGround: 'O‘RQ-600-son Qonun ilovasi',
          sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
        })
      }
    }
  } else if (input.courtType === 'economic') {
    // Iqtisodiy sudlar
    if (input.claimType === 'property') {
      // Mulkiy da'volar: 2%, kamida 1 BHM
      const percentageFee = Math.round(amount * 0.02)
      baseFee = Math.max(bhm, percentageFee)
      breakdown.push({
        name: 'Iqtisodiy sud — Mulkiy da‘vo',
        rateDescription: 'Da‘vo bahosining 2 foizi (kamida 1 BHM)',
        calculatedAmount: baseFee,
        statutoryMinimum: bhm,
        legalGround: 'O‘RQ-600-son Qonun ilovasi 2-bandi "a" kichik bandi',
        sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
      })
      legalBases.push('O‘RQ-600 Qonun ilovasi 2-bandi "a" bandi: 2% (min 1 BHM)')
    } else {
      // Nomulkiy da'volar: 10 BHM
      baseFee = bhm * 10
      breakdown.push({
        name: 'Iqtisodiy sud — Nomulkiy da‘vo / Shartnoma shartlarini o‘zgartirish',
        rateDescription: 'BHMning 10 baravari',
        calculatedAmount: baseFee,
        legalGround: 'O‘RQ-600-son Qonun ilovasi 2-bandi "b" kichik bandi',
        sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
      })
      legalBases.push('O‘RQ-600 Qonun ilovasi 2-bandi "b" bandi: 10 BHM')
    }
  } else {
    // Ma'muriy sudlar
    baseFee = bhm * 1
    breakdown.push({
      name: 'Ma‘muriy sud — Davlat organi qarori ustidan shikoyat',
      rateDescription: 'BHMning 1 baravari',
      calculatedAmount: baseFee,
      legalGround: 'O‘RQ-600-son Qonun ilovasi 3-bandi',
      sourceUrl: OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url,
    })
    legalBases.push('O‘RQ-600 Qonun ilovasi 3-bandi: 1 BHM')
  }

  // Instansiya bo'yicha hisoblash (Apellyatsiya / Kassatsiya uchun 50%)
  let finalFee = baseFee
  if (instance === 'appeal' || instance === 'cassation') {
    finalFee = Math.round(baseFee * 0.5)
    notes.push(
      `${instance === 'appeal' ? 'Apellyatsiya' : 'Kassatsiya'} shikoyati uchun stavka 50% miqdorida hisoblandi (O‘RQ-600 Qonun ilovasi).`
    )
  }

  return {
    totalFee: finalFee,
    bhmRate: bhm,
    breakdown,
    legalBases,
    officialSources: [OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW, OFFICIAL_LEGAL_SOURCES.BHM_DECREE],
    calculationFormula:
      instance === 'first_instance'
        ? `Baza miqdori: ${baseFee.toLocaleString('uz-UZ')} so‘m`
        : `Birinchi instansiya stavkasi (${baseFee.toLocaleString('uz-UZ')} so‘m) * 50% = ${finalFee.toLocaleString('uz-UZ')} so‘m`,
    notes,
  }
}

/**
 * 2. Penya va Jarima Kalkulyatori
 * Asos: "Xo‘jalik yurituvchi subyektlar faoliyatining shartnomaviy-huquqiy bazasi to‘g‘risida"gi O‘zbekiston Qonuni (670-I)
 */
export function calculatePenaltyAndDamages(input: PenaltyInput): PenaltyResult {
  const contractAmount = input.contractAmount || 0
  const daysLate = Math.max(0, input.daysLate || 0)
  const dailyRatePercent = input.dailyRatePercent != null ? input.dailyRatePercent : 0.5
  const maxCapPercent = input.maxCapPercent != null ? input.maxCapPercent : 50

  const dailyRateDecimal = dailyRatePercent / 100
  const rawPenalty = Math.round(contractAmount * dailyRateDecimal * daysLate)
  const capAmount = Math.round(contractAmount * (maxCapPercent / 100))

  const isCapped = rawPenalty > capAmount
  const penaltyAmount = isCapped ? capAmount : rawPenalty

  let interest327Amount = 0
  if (input.includeInterest327) {
    interest327Amount = Math.round(
      contractAmount * (CURRENT_CBU_MAIN_RATE / 100) * (daysLate / 365)
    )
  }

  const totalClaim = penaltyAmount + interest327Amount

  const formula = isCapped
    ? `${contractAmount.toLocaleString()} so‘m * ${dailyRatePercent}% * ${daysLate} kun = ${rawPenalty.toLocaleString()} so‘m (50% qonuniy cheklov qo‘llanildi: ${capAmount.toLocaleString()} so‘m)`
    : `${contractAmount.toLocaleString()} so‘m * ${dailyRatePercent}% * ${daysLate} kun = ${penaltyAmount.toLocaleString()} so‘m`

  return {
    penaltyAmount,
    effectiveDailyRate: dailyRatePercent,
    isCapped,
    capAmount,
    daysCounted: daysLate,
    interest327Amount: input.includeInterest327 ? interest327Amount : undefined,
    totalClaim,
    calculationFormula: formula,
    legalBases: [
      '670-I-son Qonun 25-32-moddalari (Penya kuniga 0.5%, max 50%)',
      ...(input.includeInterest327
        ? ['O‘zbekiston FK 327-moddasi (Markaziy Bankning 13.5% stavkasi bo‘yicha foiz)']
        : []),
    ],
    officialSources: [
      OFFICIAL_LEGAL_SOURCES.CONTRACT_LAW_670,
      ...(input.includeInterest327
        ? [OFFICIAL_LEGAL_SOURCES.CIVIL_CODE, OFFICIAL_LEGAL_SOURCES.CBU_MAIN_RATE]
        : []),
    ],
  }
}

/**
 * 3. Boshqa shaxslarning pul mablag'laridan foydalanganlik uchun foizlar (FK 327)
 */
export function calculateInterest327(input: Interest327Input): Interest327Result {
  const debt = input.debtAmount || 0
  const days = Math.max(0, input.daysCount || 0)
  const annualRate = input.customAnnualRate != null ? input.customAnnualRate : CURRENT_CBU_MAIN_RATE

  const dailyRate = annualRate / 365
  const interestAmount = Math.round(debt * (annualRate / 100) * (days / 365))

  const formula = `${debt.toLocaleString()} so‘m * (${annualRate}% / 365 kun) * ${days} kun = ${interestAmount.toLocaleString()} so‘m`

  return {
    interestAmount,
    annualRateApplied: annualRate,
    cbuRateDate: '2024-12-12',
    daysCount: days,
    dailyRate,
    calculationFormula: formula,
    legalBases: [
      'O‘zbekiston Respublikasi FK 327-moddasi (Pul majburiyatini bajarmaganlik uchun foizlar)',
      `Markaziy bank Boshqaruvining asosiy stavka to‘g‘risidagi qarori (Yillik ${annualRate}%)`,
    ],
    officialSources: [OFFICIAL_LEGAL_SOURCES.CIVIL_CODE, OFFICIAL_LEGAL_SOURCES.CBU_MAIN_RATE],
  }
}

/**
 * 4. BHM Kalkulyatori
 */
export function calculateBhm(input: BhmInput): BhmResult {
  const bhm = input.customBhmRate || CURRENT_BHM_VALUE
  const multiplier = input.multiplier || 1
  const total = Math.round(bhm * multiplier)

  return {
    multiplier,
    singleBhmAmount: bhm,
    totalAmount: total,
    decreeNumber: 'PF-108-son',
    effectiveFrom: '2024-09-01',
    officialSources: [OFFICIAL_LEGAL_SOURCES.BHM_DECREE],
  }
}

/**
 * 5. Da'vo va Protsessual Muddatlar Kalkulyatori
 */
export function calculateDeadlines(input: DeadlineInput): DeadlineResult {
  const start = new Date(input.startDate)
  let daysToAdd = 365 * 3 // default 3 years
  let durationText = '3 yil (Umumiy da‘vo muddati)'
  const legalBases: string[] = []
  const proceduralSteps: string[] = []

  switch (input.disputeCategory) {
    case 'civil_general':
      daysToAdd = 365 * 3
      durationText = '3 yil (Umumiy da‘vo muddati)'
      legalBases.push('O‘zbekiston Respublikasi FK 150-moddasi (Umumiy da‘vo muddati)')
      proceduralSteps.push(
        'Da‘vo arizasini tayyorlash va sudga taqdim etish',
        'Da‘vo muddati o‘tgan taqdirda uzrli sabablar bilan muddatni tiklash arizasi kiritish'
      )
      break
    case 'labor_reinstatement':
      daysToAdd = 30
      durationText = '1 oy (Ishga tiklash bo‘yicha)'
      legalBases.push('O‘zbekiston Respublikasi MK 560-moddasi (Ishga tiklash muddatlari)')
      proceduralSteps.push(
        'Ishdan bo‘shatish to‘g‘risidagi buyruq nusxasi berilgan kundan e‘tiboran 1 oy ichida sudga murojaat qilish'
      )
      break
    case 'labor_other':
      daysToAdd = 180
      durationText = '6 oy (Boshqa mehnat nizolari bo‘yicha)'
      legalBases.push('O‘zbekiston Respublikasi MK 560-moddasi')
      proceduralSteps.push('Xodim o‘z huquqi buzilganligini bilgan kundan boshlab 6 oy ichida')
      break
    case 'contract_breach':
      daysToAdd = 365 * 3
      durationText = '3 yil'
      legalBases.push('O‘zbekiston Respublikasi FK 150-moddasi')
      proceduralSteps.push(
        'Majburiyat bajarilishi lozim bo‘lgan muddat tugagan kundan boshlab da‘vo muddati oqimi boshlanadi'
      )
      break
    case 'appeal_civil':
      daysToAdd = 30
      durationText = '1 oy (Apellyatsiya shikoyati berish)'
      legalBases.push('O‘zbekiston Respublikasi FPK 385-moddasi')
      proceduralSteps.push(
        'Sud hal qiluv qarori to‘liq hajmda qabul qilingan kundan e‘tiboran 1 oy ichida shikoyat berish'
      )
      break
    case 'appeal_economic':
      daysToAdd = 30
      durationText = '1 oy (Iqtisodiy sud apellyatsiyasi)'
      legalBases.push('O‘zbekiston Respublikasi IPK 259-moddasi')
      proceduralSteps.push('Hal qiluv qarori qabul qilingan kundan e‘tiboran 1 oy ichida')
      break
  }

  const deadlineDateObj = new Date(start)
  deadlineDateObj.setDate(deadlineDateObj.getDate() + daysToAdd)

  const today = new Date()
  const isExpired = today.getTime() > deadlineDateObj.getTime()
  const daysRemaining = Math.ceil(
    (deadlineDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    startDate: input.startDate,
    deadlineDate: deadlineDateObj.toISOString().split('T')[0],
    durationText,
    isExpired,
    daysRemaining,
    legalBases,
    officialSources: [OFFICIAL_LEGAL_SOURCES.CIVIL_CODE, OFFICIAL_LEGAL_SOURCES.LABOR_CODE],
    proceduralSteps,
  }
}
