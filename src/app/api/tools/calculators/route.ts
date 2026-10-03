import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { awardUserXP } from '@/lib/xp-engine'
import {
  calculateStateFee,
  calculatePenaltyAndDamages,
  calculateInterest327,
  calculateBhm,
  calculateDeadlines,
} from '@/lib/calculators-engine'
import {
  StateFeeInput,
  PenaltyInput,
  Interest327Input,
  BhmInput,
  DeadlineInput,
} from '@/types/professional-tools'

/**
 * POST /api/tools/calculators
 * 100% rasmiy qonunchilikka asoslangan yuridik kalkulyatorlar API (2026).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const calculatorType = String(body.type || 'state_fee')

    let result: Record<string, unknown>
    let title = 'Yuridik Hisob-kitob'

    switch (calculatorType) {
      case 'state_fee': {
        const input: StateFeeInput = body.input || {}
        result = calculateStateFee(input) as unknown as Record<string, unknown>
        title = `Davlat boji: ${(result.totalFee as number)?.toLocaleString()} so‘m`
        break
      }
      case 'penalty': {
        const input: PenaltyInput = body.input || { contractAmount: 0, daysLate: 0 }
        result = calculatePenaltyAndDamages(input) as unknown as Record<string, unknown>
        title = `Penya va zarar: ${(result.totalClaim as number)?.toLocaleString()} so‘m`
        break
      }
      case 'interest327': {
        const input: Interest327Input = body.input || { debtAmount: 0, daysCount: 0 }
        result = calculateInterest327(input) as unknown as Record<string, unknown>
        title = `FK 327-modda foizlari: ${(result.interestAmount as number)?.toLocaleString()} so‘m`
        break
      }
      case 'bhm': {
        const input: BhmInput = body.input || { multiplier: 1 }
        result = calculateBhm(input) as unknown as Record<string, unknown>
        title = `BHM (${input.multiplier}x): ${(result.totalAmount as number)?.toLocaleString()} so‘m`
        break
      }
      case 'deadline': {
        const input: DeadlineInput = body.input || {
          startDate: new Date().toISOString().split('T')[0],
          disputeCategory: 'civil_general',
        }
        result = calculateDeadlines(input) as unknown as Record<string, unknown>
        title = `Muddat: ${result.deadlineDate} (${result.durationText})`
        break
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Nomaʼlum kalkulyator turi' },
          { status: 400 }
        )
    }

    const supabase = getSupabaseAdmin()

    // Save to user tool history
    let historyId = `calc_${Date.now()}`
    try {
      const { data: savedRow } = await supabase
        .from('tool_history')
        .insert({
          user_id: auth.user.id,
          tool_type: 'calculator',
          title,
          summary: (result.calculationFormula as string) || (result.durationText as string) || '',
          input_data: body.input || {},
          result_data: result,
          legal_references: (result.legalBases as string[]) || [],
          status: 'completed',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (savedRow?.id) historyId = savedRow.id
    } catch (saveErr) {
      console.warn('Failed to save calculation history:', saveErr)
    }

    // Award XP (+5 XP)
    const idempotencyKey = `calc_${auth.user.id}_${calculatorType}_${Date.now()}`
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'calculator',
      xp: 5,
      title,
      description: (result.calculationFormula as string) || 'Yuridik hisob-kitob bajarildi',
      idempotencyKey,
      metadata: {
        tool_type: 'calculator',
        calculator_type: calculatorType,
        history_id: historyId,
      },
    })

    return NextResponse.json({
      success: true,
      type: calculatorType,
      result,
      xpEarned: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
    })
  } catch (error) {
    console.error('Calculator API error:', error)
    return NextResponse.json(
      { success: false, error: 'Hisoblash jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
