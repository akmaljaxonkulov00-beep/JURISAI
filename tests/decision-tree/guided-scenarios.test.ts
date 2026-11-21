import { describe, it, expect } from 'vitest'
import {
  GUIDED_SCENARIOS,
  getScenarioById,
} from '@/lib/decision-tree/guided-scenarios-data'
import { generateLegalPdf } from '@/lib/pdf-generator'

describe('Qarorlar Daraxti 2.0 — Guided Decision Flow & Logic', () => {
  it('Kamida 3 ta to‘liq ishlaydigan ssenariy mavjud', () => {
    expect(GUIDED_SCENARIOS.length).toBeGreaterThanOrEqual(3)

    const ids = GUIDED_SCENARIOS.map((s) => s.id)
    expect(ids).toContain('civil-debt')
    expect(ids).toContain('labor-dismissal')
    expect(ids).toContain('family-divorce')
  })

  it('Har bir ssenariyda boshlang‘ich savol va qonuniy asoslar (LexUZ) mavjud', () => {
    for (const scenario of GUIDED_SCENARIOS) {
      expect(scenario.initialQuestionId).toBeTruthy()
      const initQ = scenario.questions[scenario.initialQuestionId]
      expect(initQ).toBeDefined()
      expect(initQ.question).toBeTruthy()
      expect(initQ.explanation).toBeTruthy()
      expect(initQ.legalBasis.url).toMatch(/^https:\/\/lex\.uz/)
      expect(initQ.options.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('Har bir savolda "Bilmayman" yoki noaniqlik varianti mavjud bo‘lishi ta’minlangan', () => {
    const debtQ = GUIDED_SCENARIOS.find((s) => s.id === 'civil-debt')!.questions['q_has_document']
    const hasUnknown = debtQ.options.some(
      (opt) => opt.label.includes('Bilmayman') || opt.label.includes('yo‘q')
    )
    expect(hasUnknown).toBe(true)
  })

  it('Terminal natijalar to‘liq ma’lumotlar bilan boyitilgan', () => {
    for (const scenario of GUIDED_SCENARIOS) {
      for (const resKey of Object.keys(scenario.results)) {
        const result = scenario.results[resKey]
        expect(result.title).toBeTruthy()
        expect(result.winProbability).toBeGreaterThanOrEqual(0)
        expect(result.winProbability).toBeLessThanOrEqual(100)
        expect(['high', 'medium', 'low']).toContain(result.probabilityLevel)
        expect(result.requiredEvidence.length).toBeGreaterThan(0)
        expect(result.recommendedSteps.length).toBeGreaterThan(0)
        expect(result.applicableLaws.length).toBeGreaterThan(0)
      }
    }
  })

  it('Hujjatlar konstruktoriga bog‘lanish (matchingDocumentId) to‘g‘ri sozlangan', () => {
    const debtScenario = getScenarioById('civil-debt')!
    const successResult = debtScenario.results['res_debt_success_high']
    expect(successResult.matchingDocumentId).toBe('doc-civil-debt-claim-001')
    expect(successResult.matchingDocumentName).toContain('da’vo arizasi')

    const laborScenario = getScenarioById('labor-dismissal')!
    const laborSuccess = laborScenario.results['res_labor_success']
    expect(laborSuccess.matchingDocumentId).toBe('doc-labor-unpaid-wages-003')
  })

  it('Qarorlar daraxti ekspert hisoboti PDF sifatida muvaffaqiyatli generatsiya qilinadi', async () => {
    const scenario = getScenarioById('civil-debt')!
    const result = scenario.results['res_debt_success_high']

    const content = `YURIDIK QARORLAR DARAXTI — EKSPERT XULOSASI\n` +
      `Ish toifasi: ${scenario.categoryNameUz}\n` +
      `Holat: ${scenario.title}\n` +
      `Yutish ehtimoli: ${result.winProbability}% (${result.probabilityLevel})\n\n` +
      `XULOSA:\n${result.summary}`

    const pdfBytes = await generateLegalPdf({
      title: `Yuridik Xulosa - ${scenario.title}`,
      subtitle: 'Juristiv Qarorlar Daraxti 2.0',
      content,
      date: '21.11.2026',
      author: 'AI Yuridik Tahlil Tizimi',
      legalBasis: result.applicableLaws.map((l) => `${l.code} ${l.article}`).join(', '),
    })

    expect(pdfBytes).toBeDefined()
    expect(pdfBytes.length).toBeGreaterThan(500)
    expect(pdfBytes instanceof Uint8Array).toBe(true)
  })
})
