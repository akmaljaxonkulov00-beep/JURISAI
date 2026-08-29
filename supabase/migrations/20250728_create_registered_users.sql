-- ============================================================================
-- JURISTIV: REGISTERED_USERS TABLE
-- Migration: 20250728
--
-- This table stores user profiles synced from Firebase Auth for admin panel.
-- Also sets up a trigger to auto-copy auth.users (Supabase Auth) entries.
-- ============================================================================

-- ── 1. Create registered_users table if not exists ───────────────────────
CREATE TABLE IF NOT EXISTS registered_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  balance INTEGER DEFAULT 0,
  blocked BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  ai_usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_role ON registered_users(role);
CREATE INDEX IF NOT EXISTS idx_registered_users_created_at ON registered_users(created_at);

-- ── 3. Enable Row Level Security ─────────────────────────────────────────
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies ──────────────────────────────────────────────────────
-- Everyone can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON registered_users;
CREATE POLICY "Users can read own data" ON registered_users
  FOR SELECT USING (
    auth.uid()::text = id OR
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Admins can read all users
DROP POLICY IF EXISTS "Admins can read all users" ON registered_users;
CREATE POLICY "Admins can read all users" ON registered_users
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Service role can insert/update/delete all
DROP POLICY IF EXISTS "Service role full access" ON registered_users;
CREATE POLICY "Service role full access" ON registered_users
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can update any user
DROP POLICY IF EXISTS "Admins can update users" ON registered_users;
CREATE POLICY "Admins can update users" ON registered_users
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Users can update their own record
DROP POLICY IF EXISTS "Users can update own record" ON registered_users;
CREATE POLICY "Users can update own record" ON registered_users
  FOR UPDATE USING (auth.uid()::text = id);

-- ── 5. Updated_at trigger ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_registered_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_registered_users_updated_at ON registered_users;
CREATE TRIGGER update_registered_users_updated_at
  BEFORE UPDATE ON registered_users
  FOR EACH ROW EXECUTE FUNCTION update_registered_users_updated_at();

-- ── 6. Auto-sync trigger from auth.users (if Supabase Auth is used) ─────
CREATE OR REPLACE FUNCTION sync_auth_user_to_registered()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO registered_users (id, email, name, role, last_login, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'USER'),
    NEW.last_sign_in_at,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, registered_users.name),
    last_login = COALESCE(EXCLUDED.last_login, registered_users.last_login),
    updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_user_to_registered();

-- ── 7. Grant permissions ─────────────────────────────────────────────────
GRANT ALL ON registered_users TO service_role;
GRANT SELECT, UPDATE ON registered_users TO authenticated;
GRANT SELECT ON registered_users TO anon;
