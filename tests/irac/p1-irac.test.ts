// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('P1-1: Student-First IRAC & Evaluation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('irac-evaluate returns sectionScores, missingArguments, reasoningDifferences, citationValidation, and preserves hintsUsed/examMode', async () => {
    vi.doMock('@/lib/server-auth', () => ({
      requireUser: vi.fn(async () => ({
        ok: true,
        user: { id: 'student-1', email: 'student@juristiv.uz' },
      })),
    }))
    vi.doMock('@/lib/usage-limits', () => ({
      checkAndIncrement: vi.fn(async () => ({ allowed: true, used: 1, limit: 50, remaining: 49 })),
      usageMessage: vi.fn(() => ''),
    }))
    vi.doMock('@/lib/legal-rag', () => ({
      retrieveLegalArticles: vi.fn(async () => []),
      buildLegalContext: vi.fn(() => ''),
      validateCitations: vi.fn(async () => ({
        valid: [{ code: 'civil_code', codeName: 'Fuqarolik kodeksi', article: 732, title: 'Qarz' }],
        invalid: [{ code: 'JK', article: 9999, raw: 'JK 9999-modda' }],
      })),
      appendCitationNote: vi.fn((t: string) => `${t}\n\n⚠️ Eslatma: JK 9999-modda`),
    }))
    vi.doMock('@/lib/gemini', () => ({
      callGemini: vi.fn(async () =>
        JSON.stringify({
          issue: 'Qarz shartnomasi bo‘yicha majburiyat buzilishi',
          rule: 'FK 732-modda va JK 9999-modda',
          application: 'Faktlar tahlili...',
          conclusion: 'Da’vo qanoatlantirilishi lozim.',
          sources: [{ title: 'Fuqarolik kodeksi', article: '732-modda', url: 'https://lex.uz' }],
          confidence: 90,
          score: 80,
          sectionScores: { issue: 16, rule: 20, application: 24, conclusion: 20 },
          feedback: 'Yaxshi tahlil.',
          strengths: ['Issue aniq qo‘yilgan'],
          weaknesses: ['Penya hisobi keltirilmagan'],
          missingArguments: ['FK 327-modda foizlari'],
          reasoningDifferences: ['Alternativ kelishuv varianti ham mavjud'],
          incorrectReferences: ['JK 9999-modda'],
          suggestions: ['FK 735-moddani ham qo‘shing'],
        })
      ),
    }))

    vi.stubEnv('GEMINI_API_KEY', 'real-test-key')
    const { POST: evaluateRoute } = await import('@/app/api/ai/irac-evaluate/route')

    const req = new NextRequest('http://localhost:3000/api/ai/irac-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseTitle: 'Qarz nizosi',
        caseText: 'Fuqaro A fuqaro B ga 10 mln som qarz berdi va qaytarilmadi.',
        userAnswers: {
          issue: 'Qarzni undirish masalasi',
          rule: 'FK 732-modda',
          application: 'Muddat otgan',
          conclusion: 'Qaytarilishi kerak',
        },
        hintsUsed: 1,
        examMode: true,
      }),
    })

    const res = await evaluateRoute(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.score).toBe(80)
    expect(data.sectionScores).toEqual({ issue: 16, rule: 20, application: 24, conclusion: 20 })
    expect(data.missingArguments).toEqual(['FK 327-modda foizlari'])
    expect(data.reasoningDifferences).toEqual(['Alternativ kelishuv varianti ham mavjud'])
    expect(data.incorrectReferences).toEqual(['JK 9999-modda'])
    expect(data.hintsUsed).toBe(1)
    expect(data.examMode).toBe(true)
    expect(data.citationValidation.invalid).toHaveLength(1)
    expect(data.rule).toContain('Eslatma')
  })

  it('PDF generator produces valid %PDF binary for Uzbek IRAC report', async () => {
    const { generateLegalPdf } = await import('@/lib/pdf-generator')
    const blob = await generateLegalPdf({
      title: 'IRAC Hisoboti — Qarz nizosi',
      subtitle: 'JURISTIV',
      content: 'O‘zbekiston Respublikasi Fuqarolik kodeksi 732-modda tahlili.',
      date: '2026-11-28',
    })
    const bytes = new Uint8Array(await new Response(blob).arrayBuffer())
    const header = new TextDecoder().decode(bytes.slice(0, 5))
    expect(header).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(500)
  })
})
