-- ============================================================================
-- Fix: MK.txt articles were imported with wrong code_id (labor_code)
-- MK.txt = Ma'muriy javobgarlik kodeksi (admin_code), NOT Mehnat kodeksi
-- 
-- Detection approach:
--   Mehnat kodeksi articles contain labor-related terms like "mehnat",
--   "ish beruvchi", "ish haqi", "ta'til"
--   Ma'muriy kodeksi articles contain administrative terms like "ma'muriy",
--   "jarima", "huquqbuzarlik"
--
-- We identify MK.txt articles by looking for administrative code patterns
-- in their content (articles that mention "ma'muriy" but NOT "mehnat")
-- and move them from labor_code to admin_code.
-- ============================================================================

-- 1. Create admin_code category if it doesn't exist
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

-- 2. Find articles that belong to admin_code (Ma'muriy Kodeks)
-- These are articles in labor_code that mention "ma'muriy" or "jarima"
-- but NOT "mehnat" (to avoid catching actual mehnat kodeksi articles)
UPDATE articles
SET code_id = 'admin_code'
WHERE code_id = 'labor_code'
AND (
  -- Content mentions administrative code patterns
  content ILIKE '%ma''muriy%jarima%'
  OR content ILIKE '%ma''muriy%huquqbuzarlik%'
  OR content ILIKE '%ma''muriy%jazo%'
  OR title ILIKE '%ma''muriy%'
  OR title ILIKE '%jarima%'
  -- Administrative code-specific article patterns
  OR (content ILIKE '%huquqbuzarlik%' AND NOT content ILIKE '%mehnat%')
  OR (content ILIKE '%jarima%' AND NOT content ILIKE '%mehnat%')
  OR (content ILIKE '%ma''muriy%' AND content ILIKE '%kodeks%')
)
-- Double-check: exclude articles that ARE actually labor code
AND NOT (
  content ILIKE '%mehnat shartnomasi%'
  OR content ILIKE '%ish vaqti%'
  OR content ILIKE '%ta''til%'
  OR content ILIKE '%ish haqi%'
  OR content ILIKE '%ish staji%'
);

-- 3. Update category article counts
UPDATE categories
SET article_count = (SELECT COUNT(*) FROM articles WHERE code_id = 'admin_code')
WHERE code_id = 'admin_code';

UPDATE categories
SET article_count = (SELECT COUNT(*) FROM articles WHERE code_id = 'labor_code')
WHERE code_id = 'labor_code';
