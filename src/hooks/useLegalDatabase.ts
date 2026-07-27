'use client';

import { useState, useEffect, useCallback } from 'react';
import { ALL_LEGAL_CODES, LegalCode, LegalArticle, CODE_DISPLAY_NAMES } from '@/data/legal-codes';

export type { LegalCode, LegalArticle };

export function useLegalCodes() {
  const [codes, setCodes] = useState<LegalCode[]>(ALL_LEGAL_CODES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromSupabase, setFromSupabase] = useState(false);

  const fetchFromSupabase = useCallback(async () => {
    try {
      // Try dynamic import of Supabase (may not be configured)
      const supabaseMod = await import('@/lib/supabase').catch(() => null);
      if (!supabaseMod?.supabase) throw new Error('Supabase not available');

      const { supabase } = supabaseMod;

      // Fetch categories (legal codes)
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;
      if (!categories || categories.length === 0) throw new Error('No categories found');

      // Fetch all articles
      const { data: articles, error: artError } = await supabase
        .from('articles')
        .select('*')
        .order('article_number');

      if (artError) throw artError;

      // Map Supabase data back to LegalCode format
      const mapped: LegalCode[] = categories.map((cat: any) => {
        const codeArticles: LegalArticle[] = (articles || [])
          .filter((a: any) => a.code_id === cat.id)
          .map((a: any) => ({
            number: a.article_number,
            title: a.title,
            content: a.content,
            category: a.category || 'Umumiy',
            penalties: a.penalties || undefined,
            references: Array.isArray(a.references) ? a.references : undefined,
          }));

        // Find matching hardcoded code for metadata
        const hardcoded = ALL_LEGAL_CODES.find(c => c.id === cat.id);
        return {
          id: cat.id,
          name: CODE_DISPLAY_NAMES[cat.id] || cat.name,
          shortName: CODE_DISPLAY_NAMES[cat.id] || cat.name,
          description: cat.description || hardcoded?.description || '',
          totalArticles: codeArticles.length || hardcoded?.totalArticles || 0,
          effectiveDate: hardcoded?.effectiveDate || '01.01.2024',
          articles: codeArticles.length > 0 ? codeArticles : (hardcoded?.articles || []),
        };
      });

      if (mapped.length > 0) {
        setCodes(mapped);
        setFromSupabase(true);
      }
    } catch (err: any) {
      console.warn('Supabase legal database fetch failed, using hardcoded data:', err.message);
      // Fallback to hardcoded data is already set in initial state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  // Search function
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
          article.category?.toLowerCase().includes(q)
        ) {
          results.push({ code, article });
        }
      });
    });
    return results.slice(0, 30);
  }, [codes]);

  // Get code by ID
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

export { CODE_DISPLAY_NAMES };
