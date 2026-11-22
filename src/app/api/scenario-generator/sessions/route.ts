import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ScenarioSession, ScenarioData, UserActionLog } from '@/types/scenario-generator'

/**
 * GET /api/scenario-generator/sessions
 * Returns user's saved/active/completed scenario simulation sessions.
 * Supports both scenario_sessions table and scenarios table fallback.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
    const status = searchParams.get('status')

    const admin = getSupabaseAdmin()

    // 1. Birinchi bo'lib scenario_sessions jadvalidan qidirib ko'rish
    try {
      let query = admin
        .from('scenario_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, count, error } = await query

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          sessions: data,
          total: count || data.length,
          limit,
          offset,
        })
      }
    } catch {
      // scenario_sessions jadvali mavjud emas — scenarios jadvaliga o'tish
    }

    // 2. Fallback: Mavjud scenarios jadvalidan foydalanuvchining sessiyalarini olish
    let scenQuery = admin
      .from('scenarios')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: scenData, count: scenCount, error: scenError } = await scenQuery

    if (scenError) {
      console.warn('Scenarios sessions fetch error:', scenError.message)
      return NextResponse.json({
        success: true,
        sessions: [],
        total: 0,
        limit,
        offset,
      })
    }

    // scenarios jadvali ma'lumotlarini ScenarioSession formatiga normallashtirish
    const normalizedSessions: ScenarioSession[] = (scenData || [])
      .map((row: any) => {
        const data = row.data && typeof row.data === 'object' ? row.data : {}
        const scenDataObj: ScenarioData = data.scenario_data || {
          id: row.id,
          title: row.title || 'Yuridik Simulyatsiya',
          legal_domain: (row.scenario_type || 'civil') as any,
          difficulty: (row.difficulty_level || 'intermediate') as any,
          objective: data.objective || 'court_practice',
          user_role: data.user_role || 'advokat',
          background: row.description || data.background || '',
          facts: data.facts || [],
          participants: data.participants || [],
          evidence: data.evidence || [],
          timeline: data.timeline || [],
          legal_issues: data.legal_issues || [],
          decision_points: data.decision_points || [],
          learning_outcomes: data.learning_outcomes || [],
          sources: data.sources || [],
          validation: data.validation || { is_valid: true, checked_articles: [], legal_consistency_score: 100 },
        }

        const currentStep = data.current_step || (data.user_actions?.length ? data.user_actions.length + 1 : 1)
        const totalSteps = data.total_steps || scenDataObj.decision_points?.length || 3
        const sessStatus = data.status || (data.evaluation ? 'completed' : 'active')

        // Agar status filter berilgan bo'lsa va mos kelmasa
        if (status && status !== 'all' && sessStatus !== status) {
          return null
        }

        return {
          id: row.id,
          user_id: row.user_id,
          template_id: data.template_id || scenDataObj.id,
          scenario_data: scenDataObj,
          current_step: currentStep,
          total_steps: totalSteps,
          user_actions: (data.user_actions || []) as UserActionLog[],
          discovered_evidence: data.discovered_evidence || [],
          score: data.score != null ? data.score : data.evaluation?.total_score,
          xp_awarded: data.xp_awarded != null ? data.xp_awarded : data.evaluation?.xp_awarded,
          evaluation: data.evaluation || null,
          status: sessStatus,
          created_at: row.created_at,
          updated_at: data.updated_at || row.created_at,
        }
      })
      .filter(Boolean) as ScenarioSession[]

    return NextResponse.json({
      success: true,
      sessions: normalizedSessions,
      total: scenCount || normalizedSessions.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Scenario sessions GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Sessiyalarni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/scenario-generator/sessions
 * Starts a new interactive scenario simulation session and persists it.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const { scenario } = body as { scenario: ScenarioData }

    if (!scenario || !scenario.title) {
      return NextResponse.json({ error: 'Senariy maʼlumotlari talab qilinadi' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // 1. scenarios jadvaliga yangi faol sessiya yaratish
    const sessionData = {
      template_id: scenario.id,
      scenario_data: scenario,
      current_step: 1,
      total_steps: scenario.decision_points?.length || 2,
      user_actions: [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error: insErr } = await admin
      .from('scenarios')
      .insert({
        user_id: auth.user.id,
        title: scenario.title,
        scenario_type: scenario.legal_domain || 'civil',
        difficulty_level: scenario.difficulty || 'intermediate',
        complexity: 'standard',
        description: (scenario.background || '').slice(0, 500),
        data: sessionData,
      })
      .select('id, created_at')
      .single()

    if (insErr) {
      console.error('Session create error in scenarios table:', insErr.message)
      return NextResponse.json({ error: 'Sessiyani boshlashda xatolik yuz berdi' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session_id: inserted.id,
      created_at: inserted.created_at,
    })
  } catch (error) {
    console.error('Scenario sessions POST error:', error)
    return NextResponse.json({ error: 'Sessiya yaratishda xatolik' }, { status: 500 })
  }
}

/**
 * PATCH /api/scenario-generator/sessions
 * Updates in-progress session state (after each decision step).
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const { session_id, current_step, user_actions, status = 'active' } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id talab qilinadi' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Mavjud sessiyani olish
    const { data: existing } = await admin
      .from('scenarios')
      .select('id, data')
      .eq('id', session_id)
      .eq('user_id', auth.user.id)
      .maybeSingle()

    if (existing) {
      const prevData = existing.data && typeof existing.data === 'object' ? existing.data : {}
      const updatedData = {
        ...prevData,
        current_step: current_step !== undefined ? current_step : prevData.current_step,
        user_actions: user_actions !== undefined ? user_actions : prevData.user_actions,
        status,
        updated_at: new Date().toISOString(),
      }

      await admin
        .from('scenarios')
        .update({
          data: updatedData,
        })
        .eq('id', session_id)
        .eq('user_id', auth.user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Scenario sessions PATCH error:', error)
    return NextResponse.json({ error: 'Sessiyani yangilashda xatolik' }, { status: 500 })
  }
}

/**
 * DELETE /api/scenario-generator/sessions
 * Deletes a session from history.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Ikkala jadvaldan ham o'chirishga urinish
    await admin.from('scenarios').delete().eq('id', id).eq('user_id', auth.user.id)
    try {
      await admin.from('scenario_sessions').delete().eq('id', id).eq('user_id', auth.user.id)
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Scenario sessions DELETE error:', error)
    return NextResponse.json({ error: 'O‘chirishda xatolik yuz berdi' }, { status: 500 })
  }
}
