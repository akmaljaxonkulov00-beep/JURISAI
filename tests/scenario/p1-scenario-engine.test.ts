import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { VERIFIED_SCENARIO_TEMPLATES } from '@/lib/scenario-generator-engine'
import { sanitizeScenarioForClient, verifyScenarioStateToken } from '@/lib/scenario-sanitizer'

const mockRequireUser = vi.fn()
vi.mock('@/lib/server-auth', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}))

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
}))

describe('P1-4 Cross-Feature Scenario Engine — Answer-Key Stripping & Server Evaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SCENARIO_HMAC_SECRET = 'test-hmac-secret-2026'
  })

  it('strips is_optimal, xp, feedback, consequence and undiscovered evidence for client', () => {
    const base = VERIFIED_SCENARIO_TEMPLATES[0]
    const withHidden = {
      ...base,
      evidence: [
        ...base.evidence,
        {
          id: 'ev_hidden_1',
          title: 'Yashirin audio yozuv',
          type: 'digital' as const,
          description: '2-bosqichda ochiladigan dalil',
          reliability: 'high' as const,
          is_admissible: true,
          discovered: false,
        },
      ],
    }

    const sanitized = sanitizeScenarioForClient(withHidden)
    expect(sanitized.server_state_token).toBeTruthy()
    expect(sanitized.evidence.some(e => e.id === 'ev_hidden_1')).toBe(false)

    for (const dp of sanitized.decision_points) {
      for (const opt of dp.options) {
        expect(opt.is_optimal).toBeUndefined()
        expect(opt.xp).toBeUndefined()
        expect(opt.feedback).toBeUndefined()
        expect(opt.consequence).toBeUndefined()
      }
    }
  })

  it('rejects tampered server_state_token', () => {
    const sanitized = sanitizeScenarioForClient(VERIFIED_SCENARIO_TEMPLATES[0])
    expect(verifyScenarioStateToken(sanitized.server_state_token)).not.toBeNull()
    const tampered = sanitized.server_state_token!.slice(0, -4) + 'XXXX'
    expect(verifyScenarioStateToken(tampered)).toBeNull()
  })

  it('evaluates step strictly server-side and reveals hidden evidence + twist', async () => {
    mockRequireUser.mockResolvedValue({ ok: true, user: { id: 'student-1' } })
    const { POST } = await import('@/app/api/scenario-generator/step/route')

    const base = VERIFIED_SCENARIO_TEMPLATES[0]
    const sanitized = sanitizeScenarioForClient(base)
    const firstOptId = base.decision_points[0].options[0].id

    const req = new NextRequest('http://localhost/api/scenario-generator/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: sanitized,
        current_step: 1,
        chosen_option_id: firstOptId,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.action_log.is_optimal).toBe(base.decision_points[0].options[0].is_optimal)
    expect(data.action_log.xp_earned).toBe(base.decision_points[0].options[0].xp)
    expect(data.revealed_evidence.length).toBe(1)
    expect(data.revealed_evidence[0].discovered).toBe(true)
    expect(data.dynamic_twist).toBeTruthy()
  })

  it('GET /api/scenario-generator/templates returns sanitized templates without answer keys', async () => {
    const { GET } = await import('@/app/api/scenario-generator/templates/route')
    const req = new NextRequest('http://localhost/api/scenario-generator/templates')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.templates)).toBe(true)
    expect(data.templates.length).toBeGreaterThan(0)
    const firstOpt = data.templates[0].decision_points[0].options[0]
    expect(firstOpt.is_optimal).toBeUndefined()
    expect(firstOpt.xp).toBeUndefined()
  })
})
