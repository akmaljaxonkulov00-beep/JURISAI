-- ================================================================
-- Migration: Backfill all auth.users into registered_users
-- ================================================================
-- Purpose: Admin panel shows 0 users because registered_users table
-- is empty. This migration copies ALL users from auth.users into
-- registered_users so the admin panel can display them.
-- ================================================================

-- ── 1. INSERT ALL AUTH.USERS INTO registered_users ──────────────
INSERT INTO public.registered_users (
  id,
  email,
  name,
  role,
  avatar,
  subscription_plan,
  subscription_expires_at,
  balance,
  blocked,
  status,
  created_at,
  last_login,
  updated_at
)
SELECT
  au.id,
  COALESCE(au.email, 'no-email@unknown'),
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    SPLIT_PART(COALESCE(au.email, 'unknown'), '@', 1),
    'Foydalanuvchi'
  ),
  COALESCE(
    au.raw_user_meta_data->>'role',
    CASE WHEN au.email = 'akmaljaxonkulov00@gmail.com' THEN 'ADMIN' ELSE 'USER' END
  ),
  COALESCE(au.raw_user_meta_data->>'avatar', ''),
  COALESCE(au.raw_user_meta_data->>'subscription_plan', 'free'),
  NULLIF(au.raw_user_meta_data->>'subscription_expires_at', '')::TIMESTAMP WITH TIME ZONE,
  0,
  false,
  CASE WHEN au.banned_until IS NOT NULL THEN 'blocked' ELSE 'active' END,
  COALESCE(au.created_at, NOW()),
  COALESCE(au.last_sign_in_at, au.created_at, NOW()),
  NOW()
FROM auth.users au
-- Only insert users that don't already exist in registered_users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = CASE
    WHEN EXCLUDED.name <> '' AND EXCLUDED.name <> 'Foydalanuvchi'
    THEN EXCLUDED.name
    ELSE COALESCE(registered_users.name, EXCLUDED.name)
  END,
  role = CASE
    WHEN EXCLUDED.role IN ('ADMIN', 'admin') THEN 'ADMIN'
    ELSE COALESCE(registered_users.role, 'USER')
  END,
  last_login = CASE
    WHEN EXCLUDED.last_login > COALESCE(registered_users.last_login, '1970-01-01')
    THEN EXCLUDED.last_login
    ELSE COALESCE(registered_users.last_login, EXCLUDED.last_login)
  END,
  updated_at = NOW();

-- ── 2. FORCE SUPER ADMIN ELEVATION ───────────────────────────────
-- Ensure the super admin email always has ADMIN role
UPDATE public.registered_users
SET role = 'ADMIN', updated_at = NOW()
WHERE email = 'akmaljaxonkulov00@gmail.com' AND role NOT IN ('ADMIN', 'admin');

-- ── 3. SHOW RESULTS ──────────────────────────────────────────────
SELECT
  'BACKFILL COMPLETE' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role IN ('ADMIN', 'admin')) as admin_count,
  COUNT(*) FILTER (WHERE subscription_plan != 'free') as premium_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE blocked = true) as blocked_count
FROM public.registered_users;
