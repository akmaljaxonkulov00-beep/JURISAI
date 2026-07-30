'use client'

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
  const subscriptionRef = useRef<any>(null)

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

      // 2. Fetch articles — try article_number_int first (numeric sort), fall back to article_number (text)
      const codeIds = categories.map((c: any) => c.code_id).filter(Boolean)
      const uniqueIds = [...new Set(codeIds)]

      let result = await supabase
        .from('articles')
        .select('*')
        .in('code_id', uniqueIds)
        .order('article_number_int', { ascending: true, nullsFirst: false })

      // If article_number_int column doesn't exist, try article_number instead
      if (result.error) {
        result = await supabase
          .from('articles')
          .select('*')
          .in('code_id', uniqueIds)
          .order('article_number', { ascending: true })
      }

      if (result.error) throw new Error(`Moddalarni yuklashda xatolik: ${result.error.message}`)
      const articles = result.data || []

      // 3. Merge categories + articles into LegalCode[] format
      const categoryMap = new Map<string, any>()
      categories.forEach((cat: any) => {
        const existing = categoryMap.get(cat.code_id)
        if (!existing) {
          categoryMap.set(cat.code_id, {
            id: cat.code_id,
            name: CODE_DISPLAY_NAMES_MAP[cat.code_id] || cat.name,
            shortName: CODE_DISPLAY_NAMES_MAP[cat.code_id] || cat.name,
            description: cat.description || '',
            effectiveDate: '01.01.2024',
            articles: [],
          })
        }
      })

      articles.forEach((article: any) => {
        const codeEntry = categoryMap.get(article.code_id)
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
      Array.from(categoryMap.values()).forEach((entry: any) => {
        entry.articles.sort((a: LegalArticle, b: LegalArticle) => {
          const numA = parseInt(a.number, 10) || 0
          const numB = parseInt(b.number, 10) || 0
          return numA - numB
        })
      })

      const mapped: LegalCode[] = Array.from(categoryMap.values()).map((c: any) => ({
        ...c,
        totalArticles: c.articles.length,
      }))

      setCodes(mapped)
      setFromSupabase(true)
    } catch (err: any) {
      console.warn('[useLegalCodes] Supabase direct fetch failed, trying API fallback:', err.message)

      // Fallback: try API route
      try {
        const res = await fetch('/api/legal/codes', {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        })

        if (res.ok) {
          const result = await res.json()
          if (result.success && result.codes && result.codes.length > 0) {
            const apiCodes: LegalCode[] = result.codes.map((c: any) => ({
              id: c.id,
              name: c.name,
              shortName: c.shortName || c.name,
              description: c.description || '',
              totalArticles: c.articles?.length || 0,
              effectiveDate: c.effectiveDate || '01.01.2024',
              articles: (c.articles || []).map((a: any) => ({
                number: a.number,
                title: a.title || '',
                content: a.content || '',
                category: a.category || 'Umumiy',
                penalties: a.penalties || undefined,
                references:
                  Array.isArray(a.references) && a.references.length > 0 ? a.references : undefined,
              })),
            }))
            setCodes(apiCodes)
            setFromSupabase(result.source === 'supabase')
            setLoading(false)
            return
          }
        }
      } catch {
        // Both Supabase and API failed
      }

      const errMsg = err?.message || ''
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
