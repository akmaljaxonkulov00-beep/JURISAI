-- ============================================================================
-- JURISAI ADMIN PANEL UCHUN SUPABASE JADVALLARI
-- Migration: 20250727_create_admin_tables.sql
-- 
-- Quyidagi jadvallarni yaratadi:
--   registered_users  — foydalanuvchi profillari
--   payment_requests  — to'lov cheklari
--   usage_logs        — AI token ishlatilishi
--   auth_logs         — login faolliklari
--   site_settings     — sayt sozlamalari (1 qator, id='default')
--   pricing_plans     — narx rejalari
-- ============================================================================

-- ── 0. UUID EXTENSION ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. REGISTERED USERS ─────────────────────────────────────────────────────
-- Foydalanuvchi profillari. Har bir ro'yxatdan o'tgan foydalanuvchi uchun 1 qator.
CREATE TABLE IF NOT EXISTS registered_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'TEACHER', 'STUDENT')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'standart', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  balance NUMERIC(12, 2) DEFAULT 0,
  blocked BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. PAYMENT REQUESTS ────────────────────────────────────────────────────
-- Foydalanuvchi yuklagan to'lov cheklari. Admin tasdiqlashi yoki rad etishi mumkin.
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'standart' CHECK (plan IN ('standart', 'pro')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  receipt_image TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. USAGE LOGS ──────────────────────────────────────────────────────────
-- AI token / API ishlatilishini kuzatish
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  name TEXT DEFAULT '',
  tokens NUMERIC(10, 2) DEFAULT 0,
  action TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. AUTH LOGS ───────────────────────────────────────────────────────────
-- Foydalanuvchi kirish (login) faolliklari
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  method TEXT DEFAULT 'email' CHECK (method IN ('email', 'google')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. SITE SETTINGS ──────────────────────────────────────────────────────
-- Sayt sozlamalari — faqat bitta qator (id='default' TEXT PRIMARY KEY)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  announcement_banner TEXT DEFAULT '',
  hero_title TEXT DEFAULT 'Huquqiy masalalarni AI bilan yeching',
  hero_subtitle TEXT DEFAULT 'O''zbekiston qonunchiligi bo''yicha professional AI yordamchi',
  contact_email TEXT DEFAULT 'support@jurisai.uz',
  contact_phone TEXT DEFAULT '+998 90 123 45 67',
  telegram_link TEXT DEFAULT 'https://t.me/jurisai_bot',
  legal_disclaimer TEXT DEFAULT 'JURISAI tomonidan berilgan ma''lumotlar faqat ma''lumot uchun.',
  system_prompt TEXT DEFAULT '',
  payment_card_number TEXT DEFAULT '',
  payment_details TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings qatorini kiritish (faqat bitta, id='default')
INSERT INTO site_settings (id, announcement_banner, hero_title, hero_subtitle)
VALUES ('default', 'JURISAI - Huquqiy AI yordamchingiz!', 'Huquqiy masalalarni AI bilan yeching', 'O''zbekiston qonunchiligi bo''yicha professional AI yordamchi')
ON CONFLICT (id) DO NOTHING;

-- ── 6. PRICING PLANS ──────────────────────────────────────────────────────
-- Narx rejalari. Admin o'zgartirishi mumkin.
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  case_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default narx rejalari
INSERT INTO pricing_plans (id, name, price, features, case_limit) VALUES
  ('free', 'Bepul', 0, ARRAY['5 ta IRAC tahlili', 'Asosiy qonunlar bazasi', '10 ta AI so''rovi'], 5),
  ('standart', 'Standart', 45000, ARRAY['Cheksiz IRAC tahlili', 'To''liq qonunlar bazasi', 'AI yordami 24/7', '50 hujjat'], 50),
  ('pro', 'Pro', 140000, ARRAY['Cheksiz AI so''rovlari', 'Cheksiz hujjat', 'Shaxsiy maslahatchi', 'Ekspert konsultatsiyasi'], -1)
ON CONFLICT (id) DO NOTHING;

-- ── 7. INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON auth_logs(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_role ON registered_users(role);
CREATE INDEX IF NOT EXISTS idx_registered_users_subscription ON registered_users(subscription_plan);

-- ── 8. ROW LEVEL SECURITY ──────────────────────────────────────────────────
-- DIQQAT: Loyiha Firebase Auth dan foydalanadi. Supabase auth.email() va auth.role()
-- Firebase foydalanuvchilari uchun ishlamaydi. Analytics API service_role key bilan
-- ishlaydi (RLS ni chetlab o'tadi). Quyidagi RLS policy lar faqat Supabase Auth
-- orqali kelgan so'rovlar uchun amal qiladi.
-- 
-- Muqobil yechim: Barcha o'zgarishlar API route lar orqali amalga oshiriladi.
-- API route lar getSupabaseAdmin() yoki service_role key bilan ishlaydi.
-- Shu sababli, quyida hamma jadvallar PUBLIC SELECT va PUBLIC INSERT ga ochiq,
-- UPDATE/DELETE esa faqat admin emailga cheklangan.

ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Hamma o'qiy oladi
CREATE POLICY "Public read registered_users" ON registered_users FOR SELECT USING (true);
CREATE POLICY "Public read payment_requests" ON payment_requests FOR SELECT USING (true);
CREATE POLICY "Public read usage_logs" ON usage_logs FOR SELECT USING (true);
CREATE POLICY "Public read auth_logs" ON auth_logs FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read pricing_plans" ON pricing_plans FOR SELECT USING (true);

-- Hamma INSERT qila oladi (API route lar service_role bilan ishlaydi)
CREATE POLICY "Public insert registered_users" ON registered_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert payment_requests" ON payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert usage_logs" ON usage_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert auth_logs" ON auth_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert site_settings" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert pricing_plans" ON pricing_plans FOR INSERT WITH CHECK (true);
