-- ============================================================================
-- Migration: Restore All Known Users to registered_users
-- Date: 2025-07-31
--
-- PROBLEM:
--   Admin panel only shows 1-2 users. Previously 4+ users were visible.
--   Some users registered via Firebase Auth (before Supabase migration)
--   and their data never made it to the registered_users table.
--
-- FIX:
--   1. Backfill ALL auth.users into registered_users (aggressive upsert)
--   2. Force the auto-sync trigger to be active
--   3. If RLS blocks, use service_role bypass
--   4. Show final state
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 0: SHOW CURRENT STATE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 0: CURRENT STATE ═══' as phase;
SELECT 'registered_users table:' as source;
SELECT COUNT(*) as count FROM public.registered_users;

SELECT 'auth.users table:' as source;
SELECT COUNT(*) as count FROM auth.users;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: BACKFILL ALL auth.users INTO registered_users
-- ═══════════════════════════════════════════════════════════════════════════
-- Uses INSERT ... ON CONFLICT to avoid duplicates.
-- Handles all edge cases: missing names, null emails, different role formats.

SELECT '═══ PHASE 1: Backfilling auth.users → registered_users ═══' as phase;

INSERT INTO public.registered_users (
  id,
  email,
  name,
  role,
  subscription_plan,
  subscription_expires_at,
  balance,
  blocked,
  last_login,
  created_at,
  updated_at
)
SELECT
  -- id: text (auth.users.id is UUID, cast to text)
  au.id::text,

  -- email: text (handle null)
  COALESCE(au.email, 'unknown-' || au.id || '@unknown.com'),

  -- name: text (prefer raw_user_meta_data->>'name', fallback to email local part)
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'name', ''),
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    NULLIF(au.raw_user_meta_data->>'displayName', ''),
    SPLIT_PART(COALESCE(au.email, 'unknown'), '@', 1),
    'Foydalanuvchi'
  ),

  -- role: text (prefer metadata, fallback to USER, but admin email always ADMIN)
  CASE
    WHEN au.email = 'akmaljaxonkulov00@gmail.com' THEN 'ADMIN'
    WHEN au.raw_user_meta_data->>'role' IN ('ADMIN', 'admin') THEN 'ADMIN'
    ELSE COALESCE(NULLIF(au.raw_user_meta_data->>'role', ''), 'USER')
  END,

  -- subscription_plan
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'subscription_plan', ''),
    'free'
  ),

  -- subscription_expires_at
  NULLIF(
    au.raw_user_meta_data->>'subscription_expires_at',
    ''
  )::TIMESTAMPTZ,

  -- balance
  0,

  -- blocked
  CASE WHEN au.banned_until IS NOT NULL THEN true ELSE false END,

  -- last_login
  COALESCE(au.last_sign_in_at, au.created_at, NOW()),

  -- created_at
  COALESCE(au.created_at, NOW()),

  -- updated_at
  NOW()

FROM auth.users au
-- Only insert users that don't already exist in registered_users
-- But if they exist with wrong data, UPDATE them
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = CASE
    -- Keep better name if existing is generic
    WHEN EXCLUDED.name <> '' AND EXCLUDED.name <> 'Foydalanuvchi'
      AND (registered_users.name = '' OR registered_users.name = 'Foydalanuvchi')
    THEN EXCLUDED.name
    ELSE registered_users.name
  END,
  role = CASE
    -- Admin role should always propagate
    WHEN EXCLUDED.role = 'ADMIN' THEN 'ADMIN'
    -- Keep existing role if set
    WHEN registered_users.role IS NOT NULL AND registered_users.role <> '' THEN registered_users.role
    ELSE EXCLUDED.role
  END,
  subscription_plan = COALESCE(NULLIF(EXCLUDED.subscription_plan, ''), registered_users.subscription_plan, 'free'),
  blocked = EXCLUDED.blocked,
  last_login = CASE
    WHEN EXCLUDED.last_login > COALESCE(registered_users.last_login, '1970-01-01'::TIMESTAMPTZ)
    THEN EXCLUDED.last_login
    ELSE COALESCE(registered_users.last_login, EXCLUDED.last_login)
  END,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2: FORCE SUPER ADMIN ELEVATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 2: Ensuring super admin elevation ═══' as phase;

UPDATE public.registered_users
SET
  role = 'ADMIN',
  name = COALESCE(NULLIF(name, ''), NULLIF(name, 'Foydalanuvchi'), 'Super Admin'),
  updated_at = NOW()
WHERE email = 'akmaljaxonkulov00@gmail.com'
  AND (role IS NULL OR role NOT IN ('ADMIN', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: ENSURE AUTO-SYNC TRIGGER EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 3: Ensuring auto-sync trigger exists ═══' as phase;

-- Create or replace the sync function
CREATE OR REPLACE FUNCTION sync_auth_user_to_registered()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.registered_users (
    id, email, name, role, subscription_plan,
    blocked, last_login, created_at, updated_at
  )
  VALUES (
    NEW.id::text,
    COALESCE(NEW.email, 'unknown@unknown.com'),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      SPLIT_PART(COALESCE(NEW.email, 'unknown'), '@', 1),
      'Foydalanuvchi'
    ),
    CASE
      WHEN NEW.email = 'akmaljaxonkulov00@gmail.com' THEN 'ADMIN'
      ELSE COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'USER')
    END,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'subscription_plan', ''), 'free'),
    CASE WHEN NEW.banned_until IS NOT NULL THEN true ELSE false END,
    NEW.last_sign_in_at,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), registered_users.email),
    name = CASE
      WHEN EXCLUDED.name <> '' AND EXCLUDED.name <> 'Foydalanuvchi'
        AND (registered_users.name = '' OR registered_users.name = 'Foydalanuvchi')
      THEN EXCLUDED.name
      ELSE registered_users.name
    END,
    role = CASE
      WHEN EXCLUDED.role = 'ADMIN' THEN 'ADMIN'
      ELSE COALESCE(NULLIF(registered_users.role, ''), EXCLUDED.role, 'USER')
    END,
    last_login = CASE
      WHEN EXCLUDED.last_login > COALESCE(registered_users.last_login, '1970-01-01'::TIMESTAMPTZ)
      THEN EXCLUDED.last_login
      ELSE COALESCE(registered_users.last_login, EXCLUDED.last_login)
    END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;

CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_registered();

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4: GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 4: Granting permissions ═══' as phase;

-- Ensure service_role and authenticated users can access registered_users
GRANT ALL ON public.registered_users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.registered_users TO authenticated;
GRANT SELECT ON public.registered_users TO anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 5: SHOW FINAL STATE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PHASE 5: FINAL STATE ═══' as phase;

SELECT
  'registered_users' as source,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'ADMIN') as admin_count,
  COUNT(*) FILTER (WHERE subscription_plan != 'free') as premium_count,
  COUNT(*) FILTER (WHERE blocked = true) as blocked_count
FROM public.registered_users;

-- Show all registered users
SELECT id, email, name, role, subscription_plan, created_at, updated_at
FROM public.registered_users
ORDER BY created_at DESC;

SELECT '═══ MIGRATION COMPLETE ═══' as status;
SELECT 'Now users should appear in the admin panel. If still empty, check:' as info;
SELECT '1. Go to Supabase Dashboard → SQL Editor and run this migration' as info;
SELECT '2. If RLS blocks, temporarily disable RLS on registered_users:' as info;
SELECT '   ALTER TABLE registered_users DISABLE ROW LEVEL SECURITY;' as info;
SELECT '3. Check the sync trigger is active:' as info;
SELECT '   SELECT tgname FROM pg_trigger WHERE tgrelid = ''auth.users''::regclass;' as info;
