import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractCitations,
  validateCitations,
  appendCitationNote,
  buildLegalContext,
  groundPrompt,
  type RAGArticle,
} from '@/lib/legal-rag'

/**
 * legal-rag.test.ts — AI javoblaridagi modda havolalarini qonunlar bazasiga
 * nisbatan tekshiruvchi mexanizmning testlari.
 *
 * Maqsad: AI to'qigan (bazada mavjud bo'lmagan) modda raqamlari hech qachon
 * javobda qolib ketmasligini kafolatlash.
 */

// Supabase chaqiruvlarini boshqariladigan mock bilan almashtiramiz —
// testlar haqiqiy tarmoq so'rovlarisiz ishlaydi.
const store = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  categories: [] as Array<Record<string, unknown>>,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'categories') {
        return { select: vi.fn().mockResolvedValue({ data: store.categories, error: null }) }
      }
      // articles — zanjirli builder
      const builder: Record<string, unknown> = {}
      builder.select = vi.fn(() => builder)
      builder.eq = vi.fn(() => builder)
      builder.in = vi.fn(() => builder)
      builder.or = vi.fn(() => builder)
      builder.order = vi.fn(() => builder)
      builder.limit = vi.fn(() => Promise.resolve({ data: store.rows, error: null }))
      builder.range = vi.fn(() => Promise.resolve({ data: store.rows, error: null }))
      // “await builder” (masalan `.in('id', ids)` dan keyin) ham {data} qaytarsin
      builder.then = (resolve: (v: unknown) => void) =>
        resolve({ data: store.rows, error: null })
      return builder
    },
  })),
}))

beforeEach(() => {
  store.rows = []
  store.categories = []
})

describe('extractCitations', () => {
  it("parses 'Kodeks N-modda' references with full code names", () => {
    const refs = extractCitations(
      "O'zbekiston Respublikasi Jinoyat Kodeksining 169-moddasi va Fuqarolik Kodeksining 333-moddasi"
    )
    expect(refs).toHaveLength(2)
    expect(refs[0].article).toBe(169)
    expect(refs[0].code?.toLowerCase()).toBe('jinoyat kodeksi')
    expect(refs[1].article).toBe(333)
    expect(refs[1].code?.toLowerCase()).toBe('fuqarolik kodeksi')
  })

  it('parses short code abbreviations (JK, FK, MK, SK, OK, JPK)', () => {
    const refs = extractCitations('JK 97-modda, FK 15-modda, MK 158-modda, SK 123-modda')
    const codes = refs.map(r => r.code).sort()
    expect(codes).toEqual(['FK', 'JK', 'MK', 'SK'])
  })

  it('parses article-only references without a code name', () => {
    const refs = extractCitations('Qonunning 45-moddasiga murojaat qilamiz')
    expect(refs).toHaveLength(1)
    expect(refs[0].article).toBe(45)
    expect(refs[0].code).toBeNull()
  })

  it('handles spaced article references (169 modda)', () => {
    const refs = extractCitations('JK 169 modda')
    expect(refs).toHaveLength(1)
    expect(refs[0].article).toBe(169)
    expect(refs[0].code).toBe('JK')
  })

  it('returns empty array when no citations exist', () => {
    expect(extractCitations('Bu matnda hech qanday modda havolasi yo\'q')).toEqual([])
  })

  it('does not duplicate identical citations', () => {
    const refs = extractCitations('JK 97-modda. Yana JK 97-modda.')
    expect(refs).toHaveLength(1)
  })
})

describe('validateCitations', () => {
  it('marks known articles as valid', async () => {
    store.rows = [
      { code_id: 'criminal_code', article_number: '169', title: "O'g'irlik" },
    ]
    const result = await validateCitations('JK 169-moddasi')
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0]).toMatchObject({ code: 'criminal_code', article: 169 })
    expect(result.valid[0].codeName).toContain('Jinoyat Kodeksi')
    expect(result.invalid).toHaveLength(0)
  })

  it('flags hallucinated article numbers as invalid', async () => {
    store.rows = [] // bazada hech narsa yo'q
    const result = await validateCitations('JK 999-modda')
    expect(result.invalid).toHaveLength(1)
    expect(result.invalid[0].article).toBe(999)
    expect(result.invalid[0].code).toBe('JK')
  })

  it('flags article from the wrong code as invalid', async () => {
    // 169-modda bazada faqat civil_code da bor
    store.rows = [{ code_id: 'civil_code', article_number: '169', title: 'Boshqa modda' }]
    const result = await validateCitations('JK 169-moddasi')
    expect(result.invalid).toHaveLength(1)
  })

  it('returns empty validation for text without citations', async () => {
    const result = await validateCitations('Umumiy fikr, modda yo\'q')
    expect(result.valid).toHaveLength(0)
    expect(result.invalid).toHaveLength(0)
  })
})

describe('appendCitationNote', () => {
  const invalid = [{ code: 'JK', article: 999, raw: 'JK 999-modda' }]

  it('appends a warning when invalid citations exist', () => {
    const text = 'JK 999-modda qo\'llaniladi.'
    const result = appendCitationNote(text, { valid: [], invalid })
    expect(result).toContain('mavjud emas')
    expect(result).toContain('999-modda')
  })

  it('leaves text unchanged when all citations are valid', () => {
    const text = 'JK 97-modda qo\'llaniladi.'
    const result = appendCitationNote(text, { valid: [], invalid: [] })
    expect(result).toBe(text)
  })

  it('does not append the note twice', () => {
    const text = 'JK 999-modda qo\'llaniladi.'
    const once = appendCitationNote(text, { valid: [], invalid })
    const twice = appendCitationNote(once, { valid: [], invalid })
    expect(twice).toBe(once)
  })
})

describe('buildLegalContext', () => {
  it('builds context blocks with code, article and title', () => {
    const articles: RAGArticle[] = [
      {
        code_id: 'criminal_code',
        code_name: "O'zbekiston Respublikasi Jinoyat Kodeksi",
        article_number: '169',
        title: "O'g'irlik",
        content: 'Tovar yoki boshqa mol-mulkni...',
        chapter: '',
        penalties: '',
      },
    ]
    const ctx = buildLegalContext(articles)
    expect(ctx).toContain('169-modda')
    expect(ctx).toContain('Jinoyat Kodeksi')
    expect(ctx).toContain("O'g'irlik")
    expect(ctx).toContain('Tovar yoki boshqa mol-mulkni')
  })

  it('returns empty string for no articles', () => {
    expect(buildLegalContext([])).toBe('')
  })
})

describe('groundPrompt', () => {
  it('adds a no-fabrication rule when no articles are found', async () => {
    store.rows = []
    store.categories = []
    const { prompt, articles } = await groundPrompt('bu savolga bazada mos modda yo\'q', 'BASE_PROMPT')
    expect(articles).toHaveLength(0)
    expect(prompt).toContain('BASE_PROMPT')
    expect(prompt).toContain("to'qima")
    expect(prompt).toContain('modda raqami keltirma')
  })

  it('injects retrieved articles as context', async () => {
    store.categories = [{ code_id: 'criminal_code', name: 'Jinoyat kodeksi' }]
    store.rows = [
      { id: '1', code_id: 'criminal_code', article_number: '169', title: "O'g'irlik", content: 'Matn...' },
    ]
    const { prompt, articles } = await groundPrompt('JK 169-moddasi haqida so\'rayman', 'BASE_PROMPT')
    expect(articles.length).toBeGreaterThan(0)
    expect(prompt).toContain('BAZA MA\'LUMOTLARI')
  })
})
