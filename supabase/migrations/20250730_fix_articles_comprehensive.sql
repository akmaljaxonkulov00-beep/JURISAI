-- ================================================================
-- Migration: Fix mixed-up articles between legal codes
-- ================================================================
-- PROBLEM: Articles from different TXT files got mixed up during import.
-- Specifically:
--   MK.txt (Ma'muriy kodeks) → imported as labor_code (wrong)
--   Some articles appear in wrong categories
--
-- FIX: This migration:
--   1. Shows current state of ALL codes and article counts
--   2. Identifies which articles belong to which codes by content
--   3. Removes duplicate articles
--   4. Moves articles to correct code_id
--   5. Shows final state
-- ================================================================

-- ── STEP 1: SHOW CURRENT STATE ─────────────────────────────────
SELECT '=== CURRENT STATE BEFORE FIX ===' as phase;
SELECT 
  COALESCE(c.code_id, a.code_id) as code_id,
  COALESCE(c.name, 'NO CATEGORY') as category_name,
  COUNT(a.id) as article_count
FROM articles a
LEFT JOIN categories c ON c.code_id = a.code_id
GROUP BY COALESCE(c.code_id, a.code_id), COALESCE(c.name, 'NO CATEGORY')
ORDER BY code_id;

-- ── STEP 2: REMOVE EXACT DUPLICATES ────────────────────────────
-- Remove articles with same code_id, article_number AND content
DELETE FROM articles a1
USING articles a2
WHERE a1.id > a2.id
  AND a1.code_id = a2.code_id
  AND a1.article_number = a2.article_number
  AND a1.content = a2.content;

-- ── STEP 3: FIX MK.txt ARTICLES IMPORTED AS labor_code ─────────
-- MK.txt = Ma'muriy javobgarlik kodeksi → admin_code
-- Mehnat.txt = Mehnat kodeksi → labor_code
--
-- Strategy: Articles in labor_code that contain administrative content
-- belong to admin_code. Articles containing labor content stay.

-- 3a: Delete MK articles from labor_code if they already exist in admin_code
DELETE FROM articles
WHERE code_id = 'labor_code'
  AND article_number IN (
    SELECT article_number FROM articles WHERE code_id = 'admin_code'
  )
  AND (
    content ILIKE '%ma''muriy%'
    OR content ILIKE '%jarima%'
    OR content ILIKE '%huquqbuzarlik%'
  );

-- 3b: Move remaining MK articles from labor_code to admin_code
UPDATE articles
SET code_id = 'admin_code'
WHERE code_id = 'labor_code'
  AND (
    content ILIKE '%ma''muriy%jarima%'
    OR content ILIKE '%ma''muriy%huquqbuzarlik%'
    OR content ILIKE '%ma''muriy%jazo%'
    OR title ILIKE '%ma''muriy%'
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
    OR content ILIKE '%ish joyi%'
    OR content ILIKE '%mehnat daftarchasi%'
  );

-- ── STEP 4: REMOVE ARTICLES FOR CODES NOT IN USER'S 6 FILES ───
-- User only imported: FK.txt (civil_code), JK.txt (criminal_code),
-- MK.txt (admin_code), Mehnat.txt (labor_code), Oila.txt (family_code),
-- Yer.txt (land_code)
DELETE FROM articles
WHERE code_id NOT IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- Remove orphaned categories
DELETE FROM categories
WHERE code_id NOT IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- ── STEP 5: ENSURE admin_code CATEGORY EXISTS ──────────────────
INSERT INTO categories (code_id, name, description, icon, color)
VALUES (
  'admin_code',
  'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi',
  'Maʼmuriy javobgarlik toʻgʻrisidagi kodeks',
  'shield',
  'from-slate-500 to-gray-600'
)
ON CONFLICT (code_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description
WHERE categories.name IS NULL OR categories.name = '';

-- ── STEP 6: ENSURE article_count COLUMN EXISTS ─────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS article_count INTEGER DEFAULT 0;

-- ── STEP 7: UPDATE CATEGORY ARTICLE COUNTS ─────────────────────
UPDATE categories c
SET article_count = (
  SELECT COUNT(*) FROM articles a WHERE a.code_id = c.code_id
)
WHERE c.code_id IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- ── STEP 7: SHOW FINAL STATE ───────────────────────────────────
SELECT '=== FINAL STATE AFTER FIX ===' as phase;
SELECT 
  c.code_id,
  c.name as category_name,
  COUNT(a.id) as article_count
FROM categories c
LEFT JOIN articles a ON a.code_id = c.code_id
WHERE c.code_id IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
)
GROUP BY c.code_id, c.name
ORDER BY c.code_id;

SELECT '=== FIX COMPLETE ===' as status;
