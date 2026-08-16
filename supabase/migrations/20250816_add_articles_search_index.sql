-- ============================================================================
-- 20250816_add_articles_search_index.sql
--
-- `articles` jadvali uchun to'liq matn (full-text) qidiruv indeksi.
--
-- Nima uchun:
--   - Qonunlar bazasidagi qidiruv hozir faqat ILIKE '%...%' ishlatadi — bu
--     katta jadvalda sekin ishlaydi.
--   - Bu migratsiya tsvector ustuni + GIN indeks yaratadi, /api/legal/search
--     esa tez indekslangan qidiruvga o'tadi (ILIIKE fallback bilan).
--
-- O'zbekcha so'zlar uchun:
--   - 'simple' konfiguratsiya ishlatiladi (rasmiy o'zbekcha tsvector config
--     yo'q) va apostrof variantlari (‘ ’ ʻ ` ') matndan olib tashlanadi.
--     Shunda "O'g'irlik" bitta token "Ogirlik" bo'lib qoladi va foydalanuvchi
--     "o'g'irlik" yoki "ogirlik" deb qidirsa ham mos tushadi.
--
-- Idempotent — qayta run qilinsa ham xavfsiz.
-- ============================================================================

-- 1) Apostroflarni olib tashlagan holda tsvector hisoblovchi generated ustun
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'articles'
      AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.articles
      ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector(
          'simple',
          translate(coalesce(title, ''), '‘’ʻ`''', '') || ' ' ||
          translate(coalesce(content, ''), '‘’ʻ`''', '')
        )
      ) STORED;
  END IF;
END $$;

-- 2) GIN indeks — to'liq matn qidiruvini tezlashtiradi
CREATE INDEX IF NOT EXISTS articles_search_vector_idx
  ON public.articles USING GIN (search_vector);

-- 3) Raqamli qidiruv uchun qo'shimcha indekslar (mavjud bo'lmasa)
CREATE INDEX IF NOT EXISTS idx_articles_article_number
  ON public.articles (article_number);

CREATE INDEX IF NOT EXISTS idx_articles_code_id_article_number
  ON public.articles (code_id, article_number);
