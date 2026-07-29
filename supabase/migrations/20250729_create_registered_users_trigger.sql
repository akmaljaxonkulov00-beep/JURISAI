-- ================================================================
-- Migration: Create registered_users table + auth.users sync trigger
-- ================================================================
-- This migration:
-- 1. Creates `registered_users` table (if not exists)
-- 2. Creates a trigger that auto-inserts into registered_users
--    whenever a new user signs up (INSERT on auth.users)
-- 3. Backfills all existing auth.users into registered_users
-- ================================================================

-- ── 1. CREATE registered_users TABLE ──────────────────────────
CREATE TABLE IF NOT EXISTS registered_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT '',
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'admin', 'user', 'lawyer')),
  avatar TEXT DEFAULT '',
  subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'standart', 'premium', 'pro')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  balance DECIMAL(12, 2) DEFAULT 0,
  blocked BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. CREATE OR REPLACE FUNCTION: sync new auth user ─────────
CREATE OR REPLACE FUNCTION sync_auth_user_to_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registered_users (
    id,
    email,
    name,
    role,
    avatar,
    subscription_plan,
    created_at,
    last_login
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
    COALESCE(NEW.raw_user_meta_data->>'subscription_plan', 'free'),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.last_sign_in_at, NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_login = CASE
      WHEN EXCLUDED.last_login > registered_users.last_login
      THEN EXCLUDED.last_login
      ELSE registered_users.last_login
    END,
    name = CASE
      WHEN EXCLUDED.name <> '' THEN EXCLUDED.name
      ELSE registered_users.name
    END,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── 3. CREATE TRIGGER on auth.users ───────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_registered();

-- ── 4. BACKFILL existing auth.users into registered_users ─────
INSERT INTO public.registered_users (
  id,
  email,
  name,
  role,
  avatar,
  subscription_plan,
  created_at,
  last_login
)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'name', au.email, ''),
  COALESCE(au.raw_user_meta_data->>'role', 'USER'),
  COALESCE(au.raw_user_meta_data->>'avatar', ''),
  COALESCE(au.raw_user_meta_data->>'subscription_plan', 'free'),
  COALESCE(au.created_at, NOW()),
  COALESCE(au.last_sign_in_at, au.created_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.registered_users ru WHERE ru.id = au.id
);

-- ── 5. Enable RLS for registered_users ────────────────────────
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can read all users" ON registered_users;
DROP POLICY IF EXISTS "Users can read own data" ON registered_users;
DROP POLICY IF EXISTS "Users can update own data" ON registered_users;

-- Create RLS policies
CREATE POLICY "Admins can read all users" ON registered_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registered_users ru
      WHERE ru.id = auth.uid() AND ru.role IN ('ADMIN', 'admin')
    )
  );

CREATE POLICY "Users can read own data" ON registered_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON registered_users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 6. Also sync on UPDATE (e.g. when user changes email) ────
CREATE OR REPLACE FUNCTION sync_auth_user_update_to_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.registered_users
  SET
    email = COALESCE(NEW.email, registered_users.email),
    name = COALESCE(NEW.raw_user_meta_data->>'name', registered_users.name),
    avatar = COALESCE(NEW.raw_user_meta_data->>'avatar', registered_users.avatar),
    role = COALESCE(NEW.raw_user_meta_data->>'role', registered_users.role),
    subscription_plan = COALESCE(NEW.raw_user_meta_data->>'subscription_plan', registered_users.subscription_plan),
    last_login = COALESCE(NEW.last_sign_in_at, registered_users.last_login),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_update_to_registered();

-- ── 7. Also sync on DELETE (e.g. user deleted from auth) ─────
CREATE OR REPLACE FUNCTION sync_auth_user_delete_from_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.registered_users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_delete_from_registered();
