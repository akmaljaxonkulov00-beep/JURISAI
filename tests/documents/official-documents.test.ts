import { describe, it, expect } from 'vitest'
import {
  OFFICIAL_DOCUMENTS_REGISTRY,
  getOfficialDocuments,
  getOfficialDocumentById,
  renderOfficialDocumentText,
} from '@/lib/documents/official-documents-data'
import { generateLegalPdf } from '@/lib/pdf-generator'
import crypto from 'crypto'

describe('Hujjatlar Konstruktori 2.0 — Official Documents Registry & Engine', () => {
  it('10 ta rasmiy toifa mavjud va kamida 10 ta tasdiqlangan rasmiy blank mavjud', () => {
    expect(OFFICIAL_DOCUMENTS_REGISTRY.length).toBeGreaterThanOrEqual(10)

    const categories = new Set(OFFICIAL_DOCUMENTS_REGISTRY.map((d) => d.category))
    expect(categories.has('civil')).toBe(true)
    expect(categories.has('family')).toBe(true)
    expect(categories.has('labor')).toBe(true)
    expect(categories.has('contracts')).toBe(true)
    expect(categories.has('inheritance')).toBe(true)
    expect(categories.has('administrative')).toBe(true)
    expect(categories.has('criminal')).toBe(true)
    expect(categories.has('notarial')).toBe(true)
    expect(categories.has('procedural')).toBe(true)
    expect(categories.has('other')).toBe(true)
  })

  it('Barcha hujjatlar VERIFIED_OFFICIAL holatda va rasmiy manba ma’lumotlariga ega', () => {
    for (const doc of OFFICIAL_DOCUMENTS_REGISTRY) {
      expect(doc.id).toBeTruthy()
      expect(doc.documentName).toBeTruthy()
      expect(doc.verificationStatus).toBe('VERIFIED_OFFICIAL')
      expect(doc.officialSourceName).toBeTruthy()
      expect(doc.officialSourceUrl).toMatch(/^https?:\/\//)
      expect(doc.sha256Checksum.length).toBe(64) // Valid SHA-256
      expect(doc.legalBasis.length).toBeGreaterThan(0)
      for (const lb of doc.legalBasis) {
        expect(lb.article).toBeTruthy()
        expect(lb.officialUrl).toMatch(/^https?:\/\//)
      }
      expect(doc.fields.length).toBeGreaterThan(0)
    }
  })

  it('Kategoriya va qidiruv bo‘yicha to‘g‘ri filtrlaydi', () => {
    const civilDocs = getOfficialDocuments('civil')
    expect(civilDocs.length).toBeGreaterThanOrEqual(1)
    expect(civilDocs.every((d) => d.category === 'civil')).toBe(true)

    const debtSearch = getOfficialDocuments(undefined, 'qarz')
    expect(debtSearch.length).toBeGreaterThanOrEqual(1)
    expect(debtSearch[0].id).toBe('doc-civil-debt-claim-001')

    const nonExistent = getOfficialDocuments(undefined, 'mavjud_bo‘lmagan_so‘z_xyz123')
    expect(nonExistent.length).toBe(0)
  })

  it('ID bo‘yicha aniq hujjatni topadi', () => {
    const doc = getOfficialDocumentById('doc-civil-debt-claim-001')
    expect(doc).toBeDefined()
    expect(doc?.documentName).toContain('Qarz')
    expect(doc?.category).toBe('civil')

    const notFound = getOfficialDocumentById('doc-random-404')
    expect(notFound).toBeUndefined()
  })

  it('Hujjat matnini rasmiy rekvizitlar asosida render qiladi', () => {
    const doc = getOfficialDocumentById('doc-civil-debt-claim-001')!
    const mockValues = {
      court_name: 'Fuqarolik ishlari bo‘yicha Mirzo Ulug‘bek tumanlararo sudi',
      plaintiff_fullname: 'Karimov Rustam Aliyevich',
      plaintiff_address: 'Toshkent sh., Yunusobod tumani, 12-uy',
      defendant_fullname: 'Rahimov Botir Shuhratovich',
      defendant_address: 'Toshkent sh., Chilonzor tumani, 4-mavze, 2-uy',
      loan_amount: '35000000',
      penalty_amount: '3500000',
      agreement_date: '2024-05-10',
      due_date: '2024-11-10',
    }

    const rendered = renderOfficialDocumentText(doc, mockValues)
    expect(rendered).toContain('DA‘VO ARIZA')
    expect(rendered).toContain('Karimov Rustam Aliyevich')
    expect(rendered).toContain('Rahimov Botir Shuhratovich')
    expect(rendered).toMatch(/35[\s\u00a0,.]000[\s\u00a0,.]000/)
    expect(rendered).toContain('Fuqarolik kodeksining 324, 734-735 moddalariga')
    expect(rendered).toContain('FPKning 188, 189, 191-moddalariga')

    const hash = crypto.createHash('sha256').update(rendered).digest('hex')
    expect(hash.length).toBe(64)
  })

  it('PDF generator orqali haqiqiy PDF baytlari yaratadi', async () => {
    const doc = getOfficialDocumentById('doc-labor-unpaid-wages-003')!
    const rendered = renderOfficialDocumentText(doc, {
      court_name: 'Fuqarolik ishlari bo‘yicha sudi',
      employee_fullname: 'Saidov Anvar',
      employer_name: 'MCHJ Tashkent Invest',
    })

    const pdfBytes = await generateLegalPdf({
      title: doc.documentName,
      subtitle: `Rasmiy namuna: ${doc.officialSourceName}`,
      content: rendered,
      date: '21.11.2026',
      author: 'Juristiv Hujjatlar Konstruktori 2.0',
      legalBasis: 'MK 333-modda',
    })

    expect(pdfBytes).toBeDefined()
    expect(pdfBytes.length).toBeGreaterThan(500)
    expect(pdfBytes instanceof Uint8Array).toBe(true)
  })
})
