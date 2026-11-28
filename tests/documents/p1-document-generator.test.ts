import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { generateLegalDocxBytes } from '@/lib/docx-generator'

const mockRequireUser = vi.fn()
vi.mock('@/lib/server-auth', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}))

const mockCheckAndIncrement = vi.fn()
vi.mock('@/lib/usage-limits', () => ({
  checkAndIncrement: (...args: unknown[]) => mockCheckAndIncrement(...args),
  usageMessage: () => 'Limit tugadi',
}))

describe('P1-3 Document Generator — Genuine DOCX & AI Drafting Coach', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
    process.env.GROQ_API_KEY = 'groq-test-key'
  })

  it('generates a genuine OOXML .docx ZIP archive (PK header) with Uzbek Unicode content', async () => {
    const bytes = await generateLegalDocxBytes({
      title: 'DA’VO ARIZASI',
      content: [
        'Fuqarolik ishlari bo‘yicha Toshkent shahar sudiga',
        'Da‘vogar: Aliyev Vali',
        'DA’VO ARIZASI',
        '(Qarz undirish to‘g‘risida)',
        'Men 2025-yil 10-yanvar kuni javobgarga 15 000 000 so‘m qarz berganman.',
        'SO‘RAYMAN:',
        '1. Javobgardan 15 000 000 so‘m undirishingizni.',
        'Da‘vogar: Aliyev Vali',
      ].join('\n'),
      legalBasis: 'O‘zR FK 732-modda',
      isCourtDocument: true,
    })

    // OOXML .docx is a ZIP archive starting with 'PK' (0x50, 0x4B)
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    expect(bytes.length).toBeGreaterThan(2000)

    const rawText = new TextDecoder('latin1').decode(bytes)
    expect(rawText).toContain('word/document.xml')
  })

  it('generates educational sample .docx without throwing', async () => {
    const bytes = await generateLegalDocxBytes({
      title: 'Mehnat shartnomasi namunasi',
      content: 'Ish beruvchi va xodim o‘rtasidagi mehnat shartnomasi.',
      isEducationalSample: true,
    })

    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
  })

  it('rejects unauthenticated requests to /api/ai/document-analysis', async () => {
    mockRequireUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const { POST } = await import('@/app/api/ai/document-analysis/route')

    const req = new NextRequest('http://localhost/api/ai/document-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: 'Men 2025-yil 10-yanvar kuni javobgarga 15 000 000 so‘m qarz berganman va qaytarishni talab qilaman.',
        documentType: 'Da’vo arizasi',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects short/empty documentText in /api/ai/document-analysis', async () => {
    mockRequireUser.mockResolvedValue({ ok: true, user: { id: 'user-1' } })
    mockCheckAndIncrement.mockResolvedValue({ allowed: true, used: 1, limit: 10, plan: 'free' })
    const { POST } = await import('@/app/api/ai/document-analysis/route')

    const req = new NextRequest('http://localhost/api/ai/document-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: '   ', documentType: 'Da’vo arizasi' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated fill/persistence on /api/official-documents/[id]/fill', async () => {
    mockRequireUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const { POST } = await import('@/app/api/official-documents/[id]/fill/route')

    const req = new NextRequest('http://localhost/api/official-documents/davo-qarz/fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: {} }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'davo-qarz' }) })
    expect(res.status).toBe(401)
  })
})
