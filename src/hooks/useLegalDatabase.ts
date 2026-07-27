'use client';

import { useState, useEffect, useCallback } from 'react';
import { ALL_LEGAL_CODES, LegalCode, LegalArticle } from '@/data/legal-codes';
import { getDisplayNameFromCodeId } from '@/lib/utils/code-mapper';

export type { LegalCode, LegalArticle };

/** CODE_DISPLAY_NAMES — yagona manbadan (code-mapper.ts) olinadi */
export { getDisplayNameFromCodeId as CODE_DISPLAY_NAMES };

/**
 * Qonun kodekslarini yuklovchi hook
 * 
 * 1. Supabase'dan yuklashga urinadi
 * 2. Agar muvaffaqiyatsiz bo'lsa, hardcoded ma'lumotlardan foydalanadi
 */
export function useLegalCodes() {
  const [codes, setCodes] = useState<LegalCode[]>(ALL_LEGAL_CODES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromSupabase, setFromSupabase] = useState(false);

  const fetchFromSupabase = useCallback(async () => {
    try {
      let supabase: any = null;
      try {
        const mod = await import('@/lib/supabase');
        supabase = mod.supabase;
      } catch {
        throw new Error('Supabase not available');
      }

      // Fetch categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('code_id');

      if (catError) throw catError;
      if (!categories || categories.length === 0) throw new Error('No categories found');

      // Fetch all articles
      const { data: articles, error: artError } = await supabase
        .from('articles')
        .select('*')
        .order('article_number');

      if (artError) throw artError;

      // Map to LegalCode format
      const mapped: LegalCode[] = categories.map((cat: any) => {
        const codeArticles: LegalArticle[] = (articles || [])
          .filter((a: any) => a.code_id === cat.code_id)
          .map((a: any) => ({
            number: a.article_number,
            title: a.title,
            content: a.content,
            category: a.chapter || 'Umumiy',
            penalties: a.penalties || undefined,
            references: Array.isArray(a.references) && a.references.length > 0
              ? a.references
              : undefined,
          }));

        const displayName = getDisplayNameFromCodeId(cat.code_id);
        return {
          id: cat.code_id,
          name: displayName,
          shortName: displayName,
          description: cat.description || '',
          totalArticles: codeArticles.length || cat.article_count || 0,
          effectiveDate: '01.01.2024',
          articles: codeArticles.length > 0 ? codeArticles : [],
        };
      });

      // Only use Supabase data if we got at least SOME articles
      const totalArticles = mapped.reduce((sum, c) => sum + c.articles.length, 0);
      if (totalArticles > 0) {
        setCodes(mapped);
        setFromSupabase(true);
      } else {
        throw new Error('No articles found in Supabase');
      }
    } catch (err: any) {
      console.warn('Supabase fetch failed, using hardcoded data:', err.message);
      // Fallback: hardcoded data from legal-codes.ts
      setCodes(ALL_LEGAL_CODES);
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
