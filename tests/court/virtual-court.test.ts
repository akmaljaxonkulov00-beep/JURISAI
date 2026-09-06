import { describe, it, expect } from 'vitest'
import {
  TRIAL_STAGES,
  NEGOTIATION_STAGES,
  INVESTIGATION_STAGES,
  getStagesForProcedure,
  getStageById,
  getNextStage,
  validateProceduralAction,
  canTransitionToNextStage,
} from '@/lib/court/stage-machine'
import { SEED_SCENARIOS, listAllScenarios, getScenarioById } from '@/lib/court/scenario-db'
import { calculateSessionScore } from '@/lib/court/scoring-engine'
import type { CourtSessionState, UserActionPayload, SessionEvent } from '@/lib/court/court-types'

describe('Virtual Court — Stage Machine Tests', () => {
  it('Sud jarayoni (Trial) to‘g‘ri 8 ta bosqichdan iborat', () => {
    const stages = getStagesForProcedure('trial')
    expect(stages.length).toBe(8)
    expect(stages[0].id).toBe('open_hearing')
    expect(stages[1].id).toBe('rights_and_petitions')
    expect(stages[2].id).toBe('judicial_investigation')
    expect(stages[3].id).toBe('evidence_and_examination')
    expect(stages[4].id).toBe('judicial_pleadings')
    expect(stages[5].id).toBe('final_word')
    expect(stages[6].id).toBe('deliberation_and_verdict')
    expect(stages[7].id).toBe('verdict_review')
  })

  it('Muzokara (Negotiation) to‘g‘ri 5 ta bosqichdan iborat', () => {
    const stages = getStagesForProcedure('negotiation')
    expect(stages.length).toBe(5)
    expect(stages[0].id).toBe('opening_stances')
    expect(stages[4].id).toBe('closing_settlement')
  })

  it('Tergov (Investigation) to‘g‘ri 4 ta bosqichdan iborat', () => {
    const stages = getStagesForProcedure('investigation')
    expect(stages.length).toBe(4)
    expect(stages[0].id).toBe('incident_briefing')
    expect(stages[3].id).toBe('investigative_conclusion')
  })

  it('getNextStage ketma-ketlikni to‘g‘ri aniqlaydi', () => {
    const next = getNextStage('trial', 'open_hearing')
    expect(next?.id).toBe('rights_and_petitions')

    const last = getNextStage('trial', 'verdict_review')
    expect(last).toBeNull()
  })
})

describe('Virtual Court — Protsessual Harakatlar Validatsiyasi', () => {
  const stage = TRIAL_STAGES[0] // open_hearing

  it('Ruxsat etilgan rolda to‘g‘ri harakat o‘tadi', () => {
    const action: UserActionPayload = {
      type: 'speak',
      role: 'SUDYA',
      text: 'Sud majlisi ochiq deb e’lon qilinadi.',
    }
    const val = validateProceduralAction(stage, 'SUDYA', action, [])
    expect(val.valid).toBe(true)
    expect(val.penalty).toBe(0)
  })

  it('Ochilish bosqichida noo‘rin e’tiroz jarima bilan qaytariladi', () => {
    const action: UserActionPayload = {
      type: 'object',
      role: 'ADVOKAT',
      text: 'E’tiroz bildiraman!',
    }
    const val = validateProceduralAction(stage, 'ADVOKAT', action, [])
    expect(val.valid).toBe(false)
    expect(val.penalty).toBeGreaterThan(0)
    expect(val.reason).toContain('e\'tiroz bildirish protsessual qoidalarga to‘g‘ri kelmaydi')
  })

  it('Dalil ID ko‘rsatilmaganda xato beradi', () => {
    const evStage = TRIAL_STAGES[3] // evidence_and_examination
    const action: UserActionPayload = {
      type: 'present_evidence',
      role: 'PROKUROR',
      text: 'Dalil taqdim etaman',
    }
    const val = validateProceduralAction(evStage, 'PROKUROR', action, [])
    expect(val.valid).toBe(false)
    expect(val.penalty).toBe(10)
  })
})

describe('Virtual Court — Bosqichga O‘tish Shartlari (Transition Rules)', () => {
  it('Hech qanday harakat bajarilmagan bo‘lsa o‘tish bloklanadi', () => {
    const stage = TRIAL_STAGES[3]
    const events: SessionEvent[] = []
    const check = canTransitionToNextStage(stage, events, 'ADVOKAT')
    expect(check.canTransition).toBe(false)
    expect(check.missingRequirement).toBeTruthy()
  })

  it('Harakat bajarilgach o‘tishga ruxsat beriladi', () => {
    const stage = TRIAL_STAGES[3]
    const events: SessionEvent[] = [
      {
        id: '1',
        stageId: stage.id,
        eventType: 'evidence_presented',
        speaker: 'Advokat',
        role: 'ADVOKAT',
        content: 'Dalil',
        timestamp: new Date().toISOString(),
      },
    ]
    const check = canTransitionToNextStage(stage, events, 'ADVOKAT')
    expect(check.canTransition).toBe(true)
  })
})

describe('Virtual Court — Ssenariylar Bazasi & Rollar', () => {
  it('Barcha seed ssenariylar kerakli maydonlarga ega', () => {
    expect(SEED_SCENARIOS.length).toBeGreaterThanOrEqual(5)
    for (const sc of SEED_SCENARIOS) {
      expect(sc.id).toBeTruthy()
      expect(sc.title).toBeTruthy()
      expect(sc.facts).toBeTruthy()
      expect(sc.category).toBeTruthy()
      expect(sc.procedure_type).toBeTruthy()
      expect(sc.difficulty).toBeTruthy()
      expect(sc.legal_basis.length).toBeGreaterThan(0)
      expect(sc.participants.length).toBeGreaterThanOrEqual(3)
      expect(sc.evidence.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('Kategoriya bo‘yicha filtr ishlaydi', async () => {
    const criminal = await listAllScenarios({ category: 'criminal' })
    expect(criminal.length).toBeGreaterThan(0)
    expect(criminal.every(s => s.category === 'criminal')).toBe(true)

    const civil = await listAllScenarios({ category: 'civil' })
    expect(civil.length).toBeGreaterThan(0)
    expect(civil.every(s => s.category === 'civil')).toBe(true)
  })

  it('ID bo‘yicha aniq ssenariy olinadi', async () => {
    const sc = await getScenarioById('scen_theft_169')
    expect(sc).not.toBeNull()
    expect(sc?.title).toContain('o\'g\'rilik')
  })
})

describe('Virtual Court — Scoring Engine Tests', () => {
  const scenario = SEED_SCENARIOS[0]

  it('ADVOKAT uchun to‘liq baholash hisoblanadi', () => {
    const session: CourtSessionState = {
      scenario_id: scenario.id,
      selected_role: 'ADVOKAT',
      procedure_type: 'trial',
      current_stage: 'verdict_review',
      stage_order: 8,
      total_stages: 8,
      current_speaker: 'SUDYA',
      participant_state: scenario.participants,
      evidence_state: scenario.evidence,
      events: [
        {
          id: '1',
          stageId: 'open_hearing',
          eventType: 'user_action',
          speaker: 'Advokat',
          role: 'ADVOKAT',
          content: 'Hozirman',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          stageId: 'evidence_and_examination',
          eventType: 'evidence_presented',
          speaker: 'Advokat',
          role: 'ADVOKAT',
          content: 'Kvitansiya',
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          stageId: 'judicial_pleadings',
          eventType: 'user_action',
          speaker: 'Advokat',
          role: 'ADVOKAT',
          content: 'Himoya nutqi',
          timestamp: new Date().toISOString(),
        },
      ],
      scoring: {
        etiquette: 95,
        argument: 80,
        evidence: 85,
        proceduralCorrectness: 90,
        legalReasoning: 85,
        violationsCount: 0,
      },
      procedural_violations: [],
      completed: true,
    }

    const res = calculateSessionScore(session, scenario)
    expect(res.totalScore).toBeGreaterThanOrEqual(70)
    expect(res.totalScore).toBeLessThanOrEqual(100)
    expect(res.xpEarned).toBeGreaterThan(100)
    expect(res.achievements.length).toBeGreaterThan(0)
    expect(res.strengths.length).toBeGreaterThan(0)
    expect(res.feedbackSummary).toContain('Ajoyib natija')
  })

  it('SUDYA uchun xolislik (impartiality) hisoblanadi', () => {
    const session: CourtSessionState = {
      scenario_id: scenario.id,
      selected_role: 'SUDYA',
      procedure_type: 'trial',
      current_stage: 'verdict_review',
      stage_order: 8,
      total_stages: 8,
      current_speaker: 'SUDYA',
      participant_state: scenario.participants,
      evidence_state: scenario.evidence,
      events: [],
      scoring: {
        etiquette: 90,
        argument: 70,
        evidence: 75,
        proceduralCorrectness: 90,
        legalReasoning: 80,
        violationsCount: 0,
      },
      procedural_violations: [],
      completed: true,
    }

    const res = calculateSessionScore(session, scenario)
    expect(res.impartiality).toBeDefined()
    expect(res.impartiality).toBeGreaterThanOrEqual(80)
    expect(res.achievements).toContain('Xolis Hakam')
  })
})
