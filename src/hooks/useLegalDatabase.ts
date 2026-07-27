'use client';

import { useState, useEffect, useCallback } from 'react';
import { LegalCode, LegalArticle } from '@/data/legal-codes';
import { getDisplayNameFromCodeId } from '@/lib/utils/code-mapper';

export type { LegalCode, LegalArticle };

/** CODE_DISPLAY_NAMES — yagona manbadan (code-mapper.ts) olinadi */
export { getDisplayNameFromCodeId as CODE_DISPLAY_NAMES };

/**
 * Qonun kodekslarini yuklovchi hook
 * 
 * Supabase'dan haqiqiy ma'lumotlarni yuklaydi.
 * HEECH QACHON hardcoded/data fayllariga tayanmaydi.
 * Agar Supabase mavjud bo'lmasa, bo'sh array qaytaradi va xatolikni ko'rsatadi.
 */
export function useLegalCodes() {
  const [codes, setCodes] = useState<LegalCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromSupabase, setFromSupabase] = useState(false);

  const fetchFromSupabase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Call server-side API route (uses service_role key, bypass RLS)
      const res = await fetch('/api/legal/codes', {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      
      if (!res.ok) {
        throw new Error(`API javob bermadi (${res.status})`);
      }
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API xatolik qaytardi');
      }
      
      if (!result.codes || result.codes.length === 0) {
        setCodes([]);
        setFromSupabase(true); // Supabase mavjud, lekin ma'lumot yo'q
        return;
      }
      
      if (result.total_articles === 0) {
        setCodes([]);
        setFromSupabase(true);
        return;
      }

      // Convert API response to LegalCode format
      const mapped: LegalCode[] = result.codes.map((c: any) => ({
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
          references: Array.isArray(a.references) && a.references.length > 0
            ? a.references
            : undefined,
        })),
      }));

      setCodes(mapped);
      setFromSupabase(true);
    } catch (err: any) {
      console.error('Supabase fetch failed:', err.message);
      setError(err.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi');
      setCodes([]);
      setFromSupabase(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const search = useCallback((query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: { code: LegalCode; article: LegalArticle }[] = [];
    codes.forEach(code => {
      code.articles.forEach(article => {
        if (
          article.number.toLowerCase().includes(q) ||
          article.title.toLowerCase().includes(q) ||
          article.content.toLowerCase().includes(q) ||
          (article.category || '').toLowerCase().includes(q)
        ) {
          results.push({ code, article });
        }
      });
    });
    return results.slice(0, 30);
  }, [codes]);

  const getCode = useCallback((id: string) => {
    return codes.find(c => c.id === id) || null;
  }, [codes]);

  return {
    codes,
    loading,
    error,
    fromSupabase,
    search,
    getCode,
    refresh: fetchFromSupabase,
  };
}
