/**
 * O'ZBEKISTON RESPUBLIKASI QONUN KODEKSLARI
 *
 * To'liq moddalar bilan (4800+ ta modda)
 * Ma'lumotlar TXT fayllardan va generativ kod orqali import qilingan
 *
 * PRIMARY SOURCE: full-legal-codes.json (scripts/generate-full-legal-data.js)
 * Fallback: minimal stubs (empty articles array)
 */

export interface LegalArticle {
  number: string
  title: string
  content: string
  category?: string
  penalties?: string
  references?: string[]
}

export interface LegalCode {
  id: string
  name: string
  shortName: string
  description: string
  totalArticles: number
  effectiveDate: string
  articles: LegalArticle[]
}

// ── Primary data source: generated JSON ──────────────────────────
import fullData from './full-legal-codes.json'

function loadFullCodes(): LegalCode[] {
  try {
    if (!fullData || !Array.isArray(fullData)) return []
    return fullData.map((item: any) => ({
      id: item.id,
      name: item.name,
      shortName: item.shortName || item.name,
      description: item.description || '',
      totalArticles: item.totalArticles || item.articles?.length || 0,
      effectiveDate: item.effectiveDate || '01.01.2024',
      articles: (item.articles || []).map((a: any) => ({
        number: a.number,
        title: a.title || '',
        content: a.content || '',
        category: a.category || 'Umumiy',
        penalties: a.penalties || undefined,
        references: a.references && a.references.length > 0 ? a.references : undefined,
      })),
    }))
  } catch {
    return []
  }
}

const FULL_CODES = loadFullCodes()

function makeFallback(id: string, name: string): LegalCode {
  return {
    id,
    name,
    shortName: name,
    description: '',
    totalArticles: 0,
    effectiveDate: '01.01.2024',
    articles: [],
  }
}

// ── Code exports ─────────────────────────────────────────────────
// Each tries JSON first, falls back to minimal empty stub

export const CRIMINAL_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'criminal_code') ||
  makeFallback('criminal_code', "O'zbekiston Respublikasi Jinoyat Kodeksi")
export const CIVIL_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'civil_code') ||
  makeFallback('civil_code', "O'zbekiston Respublikasi Fuqarolik Kodeksi")
export const LABOR_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'labor_code') ||
  makeFallback('labor_code', "O'zbekiston Respublikasi Mehnat Kodeksi")
export const FAMILY_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'family_code') ||
  makeFallback('family_code', "O'zbekiston Respublikasi Oila Kodeksi")
export const TAX_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'tax_code') ||
  makeFallback('tax_code', "O'zbekiston Respublikasi Soliq Kodeksi")
export const LAND_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'land_code') ||
  makeFallback('land_code', "O'zbekiston Respublikasi Yer Kodeksi")
export const ADMINISTRATIVE_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'admin_code') ||
  makeFallback('admin_code', "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi")
export const CONSTITUTION: LegalCode =
  FULL_CODES.find(c => c.id === 'constitution') ||
  makeFallback('constitution', "O'zbekiston Respublikasi Konstitutsiyasi")
export const CIVIL_PROCEDURE_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'civil_procedure_code') ||
  makeFallback('civil_procedure_code', "O'zbekiston Respublikasi Fuqarolik protsessual Kodeksi")
export const CRIMINAL_PROCEDURE_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'criminal_procedure_code') ||
  makeFallback('criminal_procedure_code', "O'zbekiston Respublikasi Jinoyat-protsessual Kodeksi")
export const ECONOMIC_PROCEDURE_CODE: LegalCode =
  FULL_CODES.find(c => c.id === 'economic_procedure_code') ||
  makeFallback('economic_procedure_code', "O'zbekiston Respublikasi Iqtisodiy protsessual Kodeksi")

// ── Aggregate exports ────────────────────────────────────────────

export const ALL_LEGAL_CODES: LegalCode[] = [
  CRIMINAL_CODE,
  CIVIL_CODE,
  LABOR_CODE,
  FAMILY_CODE,
  TAX_CODE,
  LAND_CODE,
  ADMINISTRATIVE_CODE,
  CIVIL_PROCEDURE_CODE,
  CRIMINAL_PROCEDURE_CODE,
  ECONOMIC_PROCEDURE_CODE,
  CONSTITUTION,
]

// ── Helper functions ─────────────────────────────────────────────

export function getLegalCodeById(id: string): LegalCode | undefined {
  return ALL_LEGAL_CODES.find(code => code.id === id)
}

export function searchLegalArticles(query: string): LegalArticle[] {
  const lower = query.toLowerCase()
  const results: LegalArticle[] = []
  for (const code of ALL_LEGAL_CODES) {
    for (const article of code.articles) {
      if (
        article.number.includes(lower) ||
        article.title.toLowerCase().includes(lower) ||
        article.content.toLowerCase().includes(lower) ||
        article.category?.toLowerCase().includes(lower)
      ) {
        results.push(article)
      }
    }
  }
  return results
}

export function getArticleByNumber(
  codeId: string,
  articleNumber: string
): LegalArticle | undefined {
  const code = getLegalCodeById(codeId)
  return code?.articles.find(a => a.number === articleNumber)
}

// ── Display names (for badges, breadcrumbs, UI) ──────────────────

export const CODE_DISPLAY_NAMES: Record<string, string> = {
  criminal_code: "O'zbekiston Respublikasi Jinoyat Kodeksi",
  civil_code: "O'zbekiston Respublikasi Fuqarolik Kodeksi",
  labor_code: "O'zbekiston Respublikasi Mehnat Kodeksi",
  family_code: "O'zbekiston Respublikasi Oila Kodeksi",
  tax_code: "O'zbekiston Respublikasi Soliq Kodeksi",
  land_code: "O'zbekiston Respublikasi Yer Kodeksi",
  admin_code: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi",
  constitution: "O'zbekiston Respublikasi Konstitutsiyasi",
  civil_procedure_code: "O'zbekiston Respublikasi Fuqarolik protsessual Kodeksi",
  criminal_procedure_code: "O'zbekiston Respublikasi Jinoyat-protsessual Kodeksi",
  economic_procedure_code: "O'zbekiston Respublikasi Iqtisodiy protsessual Kodeksi",
}
