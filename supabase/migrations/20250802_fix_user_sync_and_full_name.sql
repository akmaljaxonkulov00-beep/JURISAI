-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix Article Sorting + Add full_name Column + Backfill Users
-- ═══════════════════════════════════════════════════════════════════════════

-- ── PHASE 0: Add full_name column to registered_users ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE registered_users ADD COLUMN full_name TEXT DEFAULT '';
  END IF;
END $$;

-- Copy existing name data to full_name if name is not empty
UPDATE registered_users
SET full_name = name
WHERE name IS NOT NULL AND name != '' AND (full_name IS NULL OR full_name = '');

-- ── PHASE 1: Add article_number_int column (if not exists) ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'article_number_int'
  ) THEN
    ALTER TABLE articles ADD COLUMN article_number_int INTEGER;
  END IF;
END $$;

-- Populate article_number_int from article_number (TEXT → INTEGER)
UPDATE articles
SET article_number_int = CASE
  WHEN article_number ~ '^\d+$' THEN article_number::INTEGER
  ELSE 0
END
WHERE article_number_int IS NULL;

-- ── PHASE 2: Add is_active column to registered_users (if not exists) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE registered_users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ── PHASE 3: Backfill auth.users → registered_users ──────────────────
INSERT INTO public.registered_users (
  id, email, full_name, name, role, is_active, created_at
)
SELECT
  au.id::TEXT,
  COALESCE(au.raw_user_meta_data->>'email', au.email, ''),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    'User'
  ),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    'User'
  ),
  CASE
    WHEN LOWER(COALESCE(au.raw_user_meta_data->>'email', au.email, '')) = 'akmaljaxonkulov00@gmail.com'
    THEN 'ADMIN'
    ELSE 'USER'
  END,
  true,
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.registered_users ru WHERE ru.id = au.id::TEXT
);

-- Update existing users (sync names, etc.)
UPDATE public.registered_users ru
SET
  full_name = COALESCE(
    (SELECT COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'display_name', ru.full_name)
     FROM auth.users au WHERE au.id::TEXT = ru.id),
    ru.full_name
  ),
  name = COALESCE(
    (SELECT COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'display_name', ru.name)
     FROM auth.users au WHERE au.id::TEXT = ru.id),
    ru.name
  ),
  email = COALESCE(
    (SELECT COALESCE(au.raw_user_meta_data->>'email', au.email, ru.email)
     FROM auth.users au WHERE au.id::TEXT = ru.id),
    ru.email
  ),
  role = CASE
    WHEN LOWER(ru.email) = 'akmaljaxonkulov00@gmail.com' THEN 'ADMIN'
    ELSE ru.role
  END,
  is_active = true,
  updated_at = NOW()
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id::TEXT = ru.id);

-- ── PHASE 4: Ensure sync trigger exists ──────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_registered()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.registered_users (id, email, full_name, name, role, is_active, created_at)
  VALUES (
    NEW.id::TEXT,
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      'User'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      'User'
    ),
    CASE
      WHEN LOWER(COALESCE(NEW.raw_user_meta_data->>'email', NEW.email, '')) = 'akmaljaxonkulov00@gmail.com'
      THEN 'ADMIN'
      ELSE 'USER'
    END,
    true,
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name,
    is_active = true,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_registered();

-- ── PHASE 5: Fix RLS policies to allow admin reads ───────────────────
ALTER TABLE public.registered_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- ── PHASE 6: Verify ──────────────────────────────────────────────────
DO $$
DECLARE
  art_count INTEGER;
  user_count INTEGER;
  cat_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO art_count FROM public.articles;
  SELECT COUNT(*) INTO user_count FROM public.registered_users;
  SELECT COUNT(*) INTO cat_count FROM public.categories;
  RAISE NOTICE 'Articles: %, Users: %, Categories: %', art_count, user_count, cat_count;
END $$;

-- Show results
SELECT 'articles' as tbl, COUNT(*) as cnt,
  CASE WHEN bool_and(article_number_int IS NOT NULL) THEN 'ALL HAVE INT' ELSE 'SOME MISSING INT' END as int_status
FROM articles;
SELECT code_id, COUNT(*) as articles FROM articles GROUP BY code_id ORDER BY code_id;
SELECT 'registered_users' as tbl, COUNT(*) as cnt FROM registered_users;
SELECT role, COUNT(*) FROM registered_users GROUP BY role;
