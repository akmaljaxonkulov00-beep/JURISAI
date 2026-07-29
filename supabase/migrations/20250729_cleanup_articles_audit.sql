-- ================================================================
-- Migration: Legal Articles Audit & Cleanup
-- ================================================================
-- This migration:
-- 1. Shows which categories exist and how many articles each has
-- 2. Shows suspicious articles (wrong code_id)
-- 3. Removes duplicate articles
-- 4. Shows final counts
-- ================================================================

-- ── 1. Show current state ──────────────────────────────────────
SELECT '=== CATEGORIES ===' as info;
SELECT c.code_id, c.name, c.description,
  COUNT(a.id) as article_count
FROM categories c
LEFT JOIN articles a ON a.code_id = c.code_id
GROUP BY c.code_id, c.name, c.description
ORDER BY c.code_id;

-- ── 2. Show suspicious: articles where code_id doesn't match category ──
SELECT '=== SUSPICIOUS ARTICLES (by chapter mismatch) ===' as info;
SELECT a.id, a.code_id, a.article_number, a.title,
  SUBSTRING(a.content, 1, 100) as content_preview
FROM articles a
WHERE (
  -- Criminal code shouldn't have family-related terms
  (a.code_id = 'criminal_code' AND (
    a.title ILIKE '%nikoh%' OR a.title ILIKE '%oila%' OR
    a.title ILIKE '%meros%' OR a.title ILIKE '%sug''urta%' OR
    a.title ILIKE '%soliq%' OR a.title ILIKE '%yer%'
  ))
  OR
  -- Labor code shouldn't have criminal-related terms
  (a.code_id = 'labor_code' AND (
    a.title ILIKE '%jinoyat%' OR a.title ILIKE '%sanksiya%' OR
    a.title ILIKE '%javobgarlik%' OR a.title ILIKE '%jarima%'
  ))
  OR
  -- Family code shouldn't have business-related terms
  (a.code_id = 'family_code' AND (
    a.title ILIKE '%sug''urta%' OR a.title ILIKE '%kredit%' OR
    a.title ILIKE '%soliq%'
  ))
  OR
  -- Civil code shouldn't have criminal-related terms
  (a.code_id = 'civil_code' AND (
    a.title ILIKE '%jazoni%' OR a.title ILIKE '%jinoyat%'
  ))
)
ORDER BY a.code_id, a.article_number;

-- ── 3. Check for duplicate article_numbers within same code_id ──
SELECT '=== DUPLICATE ARTICLE NUMBERS ===' as info;
SELECT code_id, article_number, COUNT(*) as cnt
FROM articles
GROUP BY code_id, article_number
HAVING COUNT(*) > 1
ORDER BY code_id, article_number;

-- ── 4. Remove exact duplicates ─────────────────────────────────
-- Remove articles that have the same code_id, article_number, AND content
-- (keeping only the first one by id)
DELETE FROM articles a1
USING articles a2
WHERE a1.code_id = a2.code_id
  AND a1.article_number = a2.article_number
  AND a1.content = a2.content
  AND a1.id > a2.id;

-- ── 5. Remove articles that belong to codes the user didn't import ──
-- User only imported these TXT files: FK.txt, JK.txt, MK.txt, Mehnat.txt, Oila.txt, Yer.txt
-- These correspond to: civil_code, criminal_code, admin_code, labor_code, family_code, land_code
-- Remove articles for ANY OTHER code_id
DELETE FROM articles
WHERE code_id NOT IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- Also remove orphaned categories (categories with no articles or not in user's 6 codes)
DELETE FROM categories
WHERE code_id NOT IN (
  'civil_code', 'criminal_code', 'admin_code',
  'labor_code', 'family_code', 'land_code'
);

-- ── 6. Fix MK.txt (admin_code) articles that were imported as labor_code ──
-- These are articles in labor_code that have Ma'muriy (administrative) content
-- and DON'T exist in admin_code yet
UPDATE articles a
SET code_id = 'admin_code'
WHERE a.code_id = 'labor_code'
  AND (
    a.title ILIKE '%ma''muriy%' OR
    a.title ILIKE '%jarima%' OR
    a.title ILIKE '%huquqbuzarlik%' OR
    a.title ILIKE '%ma''muriy javobgarlik%'
  )
  AND NOT (
    a.title ILIKE '%mehnat shartnomasi%' OR
    a.title ILIKE '%ish vaqti%' OR
    a.title ILIKE '%ta''til%' OR
    a.title ILIKE '%mehnat daftarchasi%'
  )
  AND a.article_number NOT IN (
    SELECT article_number FROM articles WHERE code_id = 'admin_code'
  );

-- ── 7. Show final state ────────────────────────────────────────
SELECT '=== FINAL CATEGORY COUNTS ===' as info;
SELECT c.code_id, c.name, COUNT(a.id) as article_count
FROM categories c
LEFT JOIN articles a ON a.code_id = c.code_id
GROUP BY c.code_id, c.name, c.description
ORDER BY c.code_id;

SELECT '=== CLEANUP COMPLETE ===' as info;
