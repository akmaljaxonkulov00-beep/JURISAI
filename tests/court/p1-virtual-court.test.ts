import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getRolesForCategory } from '@/lib/court/court-types'
import { TRIAL_STAGES, validateProceduralAction } from '@/lib/court/stage-machine'

const mockRequireUser = vi.fn()
vi.mock('@/lib/server-auth', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}))

describe('P1-5 Role-Adaptive Virtual Court', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns criminal procedure roles (ADVOKAT, PROKUROR, SUDYA)', () => {
    const roles = getRolesForCategory('criminal').map(r => r.id)
    expect(roles).toEqual(['ADVOKAT', 'PROKUROR', 'SUDYA'])
  })

  it('returns civil/economic/labor procedure roles (DAVOGAR, JAVOBGAR, VAKIL, SUDYA)', () => {
    for (const cat of ['civil', 'economic', 'labor', 'family'] as const) {
      const roles = getRolesForCategory(cat).map(r => r.id)
      expect(roles).toEqual(['DAVOGAR', 'JAVOBGAR', 'VAKIL', 'SUDYA'])
    }
  })

  it('returns administrative procedure roles (ARIZACHI, JAVOBGAR_ORGAN, SUDYA)', () => {
    const roles = getRolesForCategory('administrative').map(r => r.id)
    expect(roles).toEqual(['ARIZACHI', 'JAVOBGAR_ORGAN', 'SUDYA'])
  })

  it('validates procedural actions for adaptive roles like DAVOGAR and ARIZACHI without penalty', () => {
    const stage = TRIAL_STAGES[0]
    const res1 = validateProceduralAction(
      stage,
      'DAVOGAR',
      { type: 'speak', role: 'DAVOGAR', text: 'Da’vo talabini tasdiqlayman.' },
      []
    )
    expect(res1.valid).toBe(true)

    const res2 = validateProceduralAction(
      stage,
      'ARIZACHI',
      { type: 'speak', role: 'ARIZACHI', text: 'Ma’muriy shikoyatimni quvvatlayman.' },
      []
    )
    expect(res2.valid).toBe(true)
  })

  it('rejects invalid roles in POST /api/court-simulator start', async () => {
    mockRequireUser.mockResolvedValue({ ok: true, user: { id: 'user-1', email: 'u@example.com' } })
    const { POST } = await import('@/app/api/court-simulator/route')

    const req = new NextRequest('http://localhost/api/court-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        scenarioId: 'scen_theft_169',
        userRole: 'INVALID_ROLE',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
