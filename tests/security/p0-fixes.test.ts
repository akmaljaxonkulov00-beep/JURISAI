// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { validateCitations, appendCitationNote } from '@/lib/legal-rag'
import { middleware } from '@/middleware'
import { getPaymentRequests } from '@/lib/settings-sync'

describe('P0 Critical Fixes Verification', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalAllowDemo = process.env.ALLOW_DEMO_AUTH

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    process.env.ALLOW_DEMO_AUTH = originalAllowDemo
  })

  it('P0-1: Production demo-token requests MUST be rejected with 401', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.ALLOW_DEMO_AUTH
    const { requireUser } = await import('@/lib/server-auth')

    const req = new NextRequest('http://localhost:3000/api/irac/history', {
      headers: { Authorization: 'Bearer demo-token-law-student' },
    })
    const res = await requireUser(req)
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.response.status).toBe(401)
    }
  })

  it('P0-3: Invalid legal citations are detected while valid citations remain intact', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const validAndInvalid = await validateCitations(
      'JK 169-modda va FK 732-modda amalda, ammo JK 9999-modda mavjud emas.'
    )

    const validArticles = validAndInvalid.valid.map(v => `${v.code}:${v.article}`)
    expect(validArticles).toContain('criminal_code:169')
    expect(validArticles).toContain('civil_code:732')
    expect(validAndInvalid.invalid.some(i => i.article === 9999)).toBe(true)

    const annotated = appendCitationNote('JK 169-modda va JK 9999-modda.', validAndInvalid)
    expect(annotated).toContain('9999-modda')
    expect(annotated).toContain('qonunlar bazasida mavjud emas')
  })

  it('P0-6: Scenario Generator is protected by auth middleware consistently with other 4 modules', () => {
    const req = new NextRequest('http://localhost:3000/scenario-generator')
    const res = middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/signin?redirectTo=%2Fscenario-generator')
  })

  it('P0-6: Unauthenticated public pages do NOT trigger /api/payments polling', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const payments = await getPaymentRequests()
    expect(payments).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('P0-4: save-analysis preserves AI-generated feedback, strengths, weaknesses, and sectionScores', async () => {
    const insertedRows: any[] = []
    vi.doMock('@/lib/server-auth', () => ({
      requireUser: vi.fn(async () => ({ ok: true, user: { id: 'user-p0-4', email: 'student@juristiv.uz' } })),
    }))
    vi.doMock('@/lib/xp-engine', () => ({
      awardUserXP: vi.fn(async () => ({
        xpEarned: 20,
        totalXp: 120,
        level: 1,
        unlockedAchievements: [],
      })),
    }))
    vi.doMock('@/lib/supabase-admin', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          insert: (row: any) => {
            insertedRows.push(row)
            return {
              select: () => ({
                single: async () => ({ data: { id: 'analysis-123' }, error: null }),
              }),
            }
          },
        }),
      })),
    }))

    vi.resetModules()
    const { POST: saveAnalysis } = await import('@/app/api/case-solver/save-analysis/route')
    const req = new NextRequest('http://localhost:3000/api/case-solver/save-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_title: 'Qarz shartnomasi',
        case_category: 'fuqarolik',
        case_difficulty: 'medium',
        irac_analysis: { issue: 'I', rule: 'R', application: 'A', conclusion: 'C' },
        total_score: 88,
        feedback: 'AI tomonidan aniq yuridik tahlil berildi.',
        strengths: ['FK 732-modda to‘g‘ri keltirilgan'],
        weaknesses: ['Da’vo muddati tahlili qisqa'],
        suggestions: ['FK 150-moddani ham qo‘shing'],
        section_scores: { issue: 18, rule: 22, application: 26, conclusion: 22 },
      }),
    })

    const res = await saveAnalysis(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.feedback).toBe('AI tomonidan aniq yuridik tahlil berildi.')
    expect(data.strengths).toEqual(['FK 732-modda to‘g‘ri keltirilgan'])
    expect(insertedRows[0].feedback).toBe('AI tomonidan aniq yuridik tahlil berildi.')
    expect(insertedRows[0].irac_analysis.section_scores).toEqual({
      issue: 18,
      rule: 22,
      application: 26,
      conclusion: 22,
    })
  })

  it('P0-5: official-documents/[id]/fill authenticates user and persists to user_filled_documents', async () => {
    const insertedDocs: any[] = []
    vi.doMock('@/lib/server-auth', () => ({
      requireUser: vi.fn(async () => ({ ok: true, user: { id: 'user-p0-5', email: 'student@juristiv.uz' } })),
    }))
    vi.doMock('@/lib/supabase-admin', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: (table: string) => {
          if (table === 'official_legal_documents') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: 'uuid-doc-1' }, error: null }),
                }),
              }),
            }
          }
          return {
            insert: (row: any) => {
              insertedDocs.push({ table, row })
              return {
                select: () => ({
                  single: async () => ({ data: { id: 'filled-uuid-1' }, error: null }),
                }),
              }
            },
          }
        },
      })),
    }))

    vi.resetModules()
    const { POST: fillOfficialDoc } = await import('@/app/api/official-documents/[id]/fill/route')
    const req = new NextRequest('http://localhost:3000/api/official-documents/doc-civil-debt-claim-001/fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: {
          court_name: 'Mirzo Ulug‘bek tumanlararo sudi',
          plaintiff_fullname: 'Karimov Rustam',
          plaintiff_address: 'Toshkent sh.',
          defendant_fullname: 'Rahimov Botir',
          defendant_address: 'Toshkent sh.',
          loan_amount: '10000000',
          agreement_date: '2026-01-10',
          due_date: '2026-06-10',
          evidence_type: 'o‘zaro tilxat',
        },
      }),
    })

    const res = await fillOfficialDoc(req, {
      params: Promise.resolve({ id: 'doc-civil-debt-claim-001' }),
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.savedId).toBe('filled-uuid-1')
    expect(insertedDocs[0].table).toBe('user_filled_documents')
    expect(insertedDocs[0].row.user_id).toBe('user-p0-5')
    expect(insertedDocs[0].row.document_id).toBe('uuid-doc-1')
    expect(insertedDocs[0].row.filled_data.plaintiff_fullname).toBe('Karimov Rustam')
  })
})
