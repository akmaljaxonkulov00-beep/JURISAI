-- ============================================================
-- JURISAI — Super Admin Seed Script
-- Run this in Supabase SQL Editor to create the super admin
-- ============================================================
-- This script:
-- 1. Creates the admin user in Supabase Auth (using the service role)
-- 2. Upserts the user profile with SUPER_ADMIN role
-- 3. Sets up initial admin settings

-- NOTE: Run from Supabase Dashboard > SQL Editor
-- Requires service_role key access

-- ============================================================
-- Step 1: Ensure the users table exists with proper role support
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'SUPER_ADMIN')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'pro')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- Step 2: Upsert super admin user
-- ============================================================
-- Since we can't create Auth users directly via SQL,
-- we create/update the profile. The Auth user must be created
-- via the Supabase Auth API or sign-up flow.
--
-- After the user signs up with email akmaljaxonkulov00@gmail.com,
-- run the UPDATE below to elevate to SUPER_ADMIN.

INSERT INTO users (email, name, role, subscription_plan, is_active)
VALUES ('akmaljaxonkulov00@gmail.com', 'Super Admin', 'SUPER_ADMIN', 'pro', true)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'SUPER_ADMIN',
  subscription_plan = 'pro',
  is_active = true,
  updated_at = NOW();

-- ============================================================
-- Step 3: Create admin settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default admin settings
INSERT INTO admin_settings (key, value) VALUES
  ('announcement_banner', 'JURISAI - Huquqiy AI yordamchingiz!'),
  ('pricing_free_name', 'Bepul'),
  ('pricing_free_price', '0'),
  ('pricing_free_features', '["5 ta IRAC tahlili","Asosiy qonunlar bazasi","10 ta AI so''rovi"]'),
  ('pricing_standard_name', 'Standart'),
  ('pricing_standard_price', '45000'),
  ('pricing_standard_features', '["Cheksiz IRAC tahlili","To''liq qonunlar bazasi","AI yordami 24/7","50 hujjat"]'),
  ('pricing_pro_name', 'Pro'),
  ('pricing_pro_price', '140000'),
  ('pricing_pro_features', '["Cheksiz AI so''rovlari","Cheksiz hujjat","Shaxsiy maslahatchi","Ekspert konsultatsiyasi"]'),
  ('contact_email', 'support@jurisai.uz'),
  ('contact_phone', '+998 90 123 45 67'),
  ('payment_card_number', '8600 1234 5678 9012'),
  ('payment_details', 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012'),
  ('legal_disclaimer', 'JURISAI tomonidan berilgan ma''lumotlar faqat ma''lumot uchun. Rasmiy huquqiy maslahat o''rnini bosa olmaydi.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Step 4: Create payment_requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  plan VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  receipt_image TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- Step 5: Create RLS policies
-- ============================================================
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write admin_settings
CREATE POLICY "Admins can read admin_settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'SUPER_ADMIN'))
  );

CREATE POLICY "Admins can manage admin_settings" ON admin_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'SUPER_ADMIN'))
  );

-- Only SUPER_ADMIN can read all users
CREATE POLICY "Super admin can read all users" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'SUPER_ADMIN')
  );

CREATE POLICY "Super admin can update any user" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'SUPER_ADMIN')
  );

CREATE POLICY "Admins can read payment_requests" ON payment_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'SUPER_ADMIN'))
  );

-- ============================================================
-- Step 6: Auto-elevate trigger for super admin email
-- ============================================================
CREATE OR REPLACE FUNCTION auto_elevate_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'akmaljaxonkulov00@gmail.com' THEN
    NEW.role := 'SUPER_ADMIN';
    NEW.subscription_plan := 'pro';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_elevate_super_admin ON users;
CREATE TRIGGER trigger_auto_elevate_super_admin
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_elevate_super_admin();

-- ============================================================
-- Verify
-- ============================================================
SELECT 'Super admin seed complete!' AS result;
SELECT email, role, subscription_plan FROM users WHERE email = 'akmaljaxonkulov00@gmail.com';
