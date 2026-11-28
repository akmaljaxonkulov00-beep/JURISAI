import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { VERIFIED_SCENARIO_TEMPLATES } from '@/lib/scenario-generator-engine'
import { verifyScenarioStateToken } from '@/lib/scenario-sanitizer'
import {
  ScenarioData,
  ScenarioDecisionPoint,
  ScenarioEvidenceItem,
  UserActionLog,
} from '@/types/scenario-generator'

/**
 * POST /api/scenario-generator/step
 * Evaluates an interactive simulation action step strictly server-side
 * using either the verified template registry or HMAC-signed server_state_token,
 * and reveals dynamic evidence / twists for subsequent steps.
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

    // Resolve authoritative decision points & hidden evidence strictly on the server
    const verifiedPayload = verifyScenarioStateToken(scenario.server_state_token)
    const templateMatch = VERIFIED_SCENARIO_TEMPLATES.find(t => t.id === scenario.id)

    let authoritativeDecisionPoints: ScenarioDecisionPoint[] = []
    let hiddenEvidencePool: ScenarioEvidenceItem[] = []

    if (verifiedPayload && verifiedPayload.id === scenario.id) {
      authoritativeDecisionPoints = verifiedPayload.decision_points
      hiddenEvidencePool = verifiedPayload.hidden_evidence
    } else if (templateMatch) {
      authoritativeDecisionPoints = templateMatch.decision_points
      hiddenEvidencePool = (templateMatch.evidence || []).filter(e => e.discovered === false)
    } else {
      // Fallback only if neither token nor template matches (legacy saved sessions without token)
      authoritativeDecisionPoints = scenario.decision_points || []
    }

    const currentDecisionPoint = authoritativeDecisionPoints.find(
      dp => dp.step_number === current_step
    )
    const chosenOption = currentDecisionPoint?.options?.find(opt => opt.id === chosen_option_id)

    const isOptimal = chosenOption?.is_optimal ?? (chosen_option_id === 'custom' ? true : false)
    const xpEarned = chosenOption?.xp ?? (chosen_option_id === 'custom' ? 15 : 5)
    const feedback =
      chosenOption?.feedback || 'Harakat qabul qilindi va tahlil bosqichiga o‘tildi.'
    const consequence =
      chosenOption?.consequence ||
      'Harakat amalga oshirildi va protsessual oqibat yuzaga keldi.'

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
    const totalSteps = authoritativeDecisionPoints.length || 1
    const isCompleted = nextStep > totalSteps

    // Dynamic progression: reveal undiscovered evidence or introduce a procedural twist
    let revealedEvidence: ScenarioEvidenceItem[] = []
    let dynamicTwist: string | null = null

    if (!isCompleted) {
      if (hiddenEvidencePool.length > 0) {
        const nextEv = hiddenEvidencePool[current_step - 1]
        if (nextEv) {
          revealedEvidence = [{ ...nextEv, discovered: true }]
        }
      }
      if (!isOptimal) {
        dynamicTwist =
          'Qarshi tomon sizning oldingi harakatingizdagi protsessual bo‘shliqdan foydalanib, qo‘shimcha e’tiroz kiritdi.'
      } else if (revealedEvidence.length > 0) {
        dynamicTwist = `Yangi dalil aniqlandi: "${revealedEvidence[0].title}". Endi uni keyingi bosqichda hisobga oling.`
      }
    }

    return NextResponse.json({
      success: true,
      action_log: actionLog,
      next_step: nextStep,
      is_completed: isCompleted,
      revealed_evidence: revealedEvidence,
      dynamic_twist: dynamicTwist,
    })
  } catch (error) {
    console.error('Scenario step evaluation error:', error)
    return NextResponse.json({ error: 'Bosqichni tahlil qilishda server xatosi' }, { status: 500 })
  }
}
