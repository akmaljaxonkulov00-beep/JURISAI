import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/professional-tools/legal-calculator
 * 
 * O'zbekiston Respublikasi qonunchiligiga asoslangan yuridik kalkulyator.
 * Davlat boji, zarar, jarima va muddatlarni hisoblaydi.
 */

// Davlat boji stavkalariga moslashtirilgan (2024-2025)
const STATE_FEE_RATES = [
  { min: 0, max: 1_000_000, rate: 0.04, minFee: 40_000 },
  { min: 1_000_001, max: 10_000_000, rate: 0.03, minFee: 400_000 },
  { min: 10_000_001, max: 50_000_000, rate: 0.02, minFee: 300_000 },
  { min: 50_000_001, max: 100_000_000, rate: 0.015, minFee: 1_000_000 },
  { min: 100_000_001, max: Infinity, rate: 0.01, minFee: 1_500_000 },
]

// Markaziy bank stavkasi (2025-yil uchun)
const CBR_RATE = 0.14 // 14%

// Jarima stavkasi (kechikish uchun)
const PENALTY_RATE = 0.001 // kuniga 0.1%

interface CalculatorRequest {
  case_type?: string
  claim_amount?: number
  contract_amount?: number
  days_late?: number
  start_date?: string
}

function calculateStateFee(amount: number): number {
  for (const tier of STATE_FEE_RATES) {
    if (amount >= tier.min && amount <= tier.max) {
      return Math.max(tier.minFee, Math.round(amount * tier.rate))
    }
  }
  return Math.round(amount * 0.01) // default 1%
}

function calculateDamages(contractAmount: number, daysLate: number): number {
  // Penya: kuniga 0.1% (O'zbekiston FK 355-moddasi)
  const penalty = contractAmount * PENALTY_RATE * daysLate
  // Ustama: CBR stavkasi asosida
  const interest = contractAmount * CBR_RATE * (daysLate / 365)
  return Math.round(penalty + interest)
}

function calculateDeadlines(startDate: string, caseType: string) {
  const start = new Date(startDate)
  const deadlines: { event: string; date: string; days: number }[] = []

  switch (caseType) {
    case 'civil':
      deadlines.push(
        { event: "Da'vo arizasi ko'rib chiqilishi", date: addDays(start, 2), days: 2 },
        { event: "Javobgar dalillarni taqdim etish", date: addDays(start, 14), days: 14 },
        { event: "Sud majlisi (birinchi)", date: addDays(start, 30), days: 30 },
        { event: "Sud qarori qabul qilinishi", date: addDays(start, 60), days: 60 },
        { event: "Apellyatsiya muddati", date: addDays(start, 90), days: 90 },
      )
      break
    case 'criminal':
      deadlines.push(
        { event: "Ter gov tugallanishi", date: addDays(start, 45), days: 45 },
        { event: "Ayblov xulosasi", date: addDays(start, 50), days: 50 },
        { event: "Sudning birinchi majlisi", date: addDays(start, 60), days: 60 },
        { event: "Sud qarori", date: addDays(start, 90), days: 90 },
      )
      break
    case 'administrative':
      deadlines.push(
        { event: "Xabarnoma yuborilishi", date: addDays(start, 3), days: 3 },
        { event: "Javob taqdim etish", date: addDays(start, 10), days: 10 },
        { event: "Sud majlisi", date: addDays(start, 30), days: 30 },
        { event: "Qaror qabul qilinishi", date: addDays(start, 45), days: 45 },
      )
      break
    default:
      deadlines.push(
        { event: "Ko'rib chiqish", date: addDays(start, 30), days: 30 },
        { event: "Qaror", date: addDays(start, 60), days: 60 },
      )
  }

  return deadlines
}

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculatorRequest = await request.json()
    const { case_type = 'civil', claim_amount = 0, contract_amount = 0, days_late = 0, start_date } = body

    // Davlat boji
    const stateFee = calculateStateFee(claim_amount || contract_amount)

    // Zarar va jarima
    const damages = contract_amount > 0 && days_late > 0
      ? calculateDamages(contract_amount, days_late)
      : 0

    // Foiz (CBR asosida)
    const interest = contract_amount > 0 && days_late > 0
      ? Math.round(contract_amount * CBR_RATE * (days_late / 365))
      : 0

    // Jami
    const total = stateFee + damages

    // Breakdown
    const breakdown = [
      { item: 'Davlat boji', amount: stateFee, description: "Da'vo summasi asosida" },
    ]
    if (damages > 0) {
      breakdown.push({ item: 'Penya (jarima)', amount: damages - interest, description: 'Kechikish uchun' })
    }
    if (interest > 0) {
      breakdown.push({ item: 'Foiz', amount: interest, description: `CBR stavkasi (${CBR_RATE * 100}%)` })
    }

    // Huquqiy asos
    const legalBasis = [
      "O'zbekiston Respublikasi FK 333-moddasi — Davlat boji",
      "O'zbekiston Respublikasi FK 355-moddasi — Jarimalar",
      "MB stavkasi asosida foiz hisoblash",
    ]

    // Muddatlar
    const deadlines = start_date ? calculateDeadlines(start_date, case_type) : []

    return NextResponse.json({
      state_fee: stateFee,
      damages,
      interest,
      total,
      breakdown,
      legal_basis: legalBasis,
      deadlines,
      court_fee: stateFee,
      lawyerFee: Math.round(stateFee * 0.5),
    })
  } catch (error) {
    console.error('Legal calculator error:', error)
    return NextResponse.json(
      { error: 'Hisoblashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
