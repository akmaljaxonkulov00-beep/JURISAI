import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { ScenarioData, ScenarioOption, UserActionLog } from '@/types/scenario-generator'

/**
 * POST /api/scenario-generator/step
 * Evaluates an interactive simulation action step and advances the stage state.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const {
      scenario,
      current_step = 1,
      chosen_option_id,
      custom_action_text,
    } = body as {
      scenario: ScenarioData
      current_step: number
      chosen_option_id: string
      custom_action_text?: string
    }

    if (!scenario || !chosen_option_id) {
      return NextResponse.json(
        { error: 'Senariy maʼlumotlari va tanlangan harakat talab qilinadi' },
        { status: 400 }
      )
    }

    const currentDecisionPoint = scenario.decision_points?.find(
      dp => dp.step_number === current_step
    )
    const chosenOption = currentDecisionPoint?.options?.find(opt => opt.id === chosen_option_id)

    const isOptimal = chosenOption?.is_optimal ?? true
    const xpEarned = chosenOption?.xp ?? 20
    const feedback = chosenOption?.feedback || 'Harakat qabul qilindi va tahlil bosqichiga o‘tildi.'
    const consequence =
      chosenOption?.consequence || 'Harakat amalga oshirildi va protsessual oqibat yuzaga keldi.'

    const actionLog: UserActionLog = {
      step_number: current_step,
      chosen_option_id,
      action_title: chosenOption?.label || custom_action_text || 'Amal',
      action_type: chosenOption?.action_type || 'custom_action',
      consequence,
      xp_earned: xpEarned,
      is_optimal: isOptimal,
      feedback,
      timestamp: new Date().toISOString(),
    }

    const nextStep = current_step + 1
    const isCompleted = nextStep > (scenario.decision_points?.length || 1)

    return NextResponse.json({
      success: true,
      action_log: actionLog,
      next_step: nextStep,
      is_completed: isCompleted,
    })
  } catch (error) {
    console.error('Scenario step evaluation error:', error)
    return NextResponse.json({ error: 'Bosqichni tahlil qilishda server xatosi' }, { status: 500 })
  }
}
