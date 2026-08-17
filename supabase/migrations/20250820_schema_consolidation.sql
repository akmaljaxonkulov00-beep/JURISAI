-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20250820_schema_consolidation.sql
--
-- SUPABASE SXEMA KONSOLIDATSIYASI — forward migration (idempotent, qayta RUN xavfsiz)
--
-- Muammo:
--   1) Kod ishlatadigan, lekin HECH QANDAY migratsiyada yaratilmagan jadvallar:
--      feedback, subscriptions, legal_categories, legal_form_submissions,
--      legal_calculations, achievements, auth_users_view
--   2) Eski (2024) migratsiyalar live bazada run qilinmagan bo'lsa yetishmaydigan
--      jadvallar: ai_chat_conversations, ai_chat_messages, lawyers, clients,
--      client_cases, client_requests, legal_documents
--   3) irac_analyses — ESKI sxema (case_text/issue/rule...) vs YANGI
--      (case_title/irac_analysis jsonb/...) to'qnashuvi
--   4) payment_requests status check constraint — to'liq state machine emas
--   5) KENG RLS policy'lar (USING(true)) — shaxsiy ma'lumotlar himoyasiz
--
-- Yagona authoritative jadvallar:
--   users            → registered_users (legacy `users` jadvali qoldiriladi, yangi kod faqat registered_users)
--   profiles         → registered_users (view YARATILMAYDI — kod bevosita registered_users'ga ko'chirildi)
--   payments         → payment_requests
--   pricing          → pricing_plans  (subscription_plans — VIEW ustidan)
--   laws/articles    → categories / articles / codes
--   bookmarks        → legal_bookmarks (user_bookmarks legacy)
--   usage            → usage_logs     (usage_tracking legacy)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1: Yordamchi funksiyalar (20250818 dan — xavfsizlik uchun qayta e'lon)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registered_users
    WHERE id = auth.uid() AND UPPER(role) IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = gid AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(gid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = gid AND g.created_by = auth.uid()
  );
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2: AI chat jadvallari (chat-service ishlatadi — client RLS bilan)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Yangi suhbat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);

-- Eski FK (users jadvaliga) bo'lsa olib tashlanadi — auth.users bilan bog'lanadi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_conversations_user_id_fkey'
  ) THEN
    ALTER TABLE public.ai_chat_conversations DROP CONSTRAINT ai_chat_conversations_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.ai_chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_conversations_select ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_select ON public.ai_chat_conversations
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_conversations_insert ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_insert ON public.ai_chat_conversations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_conversations_update ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_update ON public.ai_chat_conversations
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_conversations_delete ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_delete ON public.ai_chat_conversations
  FOR DELETE USING (user_id::text = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type VARCHAR(20) DEFAULT 'user',
  category VARCHAR(20) DEFAULT 'general',
  related_laws TEXT[],
  suggestions TEXT[],
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_messages_user_id_fkey'
  ) THEN
    ALTER TABLE public.ai_chat_messages DROP CONSTRAINT ai_chat_messages_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_messages_select ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_select ON public.ai_chat_messages
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_messages_insert ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_insert ON public.ai_chat_messages
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_messages_delete ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_delete ON public.ai_chat_messages
  FOR DELETE USING (user_id::text = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation
  ON public.ai_chat_messages(conversation_id, timestamp ASC);

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3: Yangi jadvallar (kod ishlatadi, migratsiyada yo'q edi)
-- ───────────────────────────────────────────────────────────────────────────

-- 3.1 FEEDBACK — Yordam/Fikr sahifasi
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'improvement',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  email TEXT,
  user_id UUID,
  user_agent TEXT,
  url TEXT,
  status TEXT DEFAULT 'NEW',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_insert ON public.feedback;
CREATE POLICY feedback_insert ON public.feedback
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS feedback_select_owner ON public.feedback;
CREATE POLICY feedback_select_owner ON public.feedback
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS feedback_update_admin ON public.feedback;
CREATE POLICY feedback_update_admin ON public.feedback
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS feedback_delete_admin ON public.feedback;
CREATE POLICY feedback_delete_admin ON public.feedback
  FOR DELETE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- 3.2 SUBSCRIPTIONS — Stripe/obuna yozuvlari
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELED', 'EXPIRED', 'PENDING')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
CREATE POLICY subscriptions_insert ON public.subscriptions
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;
CREATE POLICY subscriptions_update ON public.subscriptions
  FOR UPDATE USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS subscriptions_delete ON public.subscriptions;
CREATE POLICY subscriptions_delete ON public.subscriptions
  FOR DELETE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id, status);

-- 3.3 LEGAL_CATEGORIES — admin "Hujjatlar" bo'limi
CREATE TABLE IF NOT EXISTS public.legal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.legal_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_categories_select ON public.legal_categories;
CREATE POLICY legal_categories_select ON public.legal_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS legal_categories_write_admin ON public.legal_categories;
CREATE POLICY legal_categories_write_admin ON public.legal_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Qayta RUN'da takrorlanmasligi uchun slug unique bo'lishi kerak
CREATE UNIQUE INDEX IF NOT EXISTS legal_categories_slug_key ON public.legal_categories(slug);

INSERT INTO public.legal_categories (name, slug, sort_order) VALUES
  ('Shartnomalar', 'shartnomalar', 1),
  ('Da''vo arizalari', 'davo-arizalari', 2),
  ('Arizalar', 'arizalar', 3),
  ('Ishonchnomalar', 'ishonchnomalar', 4),
  ('Mehnat hujjatlari', 'mehnat-hujjatlari', 5),
  ('Oila hujjatlari', 'oila-hujjatlari', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3.4 LEGAL_FORM_SUBMISSIONS — hujjat formasi yuborish
CREATE TABLE IF NOT EXISTS public.legal_form_submissions (
  id TEXT PRIMARY KEY,
  user_id UUID,
  template_id TEXT,
  template_name TEXT,
  category TEXT DEFAULT 'general',
  form_data JSONB DEFAULT '{}'::jsonb,
  tracking_number TEXT,
  status TEXT DEFAULT 'pending',
  fees JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.legal_form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_form_submissions_insert ON public.legal_form_submissions;
CREATE POLICY legal_form_submissions_insert ON public.legal_form_submissions
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS legal_form_submissions_select ON public.legal_form_submissions;
CREATE POLICY legal_form_submissions_select ON public.legal_form_submissions
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

-- 3.5 LEGAL_CALCULATIONS — huquqiy kalkulyator natijalari
CREATE TABLE IF NOT EXISTS public.legal_calculations (
  id TEXT PRIMARY KEY,
  user_id UUID,
  case_type TEXT,
  claim_amount NUMERIC DEFAULT 0,
  state_fee NUMERIC DEFAULT 0,
  damages NUMERIC DEFAULT 0,
  interest NUMERIC DEFAULT 0,
  court_fee NUMERIC DEFAULT 0,
  lawyer_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  calculation_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.legal_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_calculations_insert ON public.legal_calculations;
CREATE POLICY legal_calculations_insert ON public.legal_calculations
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS legal_calculations_select ON public.legal_calculations;
CREATE POLICY legal_calculations_select ON public.legal_calculations
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

-- 3.6 ACHIEVEMENTS — foydalanuvchi yutuqlari (keyinchalik to'ldiriladi)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT DEFAULT 'first_case',
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  rarity TEXT DEFAULT 'common',
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievements_select ON public.achievements;
CREATE POLICY achievements_select ON public.achievements
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS achievements_insert ON public.achievements;
CREATE POLICY achievements_insert ON public.achievements
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4: Legacy jadvallar (eski 2024 migratsiyalar run qilinmagan bo'lsa)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  specialization TEXT[] NOT NULL,
  experience INTEGER DEFAULT 0,
  office_address TEXT NOT NULL,
  education TEXT NOT NULL,
  bar_association VARCHAR(100) NOT NULL,
  bio TEXT NOT NULL,
  website VARCHAR(255),
  linkedin VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lawyers_select ON public.lawyers;
CREATE POLICY lawyers_select ON public.lawyers
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS lawyers_insert ON public.lawyers;
CREATE POLICY lawyers_insert ON public.lawyers
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS lawyers_update ON public.lawyers;
CREATE POLICY lawyers_update ON public.lawyers
  FOR UPDATE USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select ON public.clients;
CREATE POLICY clients_select ON public.clients
  FOR SELECT USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.client_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE CASCADE,
  case_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_cases_select ON public.client_cases;
CREATE POLICY client_cases_select ON public.client_cases
  FOR SELECT USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  urgency VARCHAR(10) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  lawyer_response TEXT,
  estimated_time VARCHAR(100),
  estimated_cost DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_requests_select ON public.client_requests;
CREATE POLICY client_requests_select ON public.client_requests
  FOR SELECT USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  source_url TEXT,
  article_reference VARCHAR(100),
  jurisdiction VARCHAR(100) DEFAULT 'uzbekistan',
  language VARCHAR(10) DEFAULT 'uz',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_documents_select ON public.legal_documents;
CREATE POLICY legal_documents_select ON public.legal_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS legal_documents_write_admin ON public.legal_documents;
CREATE POLICY legal_documents_write_admin ON public.legal_documents
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 5: irac_analyses — eski vs yangi sxema konsolidatsiyasi
-- ───────────────────────────────────────────────────────────────────────────
-- Eski (2024) sxema: case_text, issue, rule, application, conclusion, metadata
-- Yangi (2025) sxema: case_title, irac_analysis jsonb, total_score, grade, ...
ALTER TABLE public.irac_analyses
  ADD COLUMN IF NOT EXISTS case_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS case_category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS case_difficulty TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS irac_analysis JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS total_score INTEGER,
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weaknesses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Eski FK (legacy users jadvaliga) olib tashlanadi — user_id plain UUID qoladi,
-- egalik RLS + API darajasida tekshiriladi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'irac_analyses_user_id_fkey'
  ) THEN
    ALTER TABLE public.irac_analyses DROP CONSTRAINT irac_analyses_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.irac_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS irac_analyses_select ON public.irac_analyses;
CREATE POLICY irac_analyses_select ON public.irac_analyses
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS irac_analyses_insert ON public.irac_analyses;
CREATE POLICY irac_analyses_insert ON public.irac_analyses
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS irac_analyses_delete ON public.irac_analyses;
CREATE POLICY irac_analyses_delete ON public.irac_analyses
  FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_irac_analyses_user ON public.irac_analyses(user_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 6: payment_requests — to'liq state machine + yetishmayotgan ustunlar
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_by uuid,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS plan_id text,
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'UZS',
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_transaction_id text;

-- Eski (3 holatli) check constraint'ni almashtirish — to'liq state machine
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_requests_status_check'
  ) THEN
    ALTER TABLE public.payment_requests DROP CONSTRAINT payment_requests_status_check;
  END IF;
END $$;

ALTER TABLE public.payment_requests
  ADD CONSTRAINT payment_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired'));

CREATE INDEX IF NOT EXISTS idx_payment_requests_user_status
  ON public.payment_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status_created
  ON public.payment_requests (status, created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 7: VIEW'lar — konsolidatsiya (duplicate jadval yaratilmaydi)
-- ───────────────────────────────────────────────────────────────────────────

-- 7.1 subscription_plans — pricing_plans ustidan (Stripe billing uchun mos shakl)
-- Eslatma: jonli bazada pricing_plans da sort_order/description/currency/billing_cycle
-- ustunlari yo'q — view ularni doimiy qiymatlar bilan sintez qiladi.
CREATE OR REPLACE VIEW public.subscription_plans AS
  SELECT
    id,
    name,
    price,
    ''::text AS description,
    'UZS'::text AS currency,
    'month'::text AS billing_cycle,
    true AS is_active,
    0::integer AS sort_order,
    created_at,
    updated_at
  FROM public.pricing_plans;

GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.subscription_plans TO anon;

-- 7.2 irac_cases — irac_analyses ustidan (user/stats uchun tarix shakli)
CREATE OR REPLACE VIEW public.irac_cases AS
  SELECT
    id,
    user_id,
    COALESCE(NULLIF(case_title, ''), 'Nomsiz ish') AS title,
    'COMPLETED'::text AS status,
    total_score,
    created_at
  FROM public.irac_analyses
  WHERE user_id IS NOT NULL;

-- 7.3 auth_users_view — auth.users ustidan (admin panel: service_role uchun)
CREATE OR REPLACE VIEW public.auth_users_view AS
  SELECT
    id,
    email,
    phone,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    banned_until
  FROM auth.users;

REVOKE ALL ON public.auth_users_view FROM anon, authenticated;
GRANT SELECT ON public.auth_users_view TO service_role;

-- 7.4 public_profiles — faqat id+name (statistika leaderboard; email YO'Q)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, name
  FROM public.registered_users
  WHERE name IS NOT NULL AND name <> '';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 8: RLS QATTQLASHTIRISH — keng (USING(true)) policy'lar olib tashlanadi
-- ───────────────────────────────────────────────────────────────────────────

-- 8.1 registered_users — FAQAT egasi + admin (Public read/insert olib tashlanadi)
DROP POLICY IF EXISTS "Public read registered_users" ON public.registered_users;
DROP POLICY IF EXISTS "Public insert registered_users" ON public.registered_users;
DROP POLICY IF EXISTS "Admin all access" ON public.registered_users;
DROP POLICY IF EXISTS registered_users_select_owner ON public.registered_users;
DROP POLICY IF EXISTS registered_users_insert_own ON public.registered_users;
DROP POLICY IF EXISTS registered_users_update_owner ON public.registered_users;
DROP POLICY IF EXISTS registered_users_delete_admin ON public.registered_users;

CREATE POLICY registered_users_select_owner ON public.registered_users
  FOR SELECT USING (id::text = auth.uid()::text OR public.is_admin());
CREATE POLICY registered_users_insert_own ON public.registered_users
  FOR INSERT WITH CHECK (id::text = auth.uid()::text OR public.is_admin());
CREATE POLICY registered_users_update_owner ON public.registered_users
  FOR UPDATE USING (id::text = auth.uid()::text OR public.is_admin());
CREATE POLICY registered_users_delete_admin ON public.registered_users
  FOR DELETE USING (public.is_admin());

-- 8.2 usage_logs — email/ishlatish ma'lumotlari ommaga YO'Q
DROP POLICY IF EXISTS "Public read usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Public insert usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Admin all access" ON public.usage_logs;

DROP POLICY IF EXISTS usage_logs_select_owner ON public.usage_logs;
CREATE POLICY usage_logs_select_owner ON public.usage_logs
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS usage_logs_insert_own ON public.usage_logs;
CREATE POLICY usage_logs_insert_own ON public.usage_logs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS usage_logs_admin_all ON public.usage_logs;
CREATE POLICY usage_logs_admin_all ON public.usage_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8.3 auth_logs — kirish loglari ommaga YO'Q
DROP POLICY IF EXISTS "Public read auth_logs" ON public.auth_logs;
DROP POLICY IF EXISTS "Public insert auth_logs" ON public.auth_logs;
DROP POLICY IF EXISTS "Admin all access" ON public.auth_logs;

DROP POLICY IF EXISTS auth_logs_select_owner ON public.auth_logs;
CREATE POLICY auth_logs_select_owner ON public.auth_logs
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS auth_logs_insert_own ON public.auth_logs;
CREATE POLICY auth_logs_insert_own ON public.auth_logs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS auth_logs_admin_all ON public.auth_logs;
CREATE POLICY auth_logs_admin_all ON public.auth_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8.4 site_settings / pricing_plans — "Admin all access" USING(true) tuzatish
--     (public read qoladi — tariflar/sozlamalar ommaviy kontent)
DROP POLICY IF EXISTS "Admin all access" ON public.site_settings;
CREATE POLICY site_settings_admin_all ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin all access" ON public.pricing_plans;
CREATE POLICY pricing_plans_admin_all ON public.pricing_plans
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8.5 community_groups — maxfiy guruhlar a'zo bo'lmaganga ko'rinmaydi
DROP POLICY IF EXISTS "Everyone can view groups" ON public.community_groups;
CREATE POLICY community_groups_select_public ON public.community_groups
  FOR SELECT USING (
    is_private = false
    OR public.is_group_member(id)
    OR public.is_group_creator(id)
    OR public.is_admin()
  );

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 9: Storage — avatars + check-images bucket'lar
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('check-images', 'check-images', true)
ON CONFLICT (id) DO NOTHING;
