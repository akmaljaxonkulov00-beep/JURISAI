-- ============================================================================
-- JURISTIV ADMIN PANEL UCHUN TO'LIQ JADVALLAR
-- Supabase SQL Editor'da ishga tushiring
-- ============================================================================

-- 1. REGISTERED USERS (registered_users) — Foydalanuvchilar
CREATE TABLE IF NOT EXISTS public.registered_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'USER',
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  balance NUMERIC DEFAULT 0,
  blocked BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAYMENT REQUESTS (payment_requests) — To'lov so'rovlari
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  plan TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_image TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USAGE LOGS (usage_logs) — Token ishlatilishi
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  name TEXT DEFAULT '',
  tokens NUMERIC DEFAULT 0,
  action TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AUTH LOGS (auth_logs) — Kirish faolligi
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  name TEXT DEFAULT '',
  method TEXT DEFAULT 'email' CHECK (method IN ('email', 'google')),
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SITE SETTINGS (site_settings) — Sayt sozlamalari
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  announcement_banner TEXT DEFAULT '',
  announcement_active BOOLEAN DEFAULT TRUE,
  announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success')),
  hero_title TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  telegram_link TEXT DEFAULT '',
  legal_disclaimer TEXT DEFAULT '',
  system_prompt TEXT DEFAULT '',
  payment_card_number TEXT DEFAULT '',
  payment_details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRICING PLANS (pricing_plans) — Narxlar va rejalar
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',
  case_limit INTEGER DEFAULT -1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CATEGORIES (for legal codes)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ARTICLES (for legal code articles)
CREATE TABLE IF NOT EXISTS public.articles (
  id BIGSERIAL PRIMARY KEY,
  code_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'Umumiy',
  penalties TEXT DEFAULT '',
  references JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_email ON public.usage_logs(email);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON public.auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON public.registered_users(email);
CREATE INDEX IF NOT EXISTS idx_articles_code_id ON public.articles(code_id);
CREATE INDEX IF NOT EXISTS idx_articles_number ON public.articles(article_number);

-- ============================================================================
-- DEFAULT DATA — Pricing plans
-- ============================================================================
INSERT INTO public.pricing_plans (id, name, price, features, case_limit, sort_order) VALUES
  ('free', 'Bepul', 0, '["5 ta IRAC tahlili", "Asosiy qonunlar bazasi", "10 ta AI so''rovi"]', 5, 1),
  ('standart', 'Standart', 45000, '["Cheksiz IRAC tahlili", "To''liq qonunlar bazasi", "AI yordami 24/7", "50 hujjat"]', 50, 2),
  ('pro', 'Pro', 140000, '["Cheksiz AI so''rovlari", "Cheksiz hujjat", "Shaxsiy maslahatchi", "Ekspert konsultatsiyasi"]', -1, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DEFAULT DATA — Site settings
-- ============================================================================
INSERT INTO public.site_settings (id, announcement_banner, hero_title, hero_subtitle, contact_email, payment_card_number, payment_details) VALUES
  ('global', 'JURISTIV - Huquqiy AI yordamchingiz!', 'Huquqiy masalalarni AI bilan yeching', 'O''zbekiston qonunchiligi bo''yicha professional AI yordamchi', 'support@juristiv.uz', '8600 1234 5678 9012', 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DEFAULT DATA — Legal code categories (Uzbek full names)
-- ============================================================================
INSERT INTO public.categories (id, name, description, icon, color) VALUES
  ('constitution', 'O''zbekiston Respublikasi Konstitutsiyasi', 'O''zbekiston Respublikasining Asosiy Qonuni', 'landmark', 'indigo'),
  ('criminal_code', 'O''zbekiston Respublikasi Jinoyat Kodeksi', 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun', 'gavel', 'red'),
  ('civil_code', 'O''zbekiston Respublikasi Fuqarolik Kodeksi', 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun', 'scale', 'blue'),
  ('labor_code', 'O''zbekiston Respublikasi Mehnat Kodeksi', 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun', 'users', 'green'),
  ('family_code', 'O''zbekiston Respublikasi Oila Kodeksi', 'Oila munosabatlarini tartibga soluvchi asosiy qonun', 'users', 'pink'),
  ('tax_code', 'O''zbekiston Respublikasi Soliq Kodeksi', 'Soliq munosabatlarini tartibga soluvchi asosiy qonun', 'dollar-sign', 'purple'),
  ('land_code', 'O''zbekiston Respublikasi Yer Kodeksi', 'Yer munosabatlarini tartibga soluvchi asosiy qonun', 'tree-pine', 'amber'),
  ('admin_code', 'O''zbekiston Respublikasi Ma''muriy Javobgarlik To''g''risidagi Kodeksi', 'Ma''muriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun', 'shield', 'slate'),
  ('civil_procedure_code', 'O''zbekiston Respublikasi Fuqarolik Protsessual Kodeksi', 'Fuqarolik ishlarini sudda ko''rish tartibini belgilovchi qonun', 'file-text', 'cyan'),
  ('criminal_procedure_code', 'O''zbekiston Respublikasi Jinoyat Protsessual Kodeksi', 'Jinoyat ishlarini tergov qilish va sudda ko''rish tartibini belgilovchi qonun', 'file-text', 'rose'),
  ('economic_procedure_code', 'O''zbekiston Respublikasi Iqtisodiy Protsessual Kodeksi', 'Iqtisodiy nizolarni sudda ko''rish tartibini belgilovchi qonun', 'dollar-sign', 'teal')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY IF NOT EXISTS "Public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.articles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.pricing_plans FOR SELECT USING (true);

-- Admin full access policies
CREATE POLICY IF NOT EXISTS "Admin all access" ON public.registered_users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin all access" ON public.payment_requests FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin all access" ON public.usage_logs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin all access" ON public.auth_logs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin all access" ON public.site_settings FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin all access" ON public.pricing_plans FOR ALL USING (true);

-- Enable Realtime for admin tables
-- Run in Supabase Dashboard: Go to Database > Replication and enable these tables
-- Or run: ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
--         ALTER PUBLICATION supabase_realtime ADD TABLE usage_logs;
--         ALTER PUBLICATION supabase_realtime ADD TABLE auth_logs;
--         ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
--         ALTER PUBLICATION supabase_realtime ADD TABLE pricing_plans;
--         ALTER PUBLICATION supabase_realtime ADD TABLE registered_users;
