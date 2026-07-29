-- ============================================================================
-- Migration: Fix Legal Database — Article-Code Assignment Cleanup
-- Date: 2025-07-30
--
-- PROBLEM:
--   Articles from different TXT files got mixed up during import:
--   1. MK.txt (Ma'muriy javobgarlik kodeksi → admin_code) was imported
--      with labor_code code_id by mistake
--   2. Extra codes (tax_code, constitution, etc.) that the user didn't
--      import also have entries
--   3. Duplicate articles from multiple import runs
--
-- FIX:
--   1. Reports current state
--   2. Removes articles for codes NOT in the user's 6 source TXT files
--      (civil_code, criminal_code, admin_code, labor_code,
--       family_code, land_code)
--   3. Removes orphaned categories
--   4. Fixes MK.txt articles: moves admin-related content from labor_code
--      to admin_code, removes duplicates
--   5. Updates article counts
--   6. Reports final state
--
-- USAGE: Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 0: REPORT CURRENT STATE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 0: CURRENT STATE ═══' as phase;

SELECT 
  COALESCE(c.code_id, a.code_id) as code_id,
  COALESCE(c.name, 'NO CATEGORY') as category_name,
  COUNT(a.id) as article_count
FROM articles a
LEFT JOIN categories c ON c.code_id = a.code_id
GROUP BY COALESCE(c.code_id, a.code_id), COALESCE(c.name, 'NO CATEGORY')
ORDER BY code_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: REMOVE ARTICLES FOR CODES NOT IN USER'S 6 SOURCE FILES
-- ═══════════════════════════════════════════════════════════════════════════
-- User's source files: FK.txt, JK.txt, MK.txt, Mehnat.txt, Oila.txt, Yer.txt
-- Corresponding code_ids: civil_code, criminal_code, admin_code,
--                          labor_code, family_code, land_code

SELECT '═══ PHASE 1: Removing unwanted codes ═══' as phase;

DELETE FROM articles
WHERE code_id NOT IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- Remove orphaned categories (categories with no articles)
DELETE FROM categories
WHERE code_id NOT IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2: REMOVE EXACT DUPLICATES
-- ═══════════════════════════════════════════════════════════════════════════
-- Remove rows with same code_id, article_number AND content (keep oldest)

SELECT '═══ PHASE 2: Removing exact duplicates ═══' as phase;

DELETE FROM articles a1
USING articles a2
WHERE a1.id > a2.id
  AND a1.code_id = a2.code_id
  AND a1.article_number = a2.article_number
  AND a1.content = a2.content;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: FIX MK.txt (admin_code) ARTICLES IMPORTED AS labor_code
-- ═══════════════════════════════════════════════════════════════════════════
-- MK.txt = Ma'muriy javobgarlik kodeksi → admin_code
-- Mehnat.txt = Mehnat kodeksi → labor_code
--
-- Strategy:
--   Articles in labor_code whose article_number already exists in admin_code
--   → DELETE (duplicate of correct admin_code article)
--   Articles in labor_code with admin-related content that DON'T exist in
--   admin_code → MOVE to admin_code
--   Articles in labor_code with labor-related content → KEEP in labor_code

SELECT '═══ PHASE 3: Fixing MK.txt → admin_code assignment ═══' as phase;

-- 3a: DELETE labor_code articles that are duplicates of admin_code articles
DELETE FROM articles
WHERE code_id = 'labor_code'
  AND article_number IN (
    SELECT article_number FROM articles WHERE code_id = 'admin_code'
  )
  AND (
    content ILIKE '%ma''muriy%'
    OR content ILIKE '%jarima%'
    OR content ILIKE '%huquqbuzarlik%'
    OR title ILIKE '%ma''muriy%'
    OR title ILIKE '%jarima%'
  );

-- 3b: MOVE remaining admin-related articles from labor_code to admin_code
-- These are articles that DON'T have labor-related content
UPDATE articles
SET code_id = 'admin_code'
WHERE code_id = 'labor_code'
  AND (
    -- Has admin keywords
    content ILIKE '%ma''muriy%jarima%'
    OR content ILIKE '%ma''muriy%huquqbuzarlik%'
    OR content ILIKE '%ma''muriy%jazo%'
    OR title ILIKE '%ma''muriy%'
    OR (content ILIKE '%huquqbuzarlik%' AND NOT content ILIKE '%mehnat%')
    OR (content ILIKE '%jarima%' AND NOT content ILIKE '%mehnat%')
  )
  AND NOT (
    -- Does NOT have labor keywords
    content ILIKE '%mehnat shartnomasi%'
    OR content ILIKE '%ish vaqti%'
    OR content ILIKE '%ta''til%'
    OR content ILIKE '%ish haqi%'
    OR content ILIKE '%ish staji%'
    OR content ILIKE '%ish joyi%'
    OR content ILIKE '%mehnat daftarchasi%'
    OR content ILIKE '%ish beruvchi%'
    OR content ILIKE '%xodim%'
    OR title ILIKE '%mehnat%'
    OR title ILIKE '%xodim%'
    OR title ILIKE '%ish haqi%'
    OR title ILIKE '%ta''til%'
  )
  AND article_number NOT IN (
    -- Don't move if it would create a duplicate
    SELECT article_number FROM articles WHERE code_id = 'admin_code'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4: REMOVE DUPLICATE article_numbers WITHIN SAME code_id
-- (Where content differs — keep the longest/most complete version)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 4: Removing same-number duplicates ═══' as phase;

DELETE FROM articles a1
USING articles a2
WHERE a1.id > a2.id
  AND a1.code_id = a2.code_id
  AND a1.article_number = a2.article_number
  AND LENGTH(a1.content) <= LENGTH(a2.content);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 5: ENSURE admin_code CATEGORY EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 5: Ensuring admin_code category exists ═══' as phase;

INSERT INTO categories (code_id, name, description, icon, color)
VALUES (
  'admin_code',
  'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi',
  'Maʼmuriy javobgarlik toʻgʻrisidagi kodeks. Huquqbuzarliklar va ular uchun javobgarlikni belgilaydi.',
  'shield',
  'from-slate-500 to-gray-600'
)
ON CONFLICT (code_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color
WHERE categories.name IS NULL OR categories.name = '';

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 6: ENSURE ARTICLE_COUNT COLUMN EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 6: Ensuring article_count column ═══' as phase;

-- Add article_count column if it doesn't exist (it's used by the hook)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'article_count'
  ) THEN
    ALTER TABLE categories ADD COLUMN article_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 7: UPDATE ARTICLE COUNTS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 7: Updating article counts ═══' as phase;

UPDATE categories c
SET article_count = (
  SELECT COUNT(*) FROM articles a WHERE a.code_id = c.code_id
)
WHERE c.code_id IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 8: REPORT FINAL STATE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 8: FINAL STATE ═══' as phase;

SELECT 
  c.code_id,
  c.name as category_name,
  c.article_count as article_count
FROM categories c
WHERE c.code_id IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
)
ORDER BY c.code_id;

SELECT '═══ FIX COMPLETE ═══' as status;

-- Summary
SELECT 
  COUNT(*) as total_articles,
  COUNT(DISTINCT code_id) as total_codes
FROM articles
WHERE code_id IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);
