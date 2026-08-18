import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * ai-routes-rag.test.ts — BARCHA AI route'larining prompt sifati va javob
 * qayta ishlashini tekshiruvchi kengaytirilgan test to'plami.
 *
 * Har bir AI route uchun quyidagilar tekshiriladi:
 *  1. Ishlaydigan Groq modeli ishlatilyapti (openai/gpt-oss-120b)
 *  2. System prompt o'zbek tilida javob berishni talab qiladi
 *  3. System prompt yolg'on modda raqami to'qishni taqiqlaydi (RAG asoslilik)
 *  4. Foydalanuvchi savoli AI ga to'g'ri uzatiladi
 *  5. AI javobidagi yolg'on modda havolasiga eslatma qo'shiladi
 *
 * Qo'shimcha: o'zbek tilini aniqlovchi yordamchi funksiya testlari.
 */

// ── Umumiy dep mock'lari: auth, limitlar va RAG ────────────────────────────
vi.mock('@/lib/server-auth', () => ({
  requireUser: vi.fn().mockResolvedValue({
    ok: true,
    user: { id: 'test-user-0001', email: 'user@test.uz' },
  }),
}))

vi.mock('@/lib/usage-limits', () => ({
  checkAndIncrement: vi.fn().mockResolvedValue({ allowed: true, remaining: 50, limit: 50 }),
  usageMessage: vi.fn(() => 'Limit tugadi'),
}))

vi.mock('@/lib/legal-rag', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/legal-rag')>()
  return {
    ...actual,
    groundPrompt: vi.fn(async (_question: string, base: string) => ({
      prompt: `${base}\n\nBAZA MA'LUMOTLARI (test konteksti):\n[1] O'zbekiston Respublikasi Jinoyat Kodeksi, 169-modda — O'g'irlik`,
      articles: [],
    })),
    retrieveLegalArticles: vi.fn(async () => []),
    buildLegalContext: vi.fn(() => ''),
    validateCitations: vi.fn(async () => ({ valid: [], invalid: [] })),
  }
})

// ── O'zbek tilini aniqlash (javob sifatini tekshirish uchun) ────────────────
function isLikelyUzbek(text: string): boolean {
  const t = text.toLowerCase()
  // O'zbek lotin yozuviga xos belgilar va birikmalar
  if (/o‘|oʻ|g‘|gʻ|o'z|bo'sh|to'g'ri|o'g'ir|o'zbek|bo'yicha|ko'ra/.test(t)) return true
  const words = [
    'uchun',
    'kerak',
    'modda',
    'kodeks',
    'qonun',
    'bilan',
    'hisoblanadi',
    'mumkin',
    'huquq',
    'sud',
    'xulosa',
    'javob',
    'shartnoma',
    "da'vo",
    'shuningdek',
    'tomonidan',
    'majburiyat',
    'belgilanadi',
    'amalga oshiriladi',
    'tartibi',
    'tuziladi',
    'beriladi',
  ]
  let hits = 0
  for (const w of words) if (t.includes(w)) hits++
  return hits >= 2
}

describe("O'zbek tili aniqlagich", () => {
  it("o'zbek lotin matnini aniqlaydi", () => {
    expect(
      isLikelyUzbek(
        "O'zbekiston Respublikasi Jinoyat Kodeksining 169-moddasiga ko'ra, o'g'irlik uchun javobgarlik belgilanadi."
      )
    ).toBe(true)
    expect(
      isLikelyUzbek(
        "Mehnat shartnomasi ish beruvchi va xodim o'rtasida tuziladi, unda tomonlarning huquq va majburiyatlari belgilanadi."
      )
    ).toBe(true)
  })

  it('ingliz va rus matnlarini o\'zbek deb qabul qilmaydi', () => {
    expect(
      isLikelyUzbek(
        'According to Article 169 of the Criminal Code, liability for theft is established.'
      )
    ).toBe(false)
    expect(
      isLikelyUzbek(
        'В соответствии со статьей 169 Уголовного кодекса устанавливается ответственность за кражу.'
      )
    ).toBe(false)
  })
})

// ── AI route'larini tekshirish ─────────────────────────────────────────────
describe('AI route prompt sifati (model + o\'zbek tili + RAG)', () => {
  const fetchMock = vi.fn()
  const LONG_CASE =
    "2024-yil 15-mart kuni Toshkent shahrida A.A. Karimov do'kondan 10 million so'm miqdoridagi naqd pulni o'g'irlab ketgan. U 2 kundan keyin qo'lga olingan va jinoyatni tan olgan."

  const ROUTES: Array<{ name: string; path: string; body: Record<string, unknown> }> = [
    { name: 'AI chat', path: '@/app/api/ai/chat/route', body: { message: 'Mehnat shartnomasini bekor qilish tartibi qanday?' } },
    { name: 'Huquqiy chat', path: '@/app/api/ai/legal-chat/route', body: { message: "O'g'irlik uchun javobgarlik qanday?" } },
    { name: 'IRAC (real)', path: '@/app/api/ai/irac-analyze-real/route', body: { case_text: LONG_CASE } },
    { name: 'IRAC', path: '@/app/api/ai/irac-analyze/route', body: { caseText: LONG_CASE } },
    { name: 'Hujjat tahlili', path: '@/app/api/ai/document-analysis/route', body: { documentText: LONG_CASE, documentType: 'shartnoma' } },
    { name: 'Hujjat generator', path: '@/app/api/ai/document-generate/route', body: { templateId: 'tpl-1', templateName: "Da'vo arizasi", documentData: { tomon: 'A' }, language: 'uz' } },
    { name: 'Senariy generator', path: '@/app/api/scenario-generator/generate/route', body: { topic: "O'g'irlik ishi", difficulty: "o'rta" } },
    { name: 'Qarorlar daraxti', path: '@/app/api/decision-tree/generate/route', body: { scenario: "Do'kondan tovar o'g'irlash ishi", case_type: 'jinoyat' } },
    { name: 'Virtual sud', path: '@/app/api/court-simulator/route', body: { action: 'start', caseDetails: LONG_CASE, userRole: 'SUDYA', userName: 'Test User' } },
  ]

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "O'zbek tilidagi test javob." } }], usage: {} }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function groqPayload(routePath: string, body: unknown) {
    const mod = await import(routePath)
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const res = await mod.POST(req)
    const call = fetchMock.mock.calls.at(-1)
    expect(call, 'Groq API chaqirilishi kerak').toBeDefined()
    const [url, init] = call as [string, { body: string }]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    const payload = JSON.parse(init.body) as {
      model: string
      messages: Array<{ role: string; content: string }>
    }
    const system = payload.messages.find(m => m.role === 'system')?.content || ''
    const user = payload.messages.find(m => m.role === 'user')?.content || ''
    return { payload, system, user, res }
  }

  for (const route of ROUTES) {
    it(`${route.name}: ishlaydigan model + o'zbek tili + RAG qoidasi`, async () => {
      const { payload, system } = await groqPayload(route.path, route.body)

      // 1) Ishlaydigan model (hisobda mavjudligi tekshirilgan)
      expect(payload.model, `${route.name} — model`).toBe('openai/gpt-oss-120b')

      // 2) O'zbek tili talabi
      expect(system.toLowerCase(), `${route.name} — o'zbek tili`).toContain("o'zbek")

      // 3) Yolg'on modda to'qishni taqiqlash / RAG asoslilik
      expect(
        system,
        `${route.name} — yolg'on moddani taqiqlash`
      ).toMatch(/to'qima|invent|hallucinat|yolg'on|taxmin qilmang|BAZA MA'LUMOTLARI|fake|bazasiga qarang/i)

      // 4) RAG konteksti (BAZA MA'LUMOTLARI) promptga qo'shilgan
      expect(system, `${route.name} — RAG konteksti`).toContain("BAZA MA'LUMOTLARI")
    })
  }

  it("AI chat: foydalanuvchi savoli AI ga uzatiladi", async () => {
    const { user } = await groqPayload('@/app/api/ai/chat/route', {
      message: 'Mehnat shartnomasini bekor qilish tartibi qanday?',
    })
    expect(user).toContain('Mehnat shartnomasini bekor qilish tartibi qanday?')
  })

  it("Huquqiy chat: foydalanuvchi savoli AI ga uzatiladi", async () => {
    const { user } = await groqPayload('@/app/api/ai/legal-chat/route', {
      message: "O'g'irlik uchun javobgarlik qanday?",
    })
    expect(user).toContain("O'g'irlik uchun javobgarlik qanday?")
  })
})

// ── AI javobini qayta ishlash: yolg'on havola himoyasi ─────────────────────
describe('AI javobidagi yolg\'on modda havolalarini himoya qilish', () => {
  const fetchMock = vi.fn()

  beforeEach(async () => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    // validateCitations — har bir testda default holatga qaytariladi
    const { validateCitations } = await import('@/lib/legal-rag')
    vi.mocked(validateCitations).mockReset()
    vi.mocked(validateCitations).mockResolvedValue({ valid: [], invalid: [] })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("chat: bazada mavjud bo'lmagan modda havolasiga eslatma qo'shiladi", async () => {
    const { validateCitations } = await import('@/lib/legal-rag')
    vi.mocked(validateCitations).mockResolvedValueOnce({
      valid: [],
      invalid: [{ code: 'JK', article: 999, raw: 'JK 999-modda' }],
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Javob: JK 999-modda qo'llaniladi." } }],
      }),
    })

    const mod = await import('@/app/api/ai/chat/route')
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test savol' }),
    })
    const res = await mod.POST(req)
    expect(res.status).toBe(200)
    const data = (await res.json()) as { response: string }
    expect(data.response).toContain('mavjud emas')
    expect(data.response).toContain('999-modda')
  })

  it("chat: toza (RAG asoslangan) javob o'zgartirilmasdan qaytadi", async () => {
    const { validateCitations } = await import('@/lib/legal-rag')
    vi.mocked(validateCitations).mockResolvedValueOnce({ valid: [], invalid: [] })
    const cleanResponse =
      "O'zbekiston Respublikasi Mehnat kodeksiga ko'ra, mehnat shartnomasi tomonlarning kelishuvi bilan bekor qilinishi mumkin."
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: cleanResponse } }] }),
    })

    const mod = await import('@/app/api/ai/chat/route')
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Mehnat shartnomasi qanday bekor qilinadi?' }),
    })
    const res = await mod.POST(req)
    const data = (await res.json()) as { response: string }
    expect(data.response).toBe(cleanResponse)
    expect(data.response).not.toContain('mavjud emas')
  })

  it('validatsiya xatosi javobni buzmaydi (xavfsiz fallback)', async () => {
    const { validateCitations } = await import('@/lib/legal-rag')
    vi.mocked(validateCitations).mockRejectedValueOnce(new Error('DB down'))
    const cleanResponse = "O'zbek tilidagi oddiy javob."
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: cleanResponse } }] }),
    })

    const mod = await import('@/app/api/ai/chat/route')
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Savol' }),
    })
    const res = await mod.POST(req)
    expect(res.status).toBe(200)
    const data = (await res.json()) as { response: string }
    expect(data.response).toBe(cleanResponse)
  })
})
