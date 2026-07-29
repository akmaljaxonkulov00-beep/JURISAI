-- ============================================================================
-- Migration: Clear Legal Database (Articles & Categories)
-- Date: 2025-07-31
--
-- PURPOSE:
--   Completely removes ALL articles and categories from the legal database
--   so the user can re-import them from clean source files without any
--   mixing or duplication issues.
--
--   This is a FULL RESET. After running this, the legal database will be
--   empty. You must re-import data using the import script.
--
-- USAGE:
--   1. Run this in Supabase Dashboard → SQL Editor
--   2. Then re-import using:
--      node scripts/import-legal-to-supabase.js "C:\path\to\your\files"
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: DELETE ALL ARTICLES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 1: Deleting all articles ═══' as phase;
SELECT COUNT(*) as articles_before FROM articles;

DELETE FROM articles;

SELECT COUNT(*) as articles_after FROM articles;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2: DELETE ALL CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 2: Deleting all categories ═══' as phase;
SELECT COUNT(*) as categories_before FROM categories;

DELETE FROM categories;

SELECT COUNT(*) as categories_after FROM categories;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: VERIFY EMPTY
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 3: Verification ═══' as phase;

SELECT 'articles' as table_name, COUNT(*) as count FROM articles
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories;

SELECT '═══ DATABASE CLEARED ═══' as status;
SELECT 'The legal database is now empty. Ready for clean re-import.' as info;
SELECT '' as info;
SELECT 'To re-import, use:' as info;
SELECT '  node scripts/import-legal-to-supabase.js "C:\\path\\to\\your\\files\\folder"' as info;
