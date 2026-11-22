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
    const { scenario, action_logs = [], session_id } = body as {
      scenario: ScenarioData
      action_logs: UserActionLog[]
      session_id?: string
    }

    if (!scenario) {
      return NextResponse.json({ error: 'Senariy maʼlumotlari talab qilinadi' }, { status: 400 })
    }

    const evaluation = evaluateScenarioPerformance(scenario, action_logs)
    const supabase = getSupabaseAdmin()

    // 1. Save / Update session in Supabase database
    let activeSessionId = session_id || `session_${Date.now()}`

    try {
      const completedSessionData = {
        template_id: scenario.id,
        scenario_data: scenario,
        current_step: action_logs.length,
        total_steps: scenario.decision_points?.length || action_logs.length,
        user_actions: action_logs,
        score: evaluation.total_score,
        xp_awarded: evaluation.xp_awarded,
        evaluation,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }

      // Agar session_id bo'lsa — scenarios jadvalida update qilish
      let updated = false
      if (session_id) {
        const { error: updErr } = await supabase
          .from('scenarios')
          .update({
            title: scenario.title,
            scenario_type: scenario.legal_domain || 'civil',
            difficulty_level: scenario.difficulty || 'intermediate',
            description: (scenario.background || '').slice(0, 500),
            data: completedSessionData,
          })
          .eq('id', session_id)
          .eq('user_id', auth.user.id)

        if (!updErr) {
          updated = true
        }
      }

      // Agar update bo'lmagan bo'lsa (yoki yangi bo'lsa) — insert qilish
      if (!updated) {
        const { data: inserted, error: insErr } = await supabase
          .from('scenarios')
          .insert({
            user_id: auth.user.id,
            title: scenario.title,
            scenario_type: scenario.legal_domain || 'civil',
            difficulty_level: scenario.difficulty || 'intermediate',
            complexity: 'standard',
            description: (scenario.background || '').slice(0, 500),
            data: completedSessionData,
          })
          .select('id')
          .single()

        if (!insErr && inserted?.id) {
          activeSessionId = inserted.id
        }
      }

      // Shuningdek, scenario_sessions jadvali mavjud bo'lsa, unga ham urinish
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
      } catch {
        // scenario_sessions bo'lmasa scenarios ga yozilgani yetarli
      }
    } catch (dbErr) {
      console.warn('Scenario session save error:', dbErr)
    }

    // 2. Award XP with idempotency key
    const xpAmount = Math.max(10, evaluation.xp_awarded || 15)
    let xpResult = {
      xpEarned: xpAmount,
      totalXp: xpAmount,
      level: 1,
      unlockedAchievements: [],
    }

    try {
      const awarded = await awardUserXP({
        userId: auth.user.id,
        userEmail: auth.user.email,
        action: 'scenario',
        xp: xpAmount,
        title: `Senariy yakunlandi: ${scenario.title}`,
        description: `${scenario.legal_domain} sohasidagi yuridik senariy (${evaluation.total_score} ball)`,
        idempotencyKey: `scenario_eval_${activeSessionId}_${scenario.id}`,
        metadata: {
          scenario_id: scenario.id,
          session_id: activeSessionId,
          score: evaluation.total_score,
          domain: scenario.legal_domain,
        },
      })
      if (awarded) {
        xpResult = awarded as any
      }
    } catch (xpErr) {
      console.warn('Award XP error (ignored to not fail evaluation):', xpErr)
    }

    return NextResponse.json({
      success: true,
      evaluation,
      session_id: activeSessionId,
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
