-- ============================================================================
-- Fix: MK.txt articles were imported with wrong code_id (labor_code)
-- MK.txt = Ma'muriy javobgarlik kodeksi (admin_code), NOT Mehnat kodeksi
-- 
-- Some articles were imported TWICE:
--   1. First as labor_code (wrong — the original bug)
--   2. Later as admin_code (correct — after a re-import)
--
-- Strategy:
--   1. DELETE labor_code articles that have duplicates in admin_code
--      (keep the correctly-imported admin_code version)
--   2. UPDATE remaining (non-duplicate) labor_code articles to admin_code
--   3. Create admin_code category + update counts
--
-- NOTE: No CTEs used — PostgreSQL scopes CTEs to a single statement.
-- Each statement here is fully self-contained.
-- ============================================================================

-- ── 1. DELETE duplicates that already exist in admin_code ──────────────
DELETE FROM articles
WHERE code_id = 'labor_code'
AND (
  content ILIKE '%ma''muriy%jarima%'
  OR content ILIKE '%ma''muriy%huquqbuzarlik%'
  OR content ILIKE '%ma''muriy%jazo%'
  OR title ILIKE '%ma''muriy%'
  OR title ILIKE '%jarima%'
  OR (content ILIKE '%huquqbuzarlik%' AND NOT content ILIKE '%mehnat%')
  OR (content ILIKE '%jarima%' AND NOT content ILIKE '%mehnat%')
  OR (content ILIKE '%ma''muriy%' AND content ILIKE '%kodeks%')
)
AND NOT (
  content ILIKE '%mehnat shartnomasi%'
  OR content ILIKE '%ish vaqti%'
  OR content ILIKE '%ta''til%'
  OR content ILIKE '%ish haqi%'
  OR content ILIKE '%ish staji%'
)
AND article_number IN (
  SELECT article_number FROM articles WHERE code_id = 'admin_code'
);

-- ── 2. UPDATE remaining (non-duplicate) to admin_code ──────────────────
UPDATE articles
SET code_id = 'admin_code'
WHERE code_id = 'labor_code'
AND (
  content ILIKE '%ma''muriy%jarima%'
  OR content ILIKE '%ma''muriy%huquqbuzarlik%'
  OR content ILIKE '%ma''muriy%jazo%'
  OR title ILIKE '%ma''muriy%'
  OR title ILIKE '%jarima%'
  OR (content ILIKE '%huquqbuzarlik%' AND NOT content ILIKE '%mehnat%')
  OR (content ILIKE '%jarima%' AND NOT content ILIKE '%mehnat%')
  OR (content ILIKE '%ma''muriy%' AND content ILIKE '%kodeks%')
)
AND NOT (
  content ILIKE '%mehnat shartnomasi%'
  OR content ILIKE '%ish vaqti%'
  OR content ILIKE '%ta''til%'
  OR content ILIKE '%ish haqi%'
  OR content ILIKE '%ish staji%'
)
AND article_number NOT IN (
  SELECT article_number FROM articles WHERE code_id = 'admin_code'
);

-- ── 3. Create admin_code category if it doesn't exist ──────────────────
INSERT INTO categories (code_id, name, description, icon, color, article_count)
VALUES (
  'admin_code',
  'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi',
  'Maʼmuriy javobgarlik toʻgʻrisidagi kodeks',
  'shield',
  'from-slate-500 to-gray-600',
  0
)
ON CONFLICT (code_id) DO NOTHING;

-- ── 4. Update category article counts ──────────────────────────────────
UPDATE categories
SET article_count = (SELECT COUNT(*) FROM articles WHERE code_id = 'admin_code')
WHERE code_id = 'admin_code';

UPDATE categories
SET article_count = (SELECT COUNT(*) FROM articles WHERE code_id = 'labor_code')
WHERE code_id = 'labor_code';
