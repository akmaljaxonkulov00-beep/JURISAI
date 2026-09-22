import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'
import { ScenarioData, UserActionLog } from '@/types/scenario-generator'
import { evaluateScenarioPerformance } from '@/lib/scenario-generator-engine'

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

    // Save session to Supabase database
    try {
      await supabase.from('scenario_sessions').insert({
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
    } catch (dbErr) {
      console.warn('Scenario session save error:', dbErr)
    }

    return NextResponse.json({
      success: true,
      evaluation,
    })
  } catch (error) {
    console.error('Scenario evaluation API error:', error)
    return NextResponse.json({ error: 'Senariyni baholashda xatolik yuz berdi' }, { status: 500 })
  }
}
