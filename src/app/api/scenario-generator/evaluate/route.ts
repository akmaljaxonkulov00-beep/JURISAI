import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ScenarioData, UserActionLog } from '@/types/scenario-generator'
import { evaluateScenarioPerformance } from '@/lib/scenario-generator-engine'
import { awardUserXP } from '@/lib/xp-engine'

/**
 * POST /api/scenario-generator/evaluate
 * Generates final simulation score, awards gamified XP, and saves completed session.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const { scenario, action_logs = [] } = body as {
      scenario: ScenarioData
      action_logs: UserActionLog[]
    }

    if (!scenario) {
      return NextResponse.json({ error: 'Senariy maʼlumotlari talab qilinadi' }, { status: 400 })
    }

    const evaluation = evaluateScenarioPerformance(scenario, action_logs)
    const supabase = getSupabaseAdmin()

    // 1. Save session to Supabase database
    let sessionId = `session_${Date.now()}`
    try {
      const { data: savedSession } = await supabase
        .from('scenario_sessions')
        .insert({
          user_id: auth.user.id,
          template_id: scenario.id,
          scenario_data: scenario,
          current_step: action_logs.length,
          total_steps: scenario.decision_points?.length || action_logs.length,
          user_actions: action_logs,
          score: evaluation.total_score,
          xp_awarded: evaluation.xp_awarded,
          evaluation,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (savedSession?.id) {
        sessionId = savedSession.id
      }
    } catch (dbErr) {
      console.warn('Scenario session save error:', dbErr)
    }

    // 2. Award XP with idempotency key
    const xpAmount = Math.max(10, evaluation.xp_awarded || 15)
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'scenario',
      xp: xpAmount,
      title: `Senariy yakunlandi: ${scenario.title}`,
      description: `${scenario.legal_domain} sohasidagi yuridik senariy (${evaluation.total_score} ball)`,
      idempotencyKey: `scenario_eval_${sessionId}_${scenario.id}`,
      metadata: {
        scenario_id: scenario.id,
        session_id: sessionId,
        score: evaluation.total_score,
        domain: scenario.legal_domain,
      },
    })

    return NextResponse.json({
      success: true,
      evaluation,
      xpEarned: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
      unlockedAchievements: xpResult.unlockedAchievements,
    })
  } catch (error) {
    console.error('Scenario evaluation API error:', error)
    return NextResponse.json({ error: 'Senariyni baholashda xatolik yuz berdi' }, { status: 500 })
  }
}
