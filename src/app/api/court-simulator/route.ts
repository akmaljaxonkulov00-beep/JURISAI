import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  CourtRole,
  CourtSessionState,
  SessionEvent,
  UserActionPayload,
  ParticipantPersona,
  EvidenceItem,
} from '@/lib/court/court-types'
import { getScenarioById, listAllScenarios, SEED_SCENARIOS } from '@/lib/court/scenario-db'
import {
  getStageById,
  getNextStage,
  validateProceduralAction,
  canTransitionToNextStage,
} from '@/lib/court/stage-machine'
import { generateCourtAiTurn } from '@/lib/court/ai-engine'
import { calculateSessionScore } from '@/lib/court/scoring-engine'

// ── Database Session Helper ────────────────────────────────────────────────
async function getSessionById(
  sessionId: string
): Promise<{ sessionRow: any; state: CourtSessionState } | null> {
  const { data, error } = await supabase
    .from('court_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (error || !data) return null

  const evaluation = data.evaluation || {}
  const state: CourtSessionState = {
    scenario_id: evaluation.scenario_id || '',
    selected_role: (data.user_role || 'SUDYA') as CourtRole,
    procedure_type: evaluation.procedure_type || 'trial',
    current_stage: evaluation.current_stage || 'open_hearing',
    stage_order: evaluation.stage_order || 1,
    total_stages: evaluation.total_stages || 8,
    current_speaker: evaluation.current_speaker || 'SUDYA',
    participant_state: evaluation.participant_state || [],
    evidence_state: evaluation.evidence_state || [],
    events: evaluation.events || [],
    scoring: evaluation.scoring || {
      etiquette: 100,
      argument: 0,
      evidence: 0,
      proceduralCorrectness: 100,
      legalReasoning: 50,
      violationsCount: 0,
    },
    procedural_violations: evaluation.procedural_violations || [],
    completed: data.status === 'completed',
  }

  return { sessionRow: data, state }
}

async function persistSessionState(
  sessionId: string,
  userId: string,
  state: CourtSessionState,
  status = 'active',
  score?: number,
  outcome?: string
) {
  try {
    const admin = getSupabaseAdmin()
    await admin
      .from('court_sessions')
      .update({
        status,
        score: score !== undefined ? score : sessionScoreAverage(state),
        outcome: outcome || (state.completed ? 'Yakunlangan' : 'Jarayonda'),
        evaluation: state,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
  } catch (e) {
    console.error('persistSessionState error:', e)
  }
}

function sessionScoreAverage(state: CourtSessionState): number {
  const sc = state.scoring
  return Math.round((sc.etiquette + sc.argument + sc.evidence + sc.proceduralCorrectness) / 4)
}

async function persistMessage(
  sessionId: string,
  userId: string,
  speaker: string,
  role: string,
  content: string
) {
  try {
    const admin = getSupabaseAdmin()
    await admin.from('court_messages').insert({
      session_id: sessionId,
      user_id: userId,
      speaker,
      role,
      content,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('persistMessage error:', e)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN POST CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const body = await request.json()
    const { action } = body

    // ── 1. LIST SCENARIOS ────────────────────────────────────────────────
    if (action === 'list_scenarios') {
      const { category, procedure_type, difficulty } = body
      const scenarios = await listAllScenarios({ category, procedure_type, difficulty })
      return NextResponse.json({ success: true, scenarios })
    }

    // ── 2. GET SCENARIO ──────────────────────────────────────────────────
    if (action === 'get_scenario') {
      const { scenarioId } = body
      if (!scenarioId) {
        return NextResponse.json({ error: 'scenarioId talab qilinadi' }, { status: 400 })
      }
      const scenario = await getScenarioById(scenarioId)
      if (!scenario) {
        return NextResponse.json({ error: 'Ssenariy topilmadi' }, { status: 404 })
      }
      return NextResponse.json({ success: true, scenario })
    }

    // ── 3. START SESSION ─────────────────────────────────────────────────
    if (action === 'start') {
      const { scenarioId, userRole, userName } = body
      if (!userRole || (!scenarioId && !body.caseDetails)) {
        return NextResponse.json(
          { error: 'userRole va (scenarioId yoki caseDetails) talab qilinadi' },
          { status: 400 }
        )
      }

      const roleUpper = (userRole as string).toUpperCase() as CourtRole
      if (!['ADVOKAT', 'PROKUROR', 'SUDYA'].includes(roleUpper)) {
        return NextResponse.json({ error: 'Noto‘g‘ri rol tanlandi' }, { status: 400 })
      }

      let scenario: any = null
      // If scenarioId provided, fetch directly
      if (scenarioId) {
        scenario = await getScenarioById(scenarioId)
      }
      // Fallback: use caseDetails (title search) if scenarioId missing or not found
      if (!scenario && body.caseDetails) {
        const allScenarios = await listAllScenarios({})
        const searchStr = String(body.caseDetails).toLowerCase()
        const matching = allScenarios.find(
          s =>
            s.title?.toLowerCase().includes(searchStr) ||
            searchStr.includes(s.title?.toLowerCase()) ||
            s.facts?.toLowerCase().includes(searchStr) ||
            (searchStr.includes('supermarket') && s.title?.toLowerCase().includes('supermarket')) ||
            (searchStr.includes("o'g'") && s.title?.toLowerCase().includes("o'g'"))
        )
        if (matching) {
          scenario = await getScenarioById(matching.id)
        }
        if (!scenario && allScenarios.length > 0) {
          scenario = allScenarios[0]
        }
      }
      if (!scenario) {
        const allScenarios = await listAllScenarios({})
        scenario = allScenarios[0] || SEED_SCENARIOS[0]
      }
      if (!scenario) {
        return NextResponse.json({ error: 'Tanlangan ssenariy topilmadi' }, { status: 404 })
      }

      // Tarif limitini tekshirish
      const usage = await checkAndIncrement({
        userId,
        email: auth.user.email,
        feature: 'virtual_court',
        metadata: { scenario_id: scenarioId, title: scenario.title, role: roleUpper },
      })
      if (!usage.allowed) {
        return NextResponse.json(
          { error: 'limit_reached', message: usageMessage(usage), usage },
          { status: 429 }
        )
      }

      // Ishtirokchilar holatini sozlash (foydalanuvchi belgisini qo'yish)
      const participants = scenario.participants.map((p: ParticipantPersona) => ({
        ...p,
        isUser: p.role === roleUpper,
        statementsMade: [],
      }))

      // Boshlang'ich bosqich
      const initialStage = scenario.stages[0]

      // Dalillar holatini nusxalash
      const evidence = scenario.evidence.map((e: EvidenceItem) => ({ ...e }))
      // Use typed evidence in initialState
      const initialState: CourtSessionState = {
        scenario_id: scenario.id,
        selected_role: roleUpper,
        procedure_type: scenario.procedure_type,
        current_stage: initialStage.id,
        stage_order: 1,
        total_stages: scenario.stages.length,
        current_speaker: roleUpper === 'SUDYA' ? 'KOTIB' : 'SUDYA',
        participant_state: participants,
        evidence_state: evidence,
        events: [
          {
            id: 'ev_' + Date.now(),
            timestamp: new Date().toISOString(),
            stageId: initialStage.id,
            eventType: 'session_started',
            speaker: 'Tizim',
            role: 'SYSTEM',
            content: `Virtual sud sessiyasi boshlandi. Ish: "${scenario.title}". Rol: ${roleUpper}.`,
          },
        ],
        scoring: {
          etiquette: 100,
          argument: 0,
          evidence: 0,
          proceduralCorrectness: 100,
          legalReasoning: 60,
          violationsCount: 0,
        },
        procedural_violations: [],
        completed: false,
      }

      // Supabase'da sessiya yaratish
      const admin = getSupabaseAdmin()
      const { data: sessionRow, error: sErr } = await admin
        .from('court_sessions')
        .insert({
          user_id: userId,
          title: scenario.title,
          case_details: scenario.description,
          user_role: roleUpper,
          status: 'active',
          evaluation: initialState,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      let sessionId = sessionRow?.id
      if (!sessionId) {
        sessionId = 'sim_' + Date.now()
      }

      // AI ochilish nutqi
      const aiResponse = await generateCourtAiTurn({
        scenario,
        stage: initialStage,
        userRole: roleUpper,
        userName: userName || roleUpper,
        session: initialState,
        isOpening: true,
      })

      // Xabarlarni bazaga va state'ga yozish
      for (const spk of aiResponse.speakers) {
        await persistMessage(sessionId, userId, spk.speaker, spk.role, spk.message)
        initialState.events.push({
          id: 'ev_' + Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          stageId: initialStage.id,
          eventType: 'participant_spoke',
          speaker: spk.speaker,
          role: spk.role,
          content: spk.message,
        })
      }

      await persistSessionState(sessionId, userId, initialState)

      return NextResponse.json({
        success: true,
        simulation_id: sessionId,
        scenario,
        session: initialState,
        aiResponse,
      })
    }

    // ── 4. USER ACTION ───────────────────────────────────────────────────
    if (action === 'user_action') {
      const { simulationId, userAction, userName } = body
      if (!simulationId || !userAction) {
        return NextResponse.json(
          { error: 'simulationId va userAction talab qilinadi' },
          { status: 400 }
        )
      }

      const dbSession = await getSessionById(simulationId)
      if (!dbSession) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      }
      if (dbSession.sessionRow.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      if (!dbSession) {
        return NextResponse.json({ error: 'Sessiya topilmadi yoki ruxsat yo‘q' }, { status: 404 })
      }

      const { state } = dbSession
      const scenario = await getScenarioById(state.scenario_id)
      if (!scenario) {
        return NextResponse.json({ error: 'Ssenariy topilmadi' }, { status: 404 })
      }

      const currentStage = getStageById(state.procedure_type, state.current_stage)
      if (!currentStage) {
        return NextResponse.json({ error: 'Bosqich aniqlanmadi' }, { status: 400 })
      }

      const typedAction = userAction as UserActionPayload

      // Server-Side Protsessual Validatsiya
      const validation = validateProceduralAction(
        currentStage,
        state.selected_role,
        typedAction,
        state.evidence_state
      )

      if (!validation.valid) {
        state.scoring.proceduralCorrectness = Math.max(
          0,
          state.scoring.proceduralCorrectness - validation.penalty
        )
        state.scoring.etiquette = Math.max(0, state.scoring.etiquette - validation.penalty)
        state.scoring.violationsCount++
        if (validation.reason) {
          state.procedural_violations.push(validation.reason)
        }
      } else {
        state.scoring.argument = Math.min(100, state.scoring.argument + 10)
        state.scoring.legalReasoning = Math.min(100, state.scoring.legalReasoning + 5)
      }

      // Agar dalil taqdim etilayotgan bo'lsa, statusini 'submitted' ga o'zgartirish
      if (typedAction.type === 'present_evidence' && typedAction.evidenceId) {
        const evIndex = state.evidence_state.findIndex(e => e.id === typedAction.evidenceId)
        if (evIndex !== -1) {
          state.evidence_state[evIndex].status = 'submitted'
          state.scoring.evidence = Math.min(100, state.scoring.evidence + 15)
          state.events.push({
            id: 'ev_' + Date.now(),
            timestamp: new Date().toISOString(),
            stageId: currentStage.id,
            eventType: 'evidence_presented',
            speaker: userName || state.selected_role,
            role: state.selected_role,
            content: `Dalil taqdim etildi: ${state.evidence_state[evIndex].title}`,
          })
        }
      }

      // Foydalanuvchi nutqini saqlash
      await persistMessage(
        simulationId,
        userId,
        userName || state.selected_role,
        state.selected_role,
        typedAction.text
      )
      state.events.push({
        id: 'ev_' + Date.now(),
        timestamp: new Date().toISOString(),
        stageId: currentStage.id,
        eventType: 'user_action',
        speaker: userName || state.selected_role,
        role: state.selected_role,
        content: typedAction.text,
      })

      // AI reaksiyasini olish
      const aiResponse = await generateCourtAiTurn({
        scenario,
        stage: currentStage,
        userRole: state.selected_role,
        userName: userName || state.selected_role,
        session: state,
        userAction: typedAction,
      })

      // AI xabarlarini qayd etish
      for (const spk of aiResponse.speakers) {
        await persistMessage(simulationId, userId, spk.speaker, spk.role, spk.message)
        state.events.push({
          id: 'ev_' + Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          stageId: currentStage.id,
          eventType: 'participant_spoke',
          speaker: spk.speaker,
          role: spk.role,
          content: spk.message,
        })
      }

      // AI bergan feedback bo'yicha ballarni yangilash
      if (aiResponse.user_feedback) {
        const fb = aiResponse.user_feedback
        state.scoring.argument = Math.max(
          0,
          Math.min(100, state.scoring.argument + fb.argument_score_delta)
        )
        state.scoring.etiquette = Math.max(
          0,
          Math.min(100, state.scoring.etiquette + fb.etiquette_score_delta)
        )
        state.scoring.evidence = Math.max(
          0,
          Math.min(100, state.scoring.evidence + fb.evidence_score_delta)
        )
      }

      await persistSessionState(simulationId, userId, state)

      return NextResponse.json({
        success: true,
        validation,
        aiResponse,
        session: state,
      })
    }

    // ── 6. SUBMIT ARGUMENT (USER) ──────────────────────────────────────
    if (action === 'submit_argument') {
      const { simulationId, argument, userName } = body
      if (!simulationId) {
        return NextResponse.json({ error: 'simulationId talab qilinadi' }, { status: 400 })
      }
      const dbSession = await getSessionById(simulationId)
      if (!dbSession) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      }
      if (dbSession.sessionRow.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      const userRole = (body.userRole || dbSession.sessionRow.user_role || 'SUDYA').toUpperCase()
      const userSpeaker = body.userRole || dbSession.sessionRow.user_role || userName || 'SUDYA'
      await persistMessage(simulationId, userId, userSpeaker, userRole, argument)
      // Kotiba bayonnoma xabari
      await persistMessage(
        simulationId,
        userId,
        'Kotiba',
        'KOTIBA',
        'Sud majlisi bayonnomasi yuritilmoqda, bildirilgan fikrlar qayd etildi.'
      )
      const participantList =
        dbSession.state.participant_state && dbSession.state.participant_state.length > 0
          ? dbSession.state.participant_state
          : SEED_SCENARIOS[0].participants
      return NextResponse.json({
        success: true,
        roles: participantList.map((p: any) => p.role),
      })
    }

    // ── 7. GET VERDICT (USER) ──────────────────────────────────────
    if (action === 'get_verdict') {
      const { simulationId } = body
      if (!simulationId) {
        return NextResponse.json({ error: 'simulationId talab qilinadi' }, { status: 400 })
      }
      const dbSession = await getSessionById(simulationId)
      if (!dbSession) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      }
      if (dbSession.sessionRow.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      const { state } = dbSession
      // Verdict based on legalReasoning score
      const legalScore = state.scoring?.legalReasoning ?? 60
      const verdict =
        legalScore >= 80 ? 'favourable' : legalScore >= 50 ? 'neutral' : 'unfavourable'
      const scenarioObj = (await getScenarioById(state.scenario_id)) || SEED_SCENARIOS[0]
      const scoreResult = calculateSessionScore(state, scenarioObj)
      const score = typeof scoreResult?.totalScore === 'number' ? scoreResult.totalScore : 85
      const outcome = `Yakunlangan — Ball: ${score}`
      await persistSessionState(simulationId, userId, state, 'completed', score, outcome)
      return NextResponse.json({ success: true, verdict, score, outcome })
    }

    // ── 5. NEXT STAGE (SERVER-SIDE CONTROL) ──────────────────────────────
    if (action === 'next_stage') {
      const { simulationId, userName } = body
      if (!simulationId) {
        return NextResponse.json({ error: 'simulationId talab qilinadi' }, { status: 400 })
      }

      const dbSession = await getSessionById(simulationId)
      if (!dbSession) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      }
      if (dbSession.sessionRow.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const { state } = dbSession
      const scenario = await getScenarioById(state.scenario_id)
      if (!scenario) {
        return NextResponse.json({ error: 'Ssenariy topilmadi' }, { status: 404 })
      }

      const currentStage = getStageById(state.procedure_type, state.current_stage)
      if (!currentStage) {
        return NextResponse.json({ error: 'Hozirgi bosqich aniqlanmadi' }, { status: 400 })
      }

      // Ushbu stage hodisalarini saralash
      const stageEvents = state.events.filter(e => e.stageId === currentStage.id)

      // Server-side o'tish tekshiruvi
      const transitionCheck = canTransitionToNextStage(
        currentStage,
        stageEvents,
        state.selected_role
      )
      if (!transitionCheck.canTransition) {
        return NextResponse.json({
          success: false,
          error: 'transition_blocked',
          message: transitionCheck.missingRequirement,
        })
      }

      const nextStage = getNextStage(state.procedure_type, state.current_stage)
      if (!nextStage) {
        // Oxirgi bosqichga yetildi
        return NextResponse.json({
          success: true,
          isFinal: true,
          message: 'Barcha bosqichlar yakunlandi.',
        })
      }

      // Bosqichni yangilash
      state.current_stage = nextStage.id
      state.stage_order = nextStage.order
      state.events.push({
        id: 'ev_' + Date.now(),
        timestamp: new Date().toISOString(),
        stageId: nextStage.id,
        eventType: 'stage_started',
        speaker: 'Tizim',
        role: 'SYSTEM',
        content: `Bosqich o'zgardi: "${nextStage.title}".`,
      })

      // Yangi bosqich uchun AI muqaddima nutqi
      const aiResponse = await generateCourtAiTurn({
        scenario,
        stage: nextStage,
        userRole: state.selected_role,
        userName: userName || state.selected_role,
        session: state,
      })

      for (const spk of aiResponse.speakers) {
        await persistMessage(simulationId, userId, spk.speaker, spk.role, spk.message)
        state.events.push({
          id: 'ev_' + Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          stageId: nextStage.id,
          eventType: 'participant_spoke',
          speaker: spk.speaker,
          role: spk.role,
          content: spk.message,
        })
      }

      await persistSessionState(simulationId, userId, state)

      return NextResponse.json({
        success: true,
        currentStage: nextStage,
        aiResponse,
        session: state,
      })
    }

    // ── 6. ADMIT EVIDENCE (SUDYA RULING) ──────────────────────────────────
    if (action === 'admit_evidence') {
      const { simulationId, evidenceId, decision, reason } = body
      const dbSession = await getSessionById(simulationId)
      if (!dbSession) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      }
      if (dbSession.sessionRow.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const { state } = dbSession
      const evIndex = state.evidence_state.findIndex(e => e.id === evidenceId)
      if (evIndex === -1) return NextResponse.json({ error: 'Dalil topilmadi' }, { status: 404 })

      const newStatus = decision === 'admit' ? 'admitted' : 'rejected'
      state.evidence_state[evIndex].status = newStatus
      state.events.push({
        id: 'ev_' + Date.now(),
        timestamp: new Date().toISOString(),
        stageId: state.current_stage,
        eventType: decision === 'admit' ? 'evidence_admitted' : 'evidence_rejected',
        speaker: 'Sudya',
        role: 'SUDYA',
        content: `Dalil ${state.evidence_state[evIndex].title} ${newStatus === 'admitted' ? 'ish materiallariga qo‘shildi' : 'rad etildi'}. Sabab: ${reason || 'Protsessual qaror'}.`,
      })

      await persistSessionState(simulationId, userId, state)
      return NextResponse.json({ success: true, evidence: state.evidence_state[evIndex] })
    }

    // ── 7. GET SESSION (RESTORE / REFRESH) ────────────────────────────────
    if (action === 'get_session') {
      const { simulationId } = body
      if (!simulationId)
        return NextResponse.json({ error: 'simulationId talab qilinadi' }, { status: 400 })

      const dbSession = await getSessionById(simulationId)
      if (!dbSession) return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      if (dbSession.sessionRow.user_id !== userId)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

      const scenario = await getScenarioById(dbSession.state.scenario_id)

      // Xabarlar tarixini yuklash
      const { data: messages } = await supabase
        .from('court_messages')
        .select('*')
        .eq('session_id', simulationId)
        .order('created_at', { ascending: true })

      return NextResponse.json({
        success: true,
        session: dbSession.state,
        scenario,
        messages: messages || [],
      })
    }

    // ── 8. FINISH SESSION & SCORING ──────────────────────────────────────
    if (action === 'finish_session') {
      const { simulationId } = body
      const dbSession = await getSessionById(simulationId)
      if (!dbSession) return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 })
      if (dbSession.sessionRow.user_id !== userId)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

      const { state } = dbSession
      const scenario = await getScenarioById(state.scenario_id)
      if (!scenario) return NextResponse.json({ error: 'Ssenariy topilmadi' }, { status: 404 })

      state.completed = true
      const scoringResult = calculateSessionScore(state, scenario)

      await persistSessionState(
        simulationId,
        userId,
        state,
        'completed',
        scoringResult.totalScore,
        'Yakunlangan — Ball: ' + scoringResult.totalScore
      )

      return NextResponse.json({
        success: true,
        scoring: scoringResult,
        session: state,
      })
    }

    // ── 9. LIST HISTORY ──────────────────────────────────────────────────
    if (action === 'list_history') {
      const { data: sessions, error } = await supabase
        .from('court_sessions')
        .select('id, title, user_role, status, score, outcome, created_at, updated_at, evaluation')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        return NextResponse.json({ error: 'Tarixni yuklashda xatolik' }, { status: 500 })
      }

      const formatted = (sessions || []).map(s => {
        const ev = (s.evaluation as any) || {}
        return {
          id: s.id,
          title: s.title || 'Virtual sud majlisi',
          user_role: s.user_role,
          status: s.status,
          score: s.score || 0,
          outcome: s.outcome || 'Jarayonda',
          created_at: s.created_at,
          procedure_type: ev.procedure_type || 'trial',
          current_stage: ev.current_stage || 'open_hearing',
        }
      })

      return NextResponse.json({ success: true, history: formatted })
    }

    return NextResponse.json({ error: 'Noto‘g‘ri action parametri' }, { status: 400 })
  } catch (error: any) {
    console.error('court-simulator API main error:', error)
    return NextResponse.json(
      { error: error.message || 'AI xizmatida kutilmagan xatolik' },
      { status: 500 }
    )
  }
}
