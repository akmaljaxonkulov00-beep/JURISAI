import { NextRequest, NextResponse } from 'next/server'
import {
  calculateStateFee,
  calculatePenaltyAndDamages,
  calculateDeadlines,
} from '@/lib/calculators-engine'

/**
 * POST /api/professional-tools/legal-calculator
 * Backwards compatibility route backed by the verified Calculators Engine.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      case_type = 'civil',
      claim_amount = 0,
      contract_amount = 0,
      days_late = 0,
      start_date,
    } = body

    const courtType =
      case_type === 'criminal'
        ? 'administrative'
        : case_type === 'administrative'
          ? 'administrative'
          : 'civil'

    // 1. Davlat boji (Law O'RQ-600)
    const stateFeeRes = calculateStateFee({
      courtType: courtType as 'civil' | 'economic' | 'administrative',
      claimType: 'property',
      claimAmount: claim_amount || contract_amount,
    })

    // 2. Penya va zarar (Law 670-I)
    const penaltyRes = calculatePenaltyAndDamages({
      contractAmount: contract_amount,
      daysLate: days_late,
      includeInterest327: true,
    })

    // 3. Muddatlar
    const deadlineRes = start_date
      ? calculateDeadlines({
          startDate: start_date,
          disputeCategory: 'civil_general',
        })
      : null

    const total = stateFeeRes.totalFee + penaltyRes.totalClaim

    return NextResponse.json({
      state_fee: stateFeeRes.totalFee,
      damages: penaltyRes.penaltyAmount,
      interest: penaltyRes.interest327Amount || 0,
      total,
      breakdown: [
        ...stateFeeRes.breakdown.map(b => ({
          item: b.name,
          amount: b.calculatedAmount,
          description: b.rateDescription,
        })),
        {
          item: 'Shartnomaviy Penya (Qonun 670-I)',
          amount: penaltyRes.penaltyAmount,
          description: penaltyRes.calculationFormula,
        },
      ],
      legal_basis: [...stateFeeRes.legalBases, ...penaltyRes.legalBases],
      deadlines: deadlineRes
        ? [
            {
              event: 'Da‘vo muddati tugash sanasi',
              date: deadlineRes.deadlineDate,
              days: deadlineRes.daysRemaining,
            },
          ]
        : [],
      court_fee: stateFeeRes.totalFee,
      lawyerFee: Math.round(stateFeeRes.totalFee * 0.5),
    })
  } catch (error) {
    console.error('Legacy calculator error:', error)
    return NextResponse.json({ error: 'Hisoblashda xatolik yuz berdi' }, { status: 500 })
  }
}
