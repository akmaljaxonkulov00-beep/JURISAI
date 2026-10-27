import { describe, it, expect } from 'vitest'
import {
  callGemini,
  callGeminiJson,
  analyzeCaseWithGemini,
  consultLegalAssistant,
  UZBEK_LEGAL_SYSTEM_INSTRUCTION,
} from '@/lib/gemini'

describe('Google Gemini — O‘zbekiston Qonunchiligi AI Integratsiyasi', () => {
  it('Gemini tizim direktivasi O‘zbekiston qonun manbalarini o‘z ichiga oladi', () => {
    expect(UZBEK_LEGAL_SYSTEM_INSTRUCTION).toContain('O‘zbekiston Respublikasi Konstitutsiyasi')
    expect(UZBEK_LEGAL_SYSTEM_INSTRUCTION).toContain('Jinoyat kodeksi')
    expect(UZBEK_LEGAL_SYSTEM_INSTRUCTION).toContain('Fuqarolik kodeksi')
    expect(UZBEK_LEGAL_SYSTEM_INSTRUCTION).toContain('Mehnat kodeksi')
    expect(UZBEK_LEGAL_SYSTEM_INSTRUCTION).toContain('IRAC')
  })

  it('Gemini O‘zbekiston qonun moddasini aniq tushuntirib beradi', async () => {
    const response = await callGemini(
      'Mehnat kodeksining 161-moddasi (mehnat shartnomasini bekor qilish) asosiy qoidalari haqida qisqacha ma’lumot bering.',
      { maxTokens: 1500, temperature: 0.1 }
    )

    expect(response).toBeTruthy()
    expect(response.length).toBeGreaterThan(20)
    // Response should be in Uzbek and reference labor law
    const mentionsLaborOrArticle =
      response.toLowerCase().includes('mehnat') ||
      response.toLowerCase().includes('shartnoma') ||
      response.includes('161')
    expect(mentionsLaborOrArticle).toBe(true)
  }, 20000)

  it('Gemini to‘g‘ri JSON formatida strukturaviy ma’lumot qaytaradi', async () => {
    interface ArticleInfo {
      code: string
      articleNumber: string
      title: string
    }

    const res = await callGeminiJson<ArticleInfo>(
      'O‘zbekiston Jinoyat-protsessual kodeksining 405-moddasi haqida JSON qaytaring: { "code": "JPK", "articleNumber": "405", "title": "Sud majlisini ochish" }',
      { temperature: 0.1 }
    )

    expect(res).toBeDefined()
    expect(typeof res.code).toBe('string')
    expect(typeof res.articleNumber).toBe('string')
    expect(res.articleNumber).toContain('405')
  }, 20000)

  it('IRAC metodi bo‘yicha kazusni chuqur tahlil qiladi', async () => {
    const analysis = await analyzeCaseWithGemini({
      title: 'Noqonuniy ishdan bo‘shatish',
      facts: 'Xodim kasaba uyushmasi roziligisiz va ogohlantirish muddati berilmasdan ishdan bo‘shatildi.',
      disputeCategory: 'Mehnat nizosi',
    })

    expect(analysis).toBeDefined()
    expect(analysis.issue).toBeTruthy()
    expect(Array.isArray(analysis.rules)).toBe(true)
    expect(analysis.rules.length).toBeGreaterThan(0)
    expect(analysis.analysis).toBeTruthy()
    expect(analysis.conclusion).toBeTruthy()
  }, 25000)
})
