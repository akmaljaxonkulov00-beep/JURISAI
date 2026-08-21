'use client'

import type { RealtimeChannel } from '@supabase/supabase-js'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getDisplayNameFromCodeId } from '@/lib/utils/code-mapper'
import { supabase as browserSupabase } from '@/lib/supabase-browser'

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

// Supabase'dan keladigan xom qatorlar (any o'rniga)
interface CategoryRow {
  code_id: string
  name?: string
  description?: string
  [key: string]: unknown
}

interface ArticleRow {
  code_id?: string
  article_number?: string
  title?: string
  content?: string
  chapter?: string
  penalties?: string
  cross_references?: string[]
  references?: string[]
  [key: string]: unknown
}

interface CodeEntry {
  id: string
  name: string
  shortName: string
  description: string
  effectiveDate: string
  articles: LegalArticle[]
}

/** CODE_DISPLAY_NAMES — yagona manbadan (code-mapper.ts) olinadi */
export { getDisplayNameFromCodeId as CODE_DISPLAY_NAMES }

/**
 * Legal code display names — single source of truth for Uzbek names.
 * All UI components use this map. NO raw slugs shown to users.
 */
export const CODE_DISPLAY_NAMES_MAP: Record<string, string> = {
  criminal_code: 'O\u02bbzbekiston Respublikasi Jinoyat Kodeksi',
  civil_code: 'O\u02bbzbekiston Respublikasi Fuqarolik Kodeksi',
  labor_code: 'O\u02bbzbekiston Respublikasi Mehnat Kodeksi',
  family_code: 'O\u02bbzbekiston Respublikasi Oila Kodeksi',
  tax_code: 'O\u02bbzbekiston Respublikasi Soliq Kodeksi',
  land_code: 'O\u02bbzbekiston Respublikasi Yer Kodeksi',
  admin_code:
    'O\u02bbzbekiston Respublikasi Ma\u2019muriy javobgarlik to\u2018g\u2018risidagi Kodeksi',
  civil_procedure_code: 'O\u02bbzbekiston Respublikasi Fuqarolik protsessual Kodeksi',
  criminal_procedure_code: 'O\u02bbzbekiston Respublikasi Jinoyat-protsessual Kodeksi',
  economic_procedure_code: 'O\u02bbzbekiston Respublikasi Iqtisodiy protsessual Kodeksi',
  constitution: 'O\u02bbzbekiston Respublikasi Konstitutsiyasi',
}

/**
 * Hook: Qonun kodekslarini to'g'ridan-to'g'ri Supabase'dan real-vaqtda yuklaydi.
 *
 * Data flow:
 *   1. Initial load: Supabase browser client orqali categories + articles
 *   2. Realtime: articles jadvalidagi o'zgarishlarni avtomatik qabul qiladi
 *   3. Fallback: Agar Supabase mavjud bo'lmasa, /api/legal/codes API ga so'rov yuboradi
 */
export function useLegalCodes() {
  const [codes, setCodes] = useState<LegalCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromSupabase, setFromSupabase] = useState(false)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  const fetchFromSupabase = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true)
    setError(null)

    try {
      const supabase = browserSupabase

      // 1. Fetch all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('code_id', { ascending: true })

      if (catError) throw new Error(`Kategoriyalarni yuklashda xatolik: ${catError.message}`)
      if (!categories || categories.length === 0) {
        setCodes([])
        setFromSupabase(true)
        setLoading(false)
        return
      }

      // 2. Fetch articles — PARALLEL per code (tezroq).
      //    localStorage'dan cache tekshiriladi — agar yangilangan bo'lsa ishlatiladi.
      const codeIds = categories.map((c: CategoryRow) => c.code_id).filter(Boolean)
      const uniqueIds = [...new Set(codeIds)]
      const PAGE = 1000
      const CACHE_KEY = 'legal_codes_cache'
      const CACHE_TTL = 10 * 60 * 1000 // 10 daqiqa

      // Cache tekshirish
      let cachedCodes: LegalCode[] | null = null
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (
            parsed &&
            parsed.ts &&
            Date.now() - parsed.ts < CACHE_TTL &&
            parsed.codes?.length > 0
          ) {
            cachedCodes = parsed.codes
          }
        }
      } catch {}

      let articles: ArticleRow[] = []

      if (cachedCodes) {
        // Cache bor — to'g'ridan-to'g'ri ishlatamiz (15-20 soniya o'rniga ~0 soniya)
        setCodes(cachedCodes)
        setFromSupabase(true)
        setLoading(false)
        return
      }

      // Cache yo'q — PARALLEL fetch (har bir kodeks alohida, lekin bir vaqtda)
      const fetchCodeArticles = async (codeId: string): Promise<ArticleRow[]> => {
        const all: ArticleRow[] = []
        let from = 0
        for (;;) {
          const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('code_id', codeId)
            .order('article_number_int', { ascending: true, nullsFirst: false })
            .range(from, from + PAGE - 1)
          if (error) {
            // article_number_int mavjud emas — article_number bilan sinab ko'rish
            const { data: fallback } = await supabase
              .from('articles')
              .select('*')
              .eq('code_id', codeId)
              .order('article_number', { ascending: true, nullsFirst: false })
              .range(from, from + PAGE - 1)
            if (!fallback || fallback.length === 0) break
            all.push(...fallback)
            if (fallback.length < PAGE) break
          } else {
            all.push(...(data || []))
            if (!data || data.length < PAGE) break
          }
          from += PAGE
        }
        return all
      }

      // Barcha kodlarni bir vaqtda yuklash (parallel)
      const allResults = await Promise.all(uniqueIds.map(fetchCodeArticles))
      articles = allResults.flat()

      // 3. Merge categories + articles into LegalCode[] format
      const categoryMap = new Map<string, CodeEntry>()
      categories.forEach((cat: CategoryRow) => {
        const existing = categoryMap.get(cat.code_id)
        if (!existing) {
          categoryMap.set(cat.code_id, {
            id: cat.code_id,
            name: CODE_DISPLAY_NAMES_MAP[cat.code_id] || cat.name || '',
            shortName: CODE_DISPLAY_NAMES_MAP[cat.code_id] || cat.name || '',
            description: cat.description || '',
            effectiveDate: '01.01.2024',
            articles: [],
          })
        }
      })

      articles.forEach((article: ArticleRow) => {
        const codeEntry = categoryMap.get(article.code_id || '')
        if (codeEntry) {
          codeEntry.articles.push({
            number: article.article_number || '',
            title: article.title || '',
            content: article.content || '',
            category: article.chapter || 'Umumiy',
            penalties: article.penalties || undefined,
            references:
              Array.isArray(article.cross_references) && article.cross_references.length > 0
                ? article.cross_references
                : Array.isArray(article.references) && article.references.length > 0
                  ? article.references
                  : undefined,
          })
        }
      })

      // NUMERIC SORT: Sort articles by article_number as integer (not string!)
      // This is the PRIMARY sort — it works even without article_number_int column
      Array.from(categoryMap.values()).forEach((entry: CodeEntry) => {
        entry.articles.sort((a: LegalArticle, b: LegalArticle) => {
          const numA = parseInt(a.number, 10) || 0
          const numB = parseInt(b.number, 10) || 0
          return numA - numB
        })
      })

      const mapped: LegalCode[] = Array.from(categoryMap.values()).map((c: CodeEntry) => ({
        ...c,
        totalArticles: c.articles.length,
      }))

      setCodes(mapped)
      setFromSupabase(true)

      // Cache saqlash — keyingi safar tezroq yuklanadi
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ codes: mapped, ts: Date.now() }))
      } catch {}
    } catch (err: unknown) {
      console.warn(
        '[useLegalCodes] Supabase direct fetch failed, trying API fallback:',
        err instanceof Error ? err.message : String(err)
      )

      // Fallback: try API route
      try {
        const res = await fetch('/api/legal/codes', {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        })

        if (res.ok) {
          const result = await res.json()
          if (result.success && result.codes && result.codes.length > 0) {
            const apiCodes: LegalCode[] = result.codes.map(
              (c: {
                id: string
                name: string
                shortName?: string
                description?: string
                effectiveDate?: string
                articles?: LegalArticle[]
              }) => ({
                id: c.id,
                name: c.name,
                shortName: c.shortName || c.name,
                description: c.description || '',
                totalArticles: c.articles?.length || 0,
                effectiveDate: c.effectiveDate || '01.01.2024',
                articles: (c.articles || []).map((a: LegalArticle) => ({
                  number: a.number,
                  title: a.title || '',
                  content: a.content || '',
                  category: a.category || 'Umumiy',
                  penalties: a.penalties || undefined,
                  references:
                    Array.isArray(a.references) && a.references.length > 0
                      ? a.references
                      : undefined,
                })),
              })
            )
            setCodes(apiCodes)
            setFromSupabase(result.source === 'supabase')
            setLoading(false)
            return
          }
        }
      } catch {
        // Both Supabase and API failed
      }

      const errMsg = err instanceof Error ? err.message : String(err)
      if (
        errMsg.includes('Supabase') ||
        errMsg.includes('supabase') ||
        errMsg.includes('not configured')
      ) {
        setError(
          "Supabase bog'lanmadi. .env faylida NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY ni tekshiring."
        )
      } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        setError("Tarmoq xatoligi. Internet ulanishini tekshiring va qayta urinib ko'ring.")
      } else if (errMsg.includes('relation') || errMsg.includes('does not exist')) {
        setError(
          "Ma'lumotlar bazasida jadvallar mavjud emas. Supabase SQL migratsiyani ishga tushiring."
        )
      } else {
        setError(`Ma'lumotlarni yuklashda xatolik: ${errMsg.substring(0, 100)}`)
      }
      setCodes([])
      setFromSupabase(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFromSupabase()
  }, [fetchFromSupabase])

  useEffect(() => {
    if (subscriptionRef.current) {
      browserSupabase.removeChannel(subscriptionRef.current)
    }

    const channel = browserSupabase
      .channel('legal-articles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
        fetchFromSupabase(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchFromSupabase(true)
      })
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      browserSupabase.removeChannel(channel)
    }
  }, [fetchFromSupabase])

  const search = useCallback(
    (query: string) => {
      if (!query.trim()) return []
      const q = query.toLowerCase()
      const results: { code: LegalCode; article: LegalArticle }[] = []
      codes.forEach(code => {
        code.articles.forEach(article => {
          if (
            article.number.toLowerCase().includes(q) ||
            article.title.toLowerCase().includes(q) ||
            article.content.toLowerCase().includes(q) ||
            (article.category || '').toLowerCase().includes(q)
          ) {
            results.push({ code, article })
          }
        })
      })
      return results.slice(0, 30)
    },
    [codes]
  )

  const getCode = useCallback(
    (id: string) => {
      return codes.find(c => c.id === id) || null
    },
    [codes]
  )

  return {
    codes,
    loading,
    error,
    fromSupabase,
    search,
    getCode,
    refresh: fetchFromSupabase,
  }
}
